# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Overview

This is the Neon Create Branch GitHub Action - a TypeScript-based GitHub Action
that creates Neon database branches dynamically in CI/CD workflows. If a branch
with the specified name already exists, it returns the existing branch details.

## Commands

```bash
# Install dependencies
bun install

# Run tests
bun run test

# Run a single test file
bunx vitest run __tests__/main.test.ts

# Lint
bun run lint

# Format code
bun run format:write

# Build and bundle for distribution (generates dist/index.js)
bun run bundle

# Run action locally (requires .env file - copy from .env.example)
bun run local-action

# Full CI check (format, lint, test, coverage, bundle)
bun run all
```

## Architecture

### Entry Point Flow

- `src/index.ts` → imports and calls `run()` from `src/main.ts`
- `src/main.ts` → parses GitHub Action inputs, validates them, calls `create()`
  from `src/branch.ts`, and sets outputs
- `src/branch.ts` → core logic for interacting with Neon API:
  - `create()` - main orchestrator: creates/gets branch, fetches connection
    info, optionally retrieves auth URL
  - `getOrCreateBranch()` - idempotent branch creation (returns existing or
    creates new)
  - `createBranch()` - creates branch via Neon API (supports anonymized branches
    with masking rules)
  - `getConnectionInfo()` - builds connection strings (regular and pooled) from
    endpoint data

### Key Dependencies

- `@neondatabase/api-client` - Neon's official API client for branch/endpoint
  operations
- `@actions/core` - GitHub Actions toolkit for inputs/outputs/logging

### Test Structure

- Tests use Vitest with mocked `@actions/core` and `src/branch.ts`
- Fixtures in `__fixtures__/` provide mock implementations
- Tests focus on input validation and output setting in `main.ts`

### Build Output

The action is bundled into `dist/index.js` using Rollup. This file must be
committed - GitHub runs actions directly from the repository.
