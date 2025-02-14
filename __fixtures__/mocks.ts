import {
  Branch,
  Endpoint,
  EndpointType,
  EndpointState,
  EndpointPoolerMode,
  Database,
  Role
} from '@neondatabase/api-client'

export function buildBranch(
  id: string,
  name: string,
  parentId?: string
): Branch {
  return {
    id,
    name,
    parent_id: parentId,
    project_id: 'test-project',
    current_state: 'active',
    state_changed_at: '2021-01-01T00:00:00Z',
    creation_source: 'github',
    default: true,
    protected: false,
    cpu_used_sec: 0,
    compute_time_seconds: 0,
    active_time_seconds: 0,
    written_data_bytes: 0,
    data_transfer_bytes: 0,
    created_at: '2021-01-01T00:00:00Z',
    updated_at: '2021-01-01T00:00:00Z'
  }
}

export function buildDatabase(id: number, name: string): Database {
  return {
    id,
    branch_id: 'test-branch',
    name,
    owner_name: 'test-owner',
    created_at: '2021-01-01T00:00:00Z',
    updated_at: '2021-01-01T00:00:00Z'
  }
}

export function buildRole(id: number, name: string): Role {
  return {
    branch_id: 'test-branch',
    name,
    protected: false,
    created_at: '2021-01-01T00:00:00Z',
    updated_at: '2021-01-01T00:00:00Z'
  }
}
export function buildEndpoint(id: string): Endpoint {
  return {
    id,
    host: `${id}.endpoint.com`,
    project_id: 'test-project',
    branch_id: 'test-branch',
    autoscaling_limit_min_cu: 0,
    autoscaling_limit_max_cu: 0,
    region_id: 'test-region',
    type: EndpointType.ReadWrite,
    current_state: EndpointState.Active,
    settings: {},
    pooler_mode: EndpointPoolerMode.Transaction,
    pooler_enabled: true,
    disabled: false,
    passwordless_access: true,
    creation_source: 'github',
    created_at: '2021-01-01T00:00:00Z',
    updated_at: '2021-01-01T00:00:00Z',
    proxy_host: 'test-proxy-host',
    suspend_timeout_seconds: 0,
    provisioner: 'test-provisioner'
  }
}
