import * as github from '@actions/github'
import {
  Branch,
  createApiClient,
  Endpoint,
  EndpointType
} from '@neondatabase/api-client'

import { version } from './version.js'

interface CreateResponse {
  databaseURL: string
  databaseURLPooled: string
  databaseHost: string
  databaseHostPooled: string
  password: string
  branchId: string
  createdBranch: boolean
}

export async function create(
  apiKey: string,
  apiHost: string,
  branchName: string,
  projectId: string,
  usePrisma: boolean,
  database: string,
  role: string,
  schemaOnly: boolean,
  sslMode: string,
  suspendTimeout: number,
  parentBranch?: string
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

  let branch: Branch & { created: boolean }
  try {
    branch = await getOrCreateBranch(client, {
      branchName,
      projectId,
      schemaOnly,
      parentBranch,
      suspendTimeout
    })
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create branch: ${error.message}`)
    } else {
      throw new Error('Failed to create branch: unknown error')
    }
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
    if (error instanceof Error) {
      throw new Error(`Failed to get connection info: ${error.message}`)
    } else {
      throw new Error('Failed to get connection info: unknown error')
    }
  }

  return {
    databaseURL: connectionInfo.databaseUrl,
    databaseURLPooled: connectionInfo.databaseUrlPooled,
    databaseHost: connectionInfo.databaseHost,
    databaseHostPooled: connectionInfo.databaseHostPooled,
    password: connectionInfo.password,
    branchId: branch.id,
    createdBranch: branch.created
  }
}

function buildAnnotations(): Record<string, string> {
  const { context } = github

  return {
    'github-commit-repo': context.repo.repo,
    'github-commit-author-login': context.actor,
    'github-commit-sha': context.payload.head_commit?.id || '',
    'github-commit-message': context.payload.head_commit?.message || '',
    'github-pr-number': context.payload.pull_request?.number.toString() || '',
    'github-pr-title': context.payload.pull_request?.title || '',
    'github-commit-ref':
      context.ref || context.payload.pull_request?.head?.ref || '',
    'github-action-ref': context.ref || ''
  }
}

async function getBranch(
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
  branchName: string
  projectId: string
  schemaOnly: boolean
  parentBranch?: string
  suspendTimeout: number
}

async function getOrCreateBranch(
  client: ReturnType<typeof createApiClient>,
  params: GetOrCreateBranchParams
): Promise<Branch & { created: boolean }> {
  const { projectId, branchName } = params
  const existingBranch = await getBranch(client, projectId, branchName)
  if (existingBranch) {
    return { ...existingBranch, created: false }
  }

  const createdBranch = await createBranch(client, params)
  return { ...createdBranch, created: true }
}

async function createBranch(
  client: ReturnType<typeof createApiClient>,
  params: GetOrCreateBranchParams
): Promise<Branch> {
  const annotations = buildAnnotations()

  const { branchName, projectId, schemaOnly, parentBranch, suspendTimeout } =
    params

  let parentId: string | undefined
  if (parentBranch) {
    const parentBranchData = await getBranch(client, projectId, parentBranch)
    if (!parentBranchData) {
      throw new Error(`Parent branch ${parentBranch} not found`)
    }

    parentId = parentBranchData.id
  }

  const branchResponse = await client.createProjectBranch(projectId, {
    endpoints: [
      {
        type: EndpointType.ReadWrite,
        suspend_timeout_seconds: suspendTimeout
      }
    ],
    branch: {
      name: branchName,
      parent_id: parentId,
      init_source: schemaOnly ? 'schema-only' : undefined
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

async function getConnectionInfo(
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
    if (error instanceof Error) {
      throw new Error(`Failed to get branch endpoints: ${error.message}`)
    } else {
      throw new Error('Failed to get branch endpoints: unknown error')
    }
  }

  try {
    await client.getProjectBranchDatabase(projectId, branchId, database)
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Database ${database} not found: ${error.message}`)
    } else {
      throw new Error(`Database ${database} not found: unknown error`)
    }
  }

  // get the role
  try {
    await client.getProjectBranchRole(projectId, branchId, role)
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Role ${role} not found: ${error.message}`)
    } else {
      throw new Error(`Role ${role} not found: unknown error`)
    }
  }

  const passwordResposne = await client.getProjectBranchRolePassword(
    projectId,
    branchId,
    role
  )

  const password = passwordResposne.data.password

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
