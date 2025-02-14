import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as core from '../__fixtures__/core'
import { listProjects } from '../__fixtures__/list'

const { run } = await import('../src/main.js')

vi.mock('@actions/core', () => core)
vi.mock('../src/list', () => ({ listProjects }))

const defaultProjects = [
  {
    id: 'project1',
    platform_id: 'aws',
    region_id: 'us-east-1',
    name: 'project1',
    provisioner: 'k8s-pod',
    pg_version: 15,
    proxy_host: 'proxy.host',
    branch_logical_size_limit: 100,
    branch_logical_size_limit_bytes: 100,
    store_passwords: true,
    active_time: 0,
    cpu_used_sec: 0,
    creation_source: 'console',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    owner_id: 'owner1'
  },
  {
    id: 'project2',
    platform_id: 'aws',
    region_id: 'us-east-1',
    name: 'project2',
    provisioner: 'k8s-pod',
    pg_version: 15,
    proxy_host: 'proxy.host',
    branch_logical_size_limit: 100,
    branch_logical_size_limit_bytes: 100,
    store_passwords: true,
    active_time: 0,
    cpu_used_sec: 0,
    creation_source: 'console',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    owner_id: 'owner2'
  }
]

describe('action', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    listProjects.mockReturnValue(Promise.resolve(defaultProjects))
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

  it('valid inputs', async () => {
    core.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'api_host':
          return 'https://console.neon.tech/api/v2'
        case 'api_key':
          return 'test-api-key'
        default:
          return ''
      }
    })

    await run()
    expect(listProjects).toHaveBeenCalled()
    expect(core.setFailed).not.toHaveBeenCalled()
    expect(core.error).not.toHaveBeenCalled()
    expect(core.setOutput).toHaveBeenCalledTimes(1)
    expect(core.setOutput).toHaveBeenNthCalledWith(
      1,
      'projects',
      defaultProjects.map((p) => p.name).join(', ')
    )
  })
})
