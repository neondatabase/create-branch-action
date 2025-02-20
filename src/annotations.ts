import { context } from '@actions/github'

export function buildAnnotations(): Record<string, string> {
  const annotations: Record<string, string> = {}

  // Helper to add non-empty values
  const addIfNotEmpty = (key: string, value: string | undefined) => {
    if (value) annotations[key] = value
  }

  // Repo is always available through context.repo
  annotations['github-commit-repo'] =
    `${context.repo.owner}/${context.repo.repo}`

  // Add other fields only if they have values
  addIfNotEmpty('github-commit-author-login', context.actor)
  addIfNotEmpty('github-commit-sha', context.payload.head_commit?.id)
  addIfNotEmpty('github-commit-message', context.payload.head_commit?.message)
  addIfNotEmpty(
    'github-pr-number',
    context.payload.pull_request?.number?.toString()
  )
  addIfNotEmpty('github-pr-title', context.payload.pull_request?.title)
  addIfNotEmpty(
    'github-commit-ref',
    context.ref || context.payload.pull_request?.head?.ref
  )
  addIfNotEmpty('github-action-ref', context.action)

  return annotations
}
