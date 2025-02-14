# 🔍 Neon GitHub Action Development

Development template from
[https://github.com/actions/typescript-action](https://github.com/actions/typescript-action).

## Initial Setup

After you've cloned the repository to your local machine or codespace, you'll
need to perform some initial setup steps before you can develop your action.

> [!NOTE]
>
> You'll need to have a reasonably modern version of
> [Node.js](https://nodejs.org) handy (20.x or later should work!). If you are
> using a version manager like [`nodenv`](https://github.com/nodenv/nodenv) or
> [`nvm`](https://github.com/nvm-sh/nvm), this template has a `.node-version`
> file at the root of the repository that will be used to automatically switch
> to the correct version when you `cd` into the repository. Additionally, this
> `.node-version` file is used by GitHub Actions in any `actions/setup-node`
> actions.

1. :hammer_and_wrench: Install the dependencies

   ```bash
   bun install
   ```

1. :building_construction: Package the TypeScript for distribution

   ```bash
   bun run bundle
   ```

1. :white_check_mark: Run the tests

   ```bash
   $ bun run test

   PASS  ./index.test.js
    index
      ✓ calls run when imported (3 ms)

   PASS __tests__/main.test.ts
    action
      ✓ invalid api host (2 ms)
      ✓ invalid database input (1 ms)
      ✓ valid inputs (11 ms)

   PASS __tests__/diff.test.ts
    diff
      ✓ should throw an error if the project does not exist (9 ms)
      ✓ should throw an error if the branch is not found (1 ms)
      ✓ should throw an error if the branch has no parent
      ✓ works with valid project and branch (2 ms)
   ...
   ```

1. :white_check_mark: Run the action locally with `local-action`

   ```bash
   $ cp .env.example .env
   # modify your environment variables
   $ bun run local-action
   ```

   Currently, the action skips the create comment part, in the future we can
   have a specific repository to test this flow entirely in the CI.
