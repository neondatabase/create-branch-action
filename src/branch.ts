import {
  Branch,
  createApiClient,
  Endpoint,
  EndpointType,
  MaskingRule
} from '@neondatabase/api-client'

import { buildAnnotations } from './annotations.js'
import { version } from './version.js'

interface CreateResponse {
  databaseURL: string
  databaseURLPooled: string
  databaseHost: string
  databaseHostPooled: string
  password: string
  branchId: string
  createdBranch: boolean
  expiresAt?: string
}

export async function create(
  apiKey: string,
  apiHost: string,
  projectId: string,
  usePrisma: boolean,
  database: string,
  role: string,
  schemaOnly: boolean,
  sslMode: string,
  suspendTimeout: number,
  branchName?: string,
  parentBranch?: string,
  expiresAt?: string,
  maskingRules?: MaskingRule[]
): Promise<CreateResponse> {
  const client = createApiClient({
    apiKey,
    baseURL: apiHost,
    timeout: 10000,
    headers: {
      // action version from the package.json
      'User-Agent': `neon-create-branch-action v${version}`
    }
  })

  let branch: GetOrCreateBranchResponse
  try {
    branch = await getOrCreateBranch(client, {
      branchName,
      projectId,
      schemaOnly,
      parentBranch,
      suspendTimeout,
      expiresAt,
      maskingRules
    })
  } catch (error) {
    throw new Error(`Failed to create branch. ${String(error)}`)
  }

  let connectionInfo: ConnectionInfoResponse
  try {
    connectionInfo = await getConnectionInfo(client, {
      projectId,
      branchId: branch.id,
      usePrisma,
      sslMode,
      database,
      role
    })
  } catch (error) {
    throw new Error(`Failed to get connection info. ${String(error)}`)
  }

  return {
    databaseURL: connectionInfo.databaseUrl,
    databaseURLPooled: connectionInfo.databaseUrlPooled,
    databaseHost: connectionInfo.databaseHost,
    databaseHostPooled: connectionInfo.databaseHostPooled,
    password: connectionInfo.password,
    branchId: branch.id,
    createdBranch: branch.created,
    expiresAt: branch.expires_at
  }
}

export async function getBranch(
  client: ReturnType<typeof createApiClient>,
  projectId: string,
  branchIdentifier: string
): Promise<Branch | undefined> {
  const branchResponse = await client.listProjectBranches({
    projectId,
    search: branchIdentifier,
    // this is a limitation if the project has more than 10000 branches
    limit: 10000
  })

  if (branchResponse.data.branches.length === 0) {
    return
  }

  const branch = branchResponse.data.branches.find(
    (branch) =>
      branch.name === branchIdentifier || branch.id === branchIdentifier
  )
  if (!branch) {
    return
  }

  return branch
}

interface GetOrCreateBranchParams {
  branchName?: string
  projectId: string
  schemaOnly: boolean
  parentBranch?: string
  suspendTimeout: number
  expiresAt?: string
  maskingRules?: MaskingRule[]
}

type GetOrCreateBranchResponse = Branch & { created: boolean }

export async function getOrCreateBranch(
  client: ReturnType<typeof createApiClient>,
  params: GetOrCreateBranchParams
): Promise<GetOrCreateBranchResponse> {
  if (params.branchName) {
    const { projectId, branchName } = params
    const existingBranch = await getBranch(client, projectId, branchName)
    if (existingBranch) {
      if (params.maskingRules && params.maskingRules.length > 0) {
        throw new Error(
          'Cannot apply masking rules to an existing branch. Please create a new branch to apply masking rules.'
        )
      }
      return { ...existingBranch, created: false }
    }
  }
  // If the branch name is provided but it does
  // not exist, we will create a new branch with
  // the provided name.
  const createdBranch = await createBranch(client, params)
  return { ...createdBranch, created: true }
}

export async function createBranch(
  client: ReturnType<typeof createApiClient>,
  params: GetOrCreateBranchParams
): Promise<Branch> {
  const annotations = buildAnnotations()

  const {
    branchName,
    projectId,
    schemaOnly,
    parentBranch,
    suspendTimeout,
    expiresAt,
    maskingRules
  } = params

  let parentId: string | undefined
  if (parentBranch) {
    const parentBranchData = await getBranch(client, projectId, parentBranch)
    if (!parentBranchData) {
      throw new Error(`Parent branch ${parentBranch} not found`)
    }

    parentId = parentBranchData.id
  }

  const branchResponse =
    params.maskingRules && params.maskingRules.length > 0
      ? await client.createProjectBranchAnonymized(projectId, {
          branch_create: {
            branch: {
              name: branchName,
              parent_id: parentId,
              init_source: schemaOnly ? 'schema-only' : undefined,
              expires_at: expiresAt
            },

            endpoints: [
              {
                type: EndpointType.ReadWrite,
                suspend_timeout_seconds: suspendTimeout
              }
            ]
          },
          masking_rules: maskingRules,
          start_anonymization: true,
          annotation_value: annotations
        })
      : await client.createProjectBranch(projectId, {
          endpoints: [
            {
              type: EndpointType.ReadWrite,
              suspend_timeout_seconds: suspendTimeout
            }
          ],
          branch: {
            name: branchName,
            parent_id: parentId,
            init_source: schemaOnly ? 'schema-only' : undefined,
            expires_at: expiresAt
          },
          annotation_value: annotations
        })

  return branchResponse.data.branch
}

interface ConnectionInfoResponse {
  databaseUrl: string
  databaseUrlPooled: string
  databaseHost: string
  databaseHostPooled: string
  password: string
}

interface GetConnectionInfoParams {
  branchId: string
  projectId: string
  usePrisma: boolean
  sslMode: string
  database: string
  role: string
}

export async function getConnectionInfo(
  client: ReturnType<typeof createApiClient>,
  params: GetConnectionInfoParams
): Promise<ConnectionInfoResponse> {
  // get branch endpoints

  const { branchId, projectId, usePrisma, sslMode, database, role } = params

  let endpoint: Endpoint
  try {
    const endpoints = await client.listProjectBranchEndpoints(
      projectId,
      branchId
    )
    if (endpoints.data.endpoints.length === 0) {
      throw new Error('No endpoints found for branch')
    }

    endpoint = endpoints.data.endpoints[0]
  } catch (error) {
    throw new Error(`Failed to get branch endpoints. ${String(error)}`)
  }

  try {
    await client.getProjectBranchDatabase(projectId, branchId, database)
  } catch (error) {
    throw new Error(
      `Failed to get branch database ${database}. ${String(error)}`
    )
  }

  // get the role
  try {
    await client.getProjectBranchRole(projectId, branchId, role)
  } catch (error) {
    throw new Error(`Failed to get branch role ${role}. ${String(error)}`)
  }

  let password: string
  try {
    const passwordResposne = await client.getProjectBranchRolePassword(
      projectId,
      branchId,
      role
    )
    password = passwordResposne.data.password
  } catch (error) {
    throw new Error(
      `Failed to get branch password for role ${role}. ${String(error)}`
    )
  }

  const host = endpoint.host
  const hostPooled = endpoint.host.replace(endpoint.id, `${endpoint.id}-pooler`)

  const connectionString = new URL(`postgresql://${host}`)
  connectionString.pathname = database
  connectionString.username = role
  connectionString.password = password

  const connectionStringPooled = new URL(`postgresql://${hostPooled}`)
  connectionStringPooled.pathname = database
  connectionStringPooled.username = role
  connectionStringPooled.password = password

  if (usePrisma) {
    connectionString.searchParams.set('connect_timeout', '30')

    // pooled
    connectionStringPooled.searchParams.set('connect_timeout', '30')
    connectionStringPooled.searchParams.set('pool_timeout', '30')
    connectionStringPooled.searchParams.set('pgbouncer', 'true')
  }

  if (sslMode !== 'omit') {
    connectionString.searchParams.set('sslmode', sslMode)
    connectionStringPooled.searchParams.set('sslmode', sslMode)
  }

  return {
    databaseUrl: connectionString.toString(),
    databaseUrlPooled: connectionStringPooled.toString(),
    databaseHost: host,
    databaseHostPooled: hostPooled,
    password
  }
}
