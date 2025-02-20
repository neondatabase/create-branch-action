import { beforeEach, describe, expect, it, vi } from 'vitest'

import { create } from '../__fixtures__/branch'
import * as core from '../__fixtures__/core'

const { run } = await import('../src/main.js')

vi.mock('@actions/core', () => core)
vi.mock('../src/branch', () => ({ create }))

describe('action', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('invalid api host', async () => {
    core.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'api_host':
          return 'not a url'
        default:
          return ''
      }
    })

    await run()
    expect(core.setFailed).toHaveBeenNthCalledWith(
      1,
      'API host must be a valid URL'
    )
    expect(core.error).not.toHaveBeenCalled()
  })

  it('invalid ssl mode', async () => {
    core.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'ssl':
          return 'invalid'
        default:
          return 'http://console.neon.tech/api/v2'
      }
    })

    await run()
    expect(core.setFailed).toHaveBeenNthCalledWith(
      1,
      'Invalid SSL mode: invalid'
    )
    expect(core.error).not.toHaveBeenCalled()
  })

  it('invalid suspend timeout', async () => {
    core.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'suspend_timeout':
          return 'invalid'
        case 'branch_type':
          return 'default'
        case 'api_host':
          return 'http://console.neon.tech/api/v2'
        case 'ssl':
          return 'require'
        default:
          return ''
      }
    })

    await run()
    expect(core.setFailed).toHaveBeenNthCalledWith(
      1,
      'Suspend timeout must be a number'
    )
    expect(core.error).not.toHaveBeenCalled()
  })

  it('create', async () => {
    core.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'api_host':
          return 'http://console.neon.tech/api/v2'
        case 'api_key':
          return 'apiKey'
        case 'project_id':
          return 'projectId'
        case 'branch_name':
          return 'branchName'
        case 'database':
          return 'postgres'
        case 'role':
          return 'postgres'
        case 'branch_type':
          return 'default'
        case 'suspend_timeout':
          return '0'
        case 'ssl':
          return 'require'
        default:
          return ''
      }
    })

    create.mockImplementation(() =>
      Promise.resolve({
        databaseURL: 'postgresql://postgres:password@e1.endpoint.com/postgres',
        databaseURLPooled:
          'postgresql://postgres:password@e1-pooler.endpoint.com/postgres',
        databaseHost: 'e1.endpoint.com',
        databaseHostPooled: 'e1-pooler.endpoint.com',
        password: 'password',
        branchId: '1',
        createdBranch: true
      })
    )

    await run()
    expect(create).toHaveBeenCalledWith(
      'apiKey',
      'http://console.neon.tech/api/v2',
      'projectId',
      false,
      'postgres',
      'postgres',
      false,
      'require',
      0,
      'branchName',
      undefined
    )

    expect(core.setFailed).not.toHaveBeenCalled()
    expect(core.info).toHaveBeenNthCalledWith(
      1,
      'Branch branchName created successfully'
    )
    expect(core.setOutput).toHaveBeenCalledTimes(7) // 7 outputs
    expect(core.setOutput).toHaveBeenNthCalledWith(1, 'created', true)
  })

  it('create existing branch', async () => {
    core.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'api_host':
          return 'http://console.neon.tech/api/v2'
        case 'api_key':
          return 'apiKey'
        case 'project_id':
          return 'projectId'
        case 'branch_name':
          return 'branchName'
        case 'database':
          return 'postgres'
        case 'role':
          return 'postgres'
        case 'branch_type':
          return 'default'
        case 'suspend_timeout':
          return '0'
        case 'ssl':
          return 'require'
        default:
          return ''
      }
    })

    create.mockImplementation(() =>
      Promise.resolve({
        databaseURL: 'postgresql://postgres:password@e1.endpoint.com/postgres',
        databaseURLPooled:
          'postgresql://postgres:password@e1-pooler.endpoint.com/postgres',
        databaseHost: 'e1.endpoint.com',
        databaseHostPooled: 'e1-pooler.endpoint.com',
        password: 'password',
        branchId: '1',
        createdBranch: false
      })
    )

    await run()
    expect(create).toHaveBeenCalledWith(
      'apiKey',
      'http://console.neon.tech/api/v2',
      'projectId',
      false,
      'postgres',
      'postgres',
      false,
      'require',
      0,
      'branchName',
      undefined
    )

    expect(core.setFailed).not.toHaveBeenCalled()
    expect(core.setOutput).toHaveBeenNthCalledWith(1, 'created', false)
    expect(core.setOutput).toHaveBeenCalledTimes(7) // 7 outputs
  })
})
