import { vi } from 'vitest'

import type { create as createFn } from '../src/branch'

export const create = vi.fn<typeof createFn>()
