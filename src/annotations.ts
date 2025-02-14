import { context } from '@actions/github'

export function buildAnnotations(): Record<string, string> {
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
