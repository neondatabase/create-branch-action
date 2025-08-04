import { EndpointType, createApiClient } from '@neondatabase/api-client'
import { expect, vi, describe, it, beforeEach } from 'vitest'

import { apiResponse } from '../__fixtures__/api-client'
import {
  buildBranch,
  buildEndpoint,
  buildDatabase,
  buildRole
} from '../__fixtures__/mocks'
import {
  getBranch,
  createBranch,
  getOrCreateBranch,
  getConnectionInfo,
  create
} from '../src/branch'

import type { Api } from '@neondatabase/api-client'

vi.mock('@actions/github')
vi.mock('@neondatabase/api-client')
vi.mock('../src/annotations', () => ({
  buildAnnotations: () => ({})
}))

const ERROR_MESSAGES = {
  NO_ENDPOINTS: 'No endpoints found for branch',
  DATABASE_NOT_FOUND: (name: string) => `Failed to get branch database ${name}`,
  ROLE_NOT_FOUND: (name: string) => `Failed to get branch role ${name}`,
  PASSWORD_NOT_FOUND: (name: string) =>
    `Failed to get branch password for role ${name}`,
  PARENT_NOT_FOUND: (name: string) => `Parent branch ${name} not found`
}

describe('branch actions', () => {
  const mockClient = {
    listProjectBranches: vi.fn(),
    createProjectBranch: vi.fn(),
    listProjectBranchEndpoints: vi.fn(),
    getProjectBranchDatabase: vi.fn(),
    getProjectBranchRole: vi.fn(),
    getProjectBranchRolePassword: vi.fn()
  }

  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('getBranch', () => {
    it('should return the branch', async () => {
      mockClient.listProjectBranches.mockResolvedValue(
        apiResponse(200, {
          branches: [buildBranch('1', 'branchName')]
        })
      )
      const branch = await getBranch(
        mockClient as unknown as Api<unknown>,
        'projectId',
        'branchName'
      )
      expect(branch).toBeDefined()
    })

    it('should return undefined if the branch is not found, empty branch list', async () => {
      mockClient.listProjectBranches.mockResolvedValue(
        apiResponse(200, {
          branches: []
        })
      )
      const branch = await getBranch(
        mockClient as unknown as Api<unknown>,
        'projectId',
        'branchName'
      )
      expect(branch).toBeUndefined()
    })

    it('should return undefined if the branch is not found by name', async () => {
      mockClient.listProjectBranches.mockResolvedValue(
        apiResponse(200, {
          branches: [buildBranch('1', 'branchName')]
        })
      )
      const branch = await getBranch(
        mockClient as unknown as Api<unknown>,
        'projectId',
        'branch-name'
      )
      expect(branch).toBeUndefined()
    })
  })

  describe('createBranch', () => {
    it('should fail if parent branch is not found', async () => {
      mockClient.listProjectBranches.mockResolvedValue(
        apiResponse(200, {
          branches: []
        })
      )

      await expect(
        createBranch(mockClient as unknown as Api<unknown>, {
          branchName: 'branchName',
          projectId: 'projectId',
          parentBranch: 'parentBranch',
          schemaOnly: false,
          suspendTimeout: 0
        })
      ).rejects.toThrowError(ERROR_MESSAGES.PARENT_NOT_FOUND('parentBranch'))
    })

    it('should create a branch with parent branch specified', async () => {
      mockClient.listProjectBranches.mockResolvedValue(
        apiResponse(200, {
          branches: [buildBranch('1', 'parentBranch')]
        })
      )

      mockClient.createProjectBranch.mockResolvedValue(
        apiResponse(200, {
          branch: buildBranch('2', 'newBranch', '1')
        })
      )

      const branch = await createBranch(mockClient as unknown as Api<unknown>, {
        branchName: 'newBranch',
        projectId: 'projectId',
        parentBranch: 'parentBranch',
        schemaOnly: false,
        suspendTimeout: 0
      })
      expect(branch).toBeDefined()
      expect(mockClient.createProjectBranch).toHaveBeenCalledWith(
        'projectId',
        expect.objectContaining({
          branch: expect.objectContaining({
            parent_id: '1',
            init_source: undefined,
            name: 'newBranch'
          }),
          annotation_value: {},
          endpoints: [
            {
              type: EndpointType.ReadWrite,
              suspend_timeout_seconds: 0
            }
          ]
        })
      )
    })

    it('should create a branch without parent branch', async () => {
      mockClient.createProjectBranch.mockResolvedValue(
        apiResponse(200, {
          branch: buildBranch('2', 'newBranch')
        })
      )

      const branch = await createBranch(mockClient as unknown as Api<unknown>, {
        branchName: 'newBranch',
        projectId: 'projectId',
        schemaOnly: false,
        suspendTimeout: 0
      })

      expect(branch).toBeDefined()
      expect(mockClient.createProjectBranch).toHaveBeenCalledWith(
        'projectId',
        expect.objectContaining({
          branch: expect.objectContaining({
            parent_id: undefined,
            init_source: undefined,
            name: 'newBranch'
          }),
          annotation_value: {},
          endpoints: [
            {
              type: EndpointType.ReadWrite,
              suspend_timeout_seconds: 0
            }
          ]
        })
      )
    })

    it('should create a branch with schema only', async () => {
      mockClient.createProjectBranch.mockResolvedValue(
        apiResponse(200, {
          branch: buildBranch('2', 'newBranch')
        })
      )

      const branch = await createBranch(mockClient as unknown as Api<unknown>, {
        branchName: 'newBranch',
        projectId: 'projectId',
        schemaOnly: true,
        suspendTimeout: 0
      })

      expect(branch).toBeDefined()
      expect(mockClient.createProjectBranch).toHaveBeenCalledWith(
        'projectId',
        expect.objectContaining({
          branch: expect.objectContaining({
            init_source: 'schema-only',
            name: 'newBranch'
          }),
          annotation_value: {},
          endpoints: [
            {
              type: EndpointType.ReadWrite,
              suspend_timeout_seconds: 0
            }
          ]
        })
      )
    })

    it('should create a branch with suspend timeout', async () => {
      mockClient.createProjectBranch.mockResolvedValue(
        apiResponse(200, {
          branch: buildBranch('2', 'newBranch')
        })
      )

      const branch = await createBranch(mockClient as unknown as Api<unknown>, {
        branchName: 'newBranch',
        projectId: 'projectId',
        suspendTimeout: 100,
        schemaOnly: false
      })

      expect(branch).toBeDefined()
      expect(mockClient.createProjectBranch).toHaveBeenCalledWith(
        'projectId',
        expect.objectContaining({
          branch: expect.objectContaining({
            name: 'newBranch'
          }),
          annotation_value: {},
          endpoints: [
            {
              type: EndpointType.ReadWrite,
              suspend_timeout_seconds: 100
            }
          ]
        })
      )
    })
  })

  describe('getOrCreateBranch', () => {
    it('should return a branch if it exists', async () => {
      mockClient.listProjectBranches.mockResolvedValue(
        apiResponse(200, {
          branches: [buildBranch('1', 'branchName')]
        })
      )

      const branch = await getOrCreateBranch(
        mockClient as unknown as Api<unknown>,
        {
          branchName: 'branchName',
          projectId: 'projectId',
          schemaOnly: false,
          suspendTimeout: 0
        }
      )

      expect(branch).toBeDefined()
      expect(branch.created).toBe(false)
    })

    it('should create a branch if it does not exist', async () => {
      mockClient.listProjectBranches.mockResolvedValue(
        apiResponse(200, {
          branches: []
        })
      )

      mockClient.createProjectBranch.mockResolvedValue(
        apiResponse(200, {
          branch: buildBranch('2', 'newBranch')
        })
      )

      const branch = await getOrCreateBranch(
        mockClient as unknown as Api<unknown>,
        {
          branchName: 'newBranch',
          projectId: 'projectId',
          schemaOnly: false,
          suspendTimeout: 0
        }
      )

      expect(branch).toBeDefined()
      expect(branch.created).toBe(true)
    })
  })

  describe('getConnectionInfo', () => {
    it('should fail if the branch has no endpoints', async () => {
      mockClient.listProjectBranchEndpoints.mockResolvedValue(
        apiResponse(200, {
          endpoints: []
        })
      )

      await expect(
        getConnectionInfo(mockClient as unknown as Api<unknown>, {
          branchId: '1',
          projectId: 'projectId',
          usePrisma: false,
          sslMode: 'require',
          database: 'neondb',
          role: 'neondb_owner'
        })
      ).rejects.toThrowError(
        `Failed to get branch endpoints. Error: ${ERROR_MESSAGES.NO_ENDPOINTS}`
      )
    })

    it('should fail if the database is not found', async () => {
      mockClient.listProjectBranchEndpoints.mockResolvedValue(
        apiResponse(200, {
          endpoints: [buildEndpoint('e1')]
        })
      )

      mockClient.getProjectBranchDatabase.mockRejectedValue(
        new Error(ERROR_MESSAGES.DATABASE_NOT_FOUND('neondb'))
      )

      await expect(
        getConnectionInfo(mockClient as unknown as Api<unknown>, {
          branchId: '1',
          projectId: 'projectId',
          usePrisma: false,
          sslMode: 'require',
          database: 'neondb',
          role: 'neondb_owner'
        })
      ).rejects.toThrowError(ERROR_MESSAGES.DATABASE_NOT_FOUND('neondb'))
    })

    it('should fail if the role is not found', async () => {
      mockClient.listProjectBranchEndpoints.mockResolvedValue(
        apiResponse(200, {
          endpoints: [buildEndpoint('e1')]
        })
      )

      mockClient.getProjectBranchDatabase.mockResolvedValue(
        apiResponse(200, {
          database: buildDatabase(1, 'postgres')
        })
      )

      mockClient.getProjectBranchRole.mockRejectedValue(
        new Error(ERROR_MESSAGES.ROLE_NOT_FOUND('neondb_owner'))
      )

      await expect(
        getConnectionInfo(mockClient as unknown as Api<unknown>, {
          branchId: '1',
          projectId: 'projectId',
          usePrisma: false,
          sslMode: 'require',
          database: 'neondb',
          role: 'neondb_owner'
        })
      ).rejects.toThrowError(ERROR_MESSAGES.ROLE_NOT_FOUND('neondb_owner'))
    })

    it('should fail if the password is not found', async () => {
      mockClient.listProjectBranchEndpoints.mockResolvedValue(
        apiResponse(200, {
          endpoints: [buildEndpoint('1')]
        })
      )

      mockClient.getProjectBranchDatabase.mockResolvedValue(
        apiResponse(200, {
          database: buildDatabase(1, 'postgres')
        })
      )

      mockClient.getProjectBranchRole.mockResolvedValue(
        apiResponse(200, {
          role: buildRole(1, 'postgres')
        })
      )

      mockClient.getProjectBranchRolePassword.mockRejectedValue(
        new Error(ERROR_MESSAGES.PASSWORD_NOT_FOUND('neondb_owner'))
      )

      await expect(
        getConnectionInfo(mockClient as unknown as Api<unknown>, {
          branchId: '1',
          projectId: 'projectId',
          usePrisma: false,
          sslMode: 'require',
          database: 'neondb',
          role: 'neondb_owner'
        })
      ).rejects.toThrowError(ERROR_MESSAGES.PASSWORD_NOT_FOUND('neondb_owner'))
    })

    it('should return the connection info', async () => {
      mockClient.listProjectBranchEndpoints.mockResolvedValue(
        apiResponse(200, {
          endpoints: [buildEndpoint('e1')]
        })
      )

      mockClient.getProjectBranchDatabase.mockResolvedValue(
        apiResponse(200, {
          database: buildDatabase(1, 'postgres')
        })
      )

      mockClient.getProjectBranchRole.mockResolvedValue(
        apiResponse(200, {
          role: buildRole(1, 'postgres')
        })
      )

      mockClient.getProjectBranchRolePassword.mockResolvedValue(
        apiResponse(200, {
          password: 'password'
        })
      )

      const connectionInfo = await getConnectionInfo(
        mockClient as unknown as Api<unknown>,
        {
          branchId: '1',
          projectId: 'projectId',
          usePrisma: false,
          sslMode: 'require',
          database: 'neondb',
          role: 'neondb_owner'
        }
      )

      expect(connectionInfo).toBeDefined()
      expect(connectionInfo.databaseUrl).toBe(
        'postgresql://neondb_owner:password@e1.endpoint.com/neondb?sslmode=require'
      )
      expect(connectionInfo.databaseUrlPooled).toBe(
        'postgresql://neondb_owner:password@e1-pooler.endpoint.com/neondb?sslmode=require'
      )
      expect(connectionInfo.databaseHost).toBe('e1.endpoint.com')
      expect(connectionInfo.databaseHostPooled).toBe('e1-pooler.endpoint.com')
      expect(connectionInfo.password).toBe('password')
    })

    it('should return the connection info with prisma', async () => {
      mockClient.listProjectBranchEndpoints.mockResolvedValue(
        apiResponse(200, {
          endpoints: [buildEndpoint('e1')]
        })
      )

      mockClient.getProjectBranchDatabase.mockResolvedValue(
        apiResponse(200, {
          database: buildDatabase(1, 'postgres')
        })
      )

      mockClient.getProjectBranchRole.mockResolvedValue(
        apiResponse(200, {
          role: buildRole(1, 'postgres')
        })
      )

      mockClient.getProjectBranchRolePassword.mockResolvedValue(
        apiResponse(200, {
          password: 'password'
        })
      )

      const connectionInfo = await getConnectionInfo(
        mockClient as unknown as Api<unknown>,
        {
          branchId: '1',
          projectId: 'projectId',
          usePrisma: true,
          sslMode: 'omit',
          database: 'neondb',
          role: 'neondb_owner'
        }
      )

      expect(connectionInfo).toBeDefined()
      expect(connectionInfo.databaseUrl).toBe(
        'postgresql://neondb_owner:password@e1.endpoint.com/neondb?connect_timeout=30'
      )
      expect(connectionInfo.databaseUrlPooled).toBe(
        'postgresql://neondb_owner:password@e1-pooler.endpoint.com/neondb?connect_timeout=30&pool_timeout=30&pgbouncer=true'
      )
      expect(connectionInfo.databaseHost).toBe('e1.endpoint.com')
      expect(connectionInfo.databaseHostPooled).toBe('e1-pooler.endpoint.com')
      expect(connectionInfo.password).toBe('password')
    })
  })

  describe('create', () => {
    beforeEach(() => {
      vi.mocked(createApiClient).mockReturnValue(
        mockClient as unknown as ReturnType<typeof createApiClient>
      )
    })

    it('should create a branch', async () => {
      mockClient.listProjectBranches.mockResolvedValue(
        apiResponse(200, {
          branches: []
        })
      )

      mockClient.createProjectBranch.mockResolvedValue(
        apiResponse(200, {
          branch: buildBranch('1', 'branchName')
        })
      )

      mockClient.listProjectBranchEndpoints.mockResolvedValue(
        apiResponse(200, {
          endpoints: [buildEndpoint('e1')]
        })
      )

      mockClient.getProjectBranchDatabase.mockResolvedValue(
        apiResponse(200, {
          database: buildDatabase(1, 'postgres')
        })
      )

      mockClient.getProjectBranchRole.mockResolvedValue(
        apiResponse(200, {
          role: buildRole(1, 'postgres')
        })
      )

      mockClient.getProjectBranchRolePassword.mockResolvedValue(
        apiResponse(200, {
          password: 'password'
        })
      )

      const response = await create(
        'apiKey',
        'apiHost',
        'projectId',
        false,
        'neondb',
        'neondb_owner',
        false,
        'require',
        0,
        'branchName'
      )

      expect(response).toBeDefined()
      expect(response.databaseURL).toBe(
        'postgresql://neondb_owner:password@e1.endpoint.com/neondb?sslmode=require'
      )
      expect(response.databaseURLPooled).toBe(
        'postgresql://neondb_owner:password@e1-pooler.endpoint.com/neondb?sslmode=require'
      )
      expect(response.databaseHost).toBe('e1.endpoint.com')
      expect(response.databaseHostPooled).toBe('e1-pooler.endpoint.com')
      expect(response.password).toBe('password')
      expect(response.branchId).toBe('1')
      expect(response.expiresAt).toBeUndefined()
    })
  })

  describe('create with expiration time', () => {
    const expiresAt = '2024-01-01T00:00:00Z'

    beforeEach(() => {
      vi.mocked(createApiClient).mockReturnValue(
        mockClient as unknown as ReturnType<typeof createApiClient>
      )
    })

    it('should create a branch', async () => {
      mockClient.listProjectBranches.mockResolvedValue(
        apiResponse(200, {
          branches: []
        })
      )

      mockClient.createProjectBranch.mockResolvedValue(
        apiResponse(200, {
          branch: buildBranch('1', 'branchName', undefined, expiresAt)
        })
      )

      mockClient.listProjectBranchEndpoints.mockResolvedValue(
        apiResponse(200, {
          endpoints: [buildEndpoint('e1')]
        })
      )

      mockClient.getProjectBranchDatabase.mockResolvedValue(
        apiResponse(200, {
          database: buildDatabase(1, 'postgres')
        })
      )

      mockClient.getProjectBranchRole.mockResolvedValue(
        apiResponse(200, {
          role: buildRole(1, 'postgres')
        })
      )

      mockClient.getProjectBranchRolePassword.mockResolvedValue(
        apiResponse(200, {
          password: 'password'
        })
      )

      const response = await create(
        'apiKey',
        'apiHost',
        'projectId',
        false,
        'neondb',
        'neondb_owner',
        false,
        'require',
        0,
        'branchName',
        undefined,
        expiresAt
      )

      expect(response).toBeDefined()
      expect(response.databaseURL).toBe(
        'postgresql://neondb_owner:password@e1.endpoint.com/neondb?sslmode=require'
      )
      expect(response.databaseURLPooled).toBe(
        'postgresql://neondb_owner:password@e1-pooler.endpoint.com/neondb?sslmode=require'
      )
      expect(response.databaseHost).toBe('e1.endpoint.com')
      expect(response.databaseHostPooled).toBe('e1-pooler.endpoint.com')
      expect(response.password).toBe('password')
      expect(response.branchId).toBe('1')
      expect(response.expiresAt).toBe(expiresAt)
    })
  })
})
