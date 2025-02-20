import { AxiosHeaders } from 'axios'

import type { AxiosResponse } from 'axios'

export function apiResponse<T>(status: number, data: T): AxiosResponse<T> {
  return {
    status,
    data,
    statusText: '',
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() }
  }
}

export function githubApiResponse<T, S extends 200 | 201 | 204>(
  data: T,
  status: S
) {
  return { data, headers: {}, status, url: 'http://example.com' }
}
