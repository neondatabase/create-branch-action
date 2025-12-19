# 🔍 Neon Create Branch Action

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./docs/logos/neon-logo-dark.svg">
    <img alt="Neon logo" src="./docs/logos/neon-logo-light.svg">
  </picture>
</p>

![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/neondatabase/create-branch-action/.github%2Fworkflows%2Flinter.yml?label=%F0%9F%94%8D%20Lint)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/neondatabase/create-branch-action/.github%2Fworkflows%2Fci.yml?label=%F0%9F%8F%97%EF%B8%8F%20Build)

This action creates a new Neon branch in your Neon project. If a branch with the
specified name already exists, it returns the details of the existing branch.

It supports workflows where you need to dynamically provision Neon branches.
When you run a workflow, this action automatically creates a new branch based on
your configuration. This is useful for creating isolated environments for
testing, development, or feature branches.

## Contributing

If you would like to contribute to the development of this GitHub Action, see
[docs/development.md](docs/development.md).

## How to set up the NEON_API_KEY

Using the action requires adding a Neon API key to your GitHub Secrets. There
are two ways you can perform this setup:

- **Using the Neon GitHub Integration** (recommended 👍) — this integration
  connects your Neon project to your GitHub repository, creates an API key, and
  sets the API key in your GitHub repository for you. See
  [Neon GitHub Integration](https://neon.tech/docs/guides/neon-github-integration)
  for instructions.
- **Manual setup** — this method requires obtaining a Neon API key and
  configuring it manually in your GitHub repository.
  1. Obtain a Neon API key. See
     [Create an API key](https://neon.tech/docs/manage/api-keys#create-an-api-key)
     for instructions.
  1. In your GitHub repository, go to **Project settings** and locate
     **Secrets** at the bottom of the left sidebar.
  1. Click **Actions** > **New Repository Secret**.
  1. Name the secret `NEON_API_KEY` and paste your API key in the **Secret**
     field
  1. Click **Add Secret**.

## Usage

The following fields are required to run the Create Branch action:

- `project_id` — the Neon project ID. If you have the Neon GitHub Integration
  installed, you can specify `${{ vars.NEON_PROJECT_ID }}`. You can find the
  project ID of your Neon project on the Settings page of your Neon console.
- `api_key` — the Neon API key for your Neon project or organization. If you
  have the GitHub integration installed, specify `${{ secrets.NEON_API_KEY }}`.

Setup the action in your workflow:

```yml
# v6 (latest)
steps:
  - uses: neondatabase/create-branch-action@v6
    id: create-branch
    with:
      project_id: your_neon_project_id
      branch_name: actions_reusable
      role: neondb_owner
      api_key: ${{ secrets.NEON_API_KEY }}
```

Alternatively, you can use `${{ vars.NEON_PROJECT_ID }}` to get your
`project_id`. If you have set up the
[Neon GitHub Integration](https://neon.tech/docs/guides/neon-github-integration),
the `NEON_PROJECT_ID` variable will be defined as a variable in your GitHub
repository.

By default, the action creates a branch based on your project's _default_
branch. If you want to create a branch from a different parent branch, you can
specify the `parent_branch` field. You can use either the name or the ID of the
parent branch. In addition, it uses the default database and role for Neon
projects, which are `neondb` and `neondb_owner`, respectively.

```yml
steps:
  - uses: neondatabase/create-branch-action@v6
    id: create-branch
    with:
      project_id: ${{ vars.NEON_PROJECT_ID }}
      branch_name: feature-branch-1
      role: db_user
      parent_branch: dev # Parent branch name
      api_key: ${{ secrets.NEON_API_KEY }}
```

> [!IMPORTANT] Ensure the database role specified in the input is already
> created in your Neon project. This action will fail if the specified role does
> not exist.

If you need to connect to the newly created branch in subsequent steps, you can
use the outputs of this action. See the [Outputs](#outputs) section below for
details.

## Outputs

The action provides the following outputs:

- `db_url` — The DATABASE_URL connection string for the new branch.
- `db_url_pooled` — DATABASE_URL with connection pooling enabled.
- `db_host` — The host address of the new branch.
- `db_host_pooled` — The host address with connection pooling enabled.
- `branch_id` — The unique ID of the new Neon branch.
- `password` — The password for connecting to the new branch database with the
  input role.
- `created` - `true` if the branch was created, `false` is the branch already
  exists and is being reused.

### Example Workflow

Here's an example of complete GitHub Actions workflow that creates a Neon branch
and prints the connection details:

```yml
name: Neon Github Actions Create Branch

on:
  # You can modify the following line to trigger the workflow on a different event, such as `push` or `pull_request`, as per your requirements. We have used `workflow_dispatch` for triggering the action in this example.
  workflow_dispatch:

jobs:
  create-neon-branch:
    runs-on: ubuntu-24.04
    steps:
      - name: Get branch expiration date as an env variable (2 weeks from now)
        id: get-expiration-date
        run:
          echo "EXPIRES_AT=$(date -u --date '+14 days' +'%Y-%m-%dT%H:%M:%SZ')"
          >> "$GITHUB_ENV"
      - name: Create Neon Branch
        uses: neondatabase/create-branch-action@v6
        id: create-branch
        with:
          project_id: ${{ vars.NEON_PROJECT_ID }}
          branch_name:
            pr-${{ github.event.number }}-${{ needs.setup.outputs.branch }}
          api_key: ${{ secrets.NEON_API_KEY }}
          expires_at: ${{ env.EXPIRES_AT }}
      - run: echo db_url ${{ steps.create-branch.outputs.db_url }} # the password is masked when printed
      - run: echo host ${{ steps.create-branch.outputs.host }}
      - run: echo branch_id ${{ steps.create-branch.outputs.branch_id }}
      - run:
          psql ${{ steps.create-branch.outputs.db_url }} -c "SELECT * FROM
          NOW();"
```

## Advanced usage

You can customize the action as follows, using the action's optional fields:

- **Specify Parent Branch:** Use the `parent_branch` input to create a branch
  from a specific parent branch (name or ID) instead of the default primary
  branch.
- **Customize Database and Role:** The `database` and `role` inputs allow you to
  specify the database name and database role for the new branch.
- **Enable Prisma Connection String:** Set `prisma: true` to generate connection
  strings in Prisma format.
- **Configure Auto-Suspend:** Use `suspend_timeout` to set an auto-suspend
  duration (in seconds) for the compute endpoint associated with the new branch.
  Set to `0` to disable auto-suspend.
- **Configure Branch Expiration:** Set `expires_at` to define how long a branch
  should exist before being automatically deleted. By default, `expires_at` is
  empty, indicating no expiration. The timestamp must be in
  [RFC 3339 format](https://tools.ietf.org/html/rfc3339#section-5.6).
- **SSL Mode:** Control the `sslmode` in the connection string using the `ssl`
  input. Supported values are: `"require"`, `"verify-ca"`, `"verify-full"`,
  `"omit"`.
- **Branch type**: Use `schema-only` to create a new branch with the schema of
  the `parent_branch`.
- **Auth URL**: Get `auth_url` for the branch if the neon auth is enabled 

If you don't provide values for the optional fields, the action uses the
following defaults:

- `api_host` — `https://console.neon.tech/api/v2`
- `database` — `neondb`, the default database name for new Neon projects
- `role` — `neondb_owner`, the default database name for new Neon projects
- `prisma` — `false`
- `parent_branch` — Your project's default _primary_ branch.
- `suspend_timeout` - `0` (auto-suspend disabled)
- `ssl` - `require`
- `branch_type` - `default`
- `get_auth_url` - `false`

Supported parameters:

| Field             | Required/optional | Default value                      |
| ----------------- | ----------------- | ---------------------------------- |
| `project_id`      | required          | n/a                                |
| `api_key`         | required          | n/a                                |
| `branch_name`     | optional          | _Automatically generated by Neon_  |
| `api_host`        | optional          | `https://console.neon.tech/api/v2` |
| `role`            | optional          | `neondb_owner`                     |
| `database`        | optional          | `neondb`                           |
| `prisma`          | optional          | `false`                            |
| `parent_branch`   | optional          | _Project's primary branch_         |
| `suspend_timeout` | optional          | `0`                                |
| `ssl`             | optional          | `require`                          |
| `branch_type`     | optional          | `default`                          |
| `expires_at`      | optional          | `""`                               |
| `masking_rules`   | optional          | `undefined`                        |
| `get_auth_url`    | optional          | `"false"`                          |

---

Check out other Neon GitHub Actions:

- [Delete Branch Action](https://github.com/neondatabase/delete-branch-action)
- [Reset Branch Action](https://github.com/neondatabase/reset-branch-action)
- [Schema Diff Action](https://github.com/neondatabase/schema-diff-action)
