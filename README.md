# 🚀 Neon Create Branch Action

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./docs/logos/neon-logo-dark.svg">
    <img alt="Neon logo" src="./docs/logos/neon-logo-light.svg">
  </picture>
</p>

This action creates a new Neon branch in your Neon project. If a branch with the specified name already exists, it returns the details of the existing branch.

It supports workflows where you need to dynamically provision Neon branches. When you run a workflow, this action automatically creates a new branch based on your configuration. This is useful for creating isolated environments for testing, development, or feature branches.

## Setup

Using the action requires adding a Neon API key to your GitHub Secrets. There are two ways you can perform this setup:

- **Using the Neon GitHub Integration** (recommended 👍) — this integration connects your Neon project to your GitHub repository, creates an API key, and sets the API key in your GitHub repository for you. See [Neon GitHub Integration](https://neon.tech/docs/guides/neon-github-integration) for instructions.
- **Manual setup** — this method requires obtaining a Neon API key and configuring it manually in your GitHub repository.

  1. **Obtain a Neon API key.** See [Create an API key](https://neon.tech/docs/manage/api-keys#create-an-api-key) for instructions on the Neon documentation.
  2. In your GitHub repository, go to **Settings** and locate **Secrets and variables** at the bottom of the left sidebar.
  3. Click **Actions** > **New repository secret**.
  4. Name the secret `NEON_API_KEY` and paste your API key in the **Value** field.
  5. Click **Add secret**.

## Usage

The following fields are required to run the Create Branch action:

- `project_id` — the Neon project ID. If you have the Neon GitHub Integration installed, you can specify `${{ vars.NEON_PROJECT_ID }}`. You can find the project ID of your Neon project on the Settings page of your Neon console.
- `api_key` — the Neon API key for your Neon project or organization. If you have the GitHub integration installed, specify `${{ secrets.NEON_API_KEY }}`.
- `username` — the database username (role name) to be created for connecting to the new branch.

> [!IMPORTANT]
> Ensure the database username (role) specified in the username input is already created in your Neon project. This action does not create database roles and will fail if the specified username does not exist. You can use the default `neondb_owner` role if suitable.

Setup the action in your workflow:

```yml
steps:
  - uses: neondatabase/create-branch-action@v5
    id: create-branch
    with:
      project_id: your_neon_project_id
      branch_name: actions_reusable
      username: db_user_github_actions
      api_key: ${{ secrets.NEON_API_KEY }}
```

Alternatively, you can use `${{ vars.NEON_PROJECT_ID }}` to get your `project_id`. If you have set up the [Neon GitHub Integration](https://neon.tech/docs/guides/neon-github-integration), the `NEON_PROJECT_ID` variable will be defined as a variable in your GitHub repository.

By default, the action creates a branch based on your project's _primary_ branch. If you want to create a branch from a different parent branch, you can specify the `parent` field. You can use either the name or the ID of the parent branch.

```yml
steps:
  - uses: neondatabase/create-branch-action@v5
    id: create-branch
    with:
      project_id: ${{ vars.NEON_PROJECT_ID }}
      branch_name: feature-branch-1
      username: db_user
      parent: dev # Parent branch name
      api_key: ${{ secrets.NEON_API_KEY }}
```

If you need to connect to the newly created branch in subsequent steps, you can use the outputs of this action. See the [Outputs](#outputs) section below for details.

## Outputs

The action provides the following outputs:

- `db_url` — The DATABASE_URL connection string for the new branch.
- `db_url_with_pooler` — DATABASE_URL with connection pooling enabled.
- `host` — The host address of the new branch.
- `host_with_pooler` — The host address with connection pooling enabled.
- `branch_id` — The unique ID of the new Neon branch.
- `password` — The password for connecting to the new branch database with the input username.

### Example Workflow

Here's an example of complete GitHub Actions workflow that creates a Neon branch and prints the connection details:

```yml
name: Neon Github Actions Create Branch

on:
  # Modify the following line to trigger the workflow on a different event such as push or pull_request as per your requirement. We have used workflow_dispatch for manual triggering in this example.
  workflow_dispatch:

jobs:
  Create-Neon-Branch:
    runs-on: ubuntu-24.04
    steps:
      - uses: neondatabase/create-branch-action@v5
        id: create-branch
        with:
          project_id: ${{ vars.NEON_PROJECT_ID }}
          branch_name: actions_reusable
          username: neondb_owner
          api_key: ${{ secrets.NEON_API_KEY }}
      - run: echo db_url ${{ steps.create-branch.outputs.db_url }} # the password is masked when printed
      - run: echo host ${{ steps.create-branch.outputs.host }}
      - run: echo branch_id ${{ steps.create-branch.outputs.branch_id }}
      - run: psql ${{ steps.create-branch.outputs.db_url }} -c "SELECT * FROM NOW();"
```

## Advanced usage

You can customize the action using the following optional fields:

- **Specify Parent Branch:** Use the `parent` input to create a branch from a specific parent branch (name or ID) instead of the default primary branch.
- **Customize Database and Username:** The `database` and `username` inputs allow you to specify the database name and database role for the new branch.
- **Enable Prisma Connection String:** Set `prisma: true` to generate connection strings in Prisma format.
- **Configure Auto-Suspend:** Use `suspend_timeout` to set an auto-suspend duration (in seconds) for the compute endpoint associated with the new branch. Set to `0` to disable auto-suspend.
- **SSL Mode:** Control the `sslmode` in the connection string using the `ssl` input. Supported values are: `"require"`, `"verify-ca"`, `"verify-full"`, `"omit"`.

If you don't provide values for the optional fields, the action uses the following defaults:

- `api_host` — `https://console.neon.tech/api/v2`
- `database` — `neondb`, the default database name for new Neon projects
- `prisma` — `false`
- `parent` — Your project's default _primary_ branch.
- `suspend_timeout` - `0` (auto-suspend disabled)
- `ssl` - `require`

Supported parameters:

| Field             | Required/optional | Default value                      |
| ----------------- | ----------------- | ---------------------------------- |
| `project_id`      | required          | n/a                                |
| `api_key`         | required          | n/a                                |
| `username`        | required          | n/a                                |
| `branch_name`     | optional          | _Automatically generated by Neon_  |
| `api_host`        | optional          | `https://console.neon.tech/api/v2` |
| `database`        | optional          | `neondb`                           |
| `prisma`          | optional          | `false`                            |
| `parent`          | optional          | _Project's primary branch_         |
| `suspend_timeout` | optional          | `0`                                |
| `ssl`             | optional          | `require`                          |

---


Check out other Neon GitHub Actions:

- [Delete Branch Action](https://github.com/neondatabase/delete-branch-action)
- [Reset Branch Action](https://github.com/neondatabase/reset-branch-action)
- [Schema Diff Action](https://github.com/neondatabase/schema-diff-action)