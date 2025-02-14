import { vi } from 'vitest'

import type { listProjects as listProjectsFn } from '../src/list'

export const listProjects = vi.fn<typeof listProjectsFn>()
