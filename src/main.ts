import * as core from '@actions/core'

import { create } from './branch.js'
import { isBranchType, isSSLMode } from './utils.js'

const urlRegex = /https?:\/\/[^\s/$.?#].[^\s]*/i

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    // Required input fields
    const apiKey: string = core.getInput('api_key', {
      required: true,
      trimWhitespace: true
    })
    const projectId: string = core.getInput('project_id', {
      required: true,
      trimWhitespace: true
    })

    // Optional fields but with default value
    const apiHost: string = core.getInput('api_host', { trimWhitespace: true }) // defaults to https://console.neon.tech/api/v2
    const usePrisma: boolean =
      core.getInput('prisma', {
        trimWhitespace: true
      }) === 'true' // defaults to false
    const database: string = core.getInput('database', {
      trimWhitespace: true
    }) // defaults to 'neondb'
    const role = core.getInput('role', {
      trimWhitespace: true
    }) // defaults to 'neondb_owner'
    const branchType = core.getInput('branch_type', {
      trimWhitespace: true
    }) // defaults to 'default'
    const sslMode = core.getInput('ssl', {
      trimWhitespace: true
    }) // defaults to 'require'
    const suspendTimeoutString = core.getInput('suspend_timeout', {
      trimWhitespace: true
    }) // defaults to 0

    // Optional fields without default value
    let parentBranch: string | undefined = core.getInput('parent_branch', {
      trimWhitespace: true
    })
    if (parentBranch === '') {
      parentBranch = undefined
    }
    let branchName: string | undefined = core.getInput('branch_name', {
      trimWhitespace: true
    })
    if (branchName === '') {
      branchName = undefined
    }

    if (!urlRegex.test(apiHost)) {
      throw new Error('API host must be a valid URL')
    }

    if (!isSSLMode(sslMode)) {
      throw new Error(`Invalid SSL mode: ${sslMode}`)
    }

    if (!isBranchType(branchType)) {
      throw new Error(`Invalid branch type: ${branchType}`)
    }

    const suspendTimeout = parseInt(suspendTimeoutString, 10)
    if (isNaN(suspendTimeout)) {
      throw new Error('Suspend timeout must be a number')
    }

    const result = await create(
      apiKey,
      apiHost,
      projectId,
      usePrisma,
      database,
      role,
      branchType === 'schema-only',
      sslMode,
      suspendTimeout,
      branchName,
      parentBranch
    )

    if (result.createdBranch) {
      core.info(`Branch ${branchName} created successfully`)
      core.setOutput('created', true)
    } else {
      core.info(`Branch ${branchName} already exists, reusing existing branch`)
      core.setOutput('created', false)
    }

    core.setOutput('db_url', result.databaseURL)
    core.setOutput('db_url_pooled', result.databaseURLPooled)
    core.setOutput('db_host', result.databaseHost)
    core.setOutput('db_host_pooled', result.databaseHostPooled)
    core.setOutput('password', result.password)
    core.setOutput('branch_id', result.branchId)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
    else core.setFailed(`Unknown error: ${error}`)
  }
}
