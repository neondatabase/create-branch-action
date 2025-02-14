# 🔍 Neon Create Branch Action

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./docs/logos/neon-logo-dark.svg">
    <img alt="Neon logo" src="./docs/logos/neon-logo-light.svg">
  </picture>
</p>

![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/neondatabase/create-branch-action/.github%2Fworkflows%2Flinter.yml?label=%F0%9F%94%8D%20Lint)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/neondatabase/create-branch-action/.github%2Fworkflows%2Fci.yml?label=%F0%9F%8F%97%EF%B8%8F%20Build)
[![coverage](./docs/coverage.svg)](./docs/coverage.svg)

Action description

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

Setup the action:

```yml
steps:
  - uses: neondatabase/example@v1
    with:
      project_id: rapid-haze-373089
      compare_branch: dev/sunny_plant
      api_key: ${{ secrets.NEON_API_KEY }}
```

Alternatively, you can use `${{ vars.NEON_PROJECT_ID }}` to get your
`project_id`. If you have set up the
[Neon GitHub Integration](https://neon.tech/docs/guides/neon-github-integration),
the `NEON_PROJECT_ID` variable will be defined as a variable in your GitHub
repository.

## Outputs

The action provides two outputs:

- `projects` — the list of projects
