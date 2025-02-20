// See: https://eslint.org/docs/latest/use/configure/configuration-files

import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { fixupPluginRules } from '@eslint/compat'
import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import vitest from '@vitest/eslint-plugin'
import importPlugin from 'eslint-plugin-import'
import prettier from 'eslint-plugin-prettier'
import globals from 'globals'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
})

export default [
  { ignores: ['**/coverage', '**/dist', '**/linter', '**/node_modules'] },
  ...compat.extends(
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended'
  ),
  {
    plugins: {
      import: fixupPluginRules(importPlugin),
      vitest,
      prettier,
      '@typescript-eslint': typescriptEslint
    },

    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.vitest,
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly'
      },

      parser: tsParser,
      ecmaVersion: 2023,
      sourceType: 'module',

      parserOptions: { project: ['tsconfig.eslint.json'], tsconfigRootDir: '.' }
    },

    settings: {
      'import/resolver': {
        typescript: { alwaysTryTypes: true, project: 'tsconfig.eslint.json' }
      }
    },

    rules: {
      ...vitest.configs.recommended.rules,
      camelcase: 'off',
      'eslint-comments/no-use': 'off',
      'eslint-comments/no-unused-disable': 'off',
      'i18n-text/no-en': 'off',
      'import/no-namespace': 'off',
      'no-console': 'off',
      'no-shadow': 'off',
      'no-unused-vars': 'off',
      'prettier/prettier': 'error',
      'import/order': [
        'error',
        {
          groups: [
            // Built-in Node.js modules first
            'builtin',
            // Then external package imports
            'external',
            // Then internal modules
            'internal',
            // Then relative imports (parent and sibling)
            ['parent', 'sibling'],
            // Then index files
            'index',
            // Then type imports and other special imports
            ['type', 'object'],
            // Unknown imports last
            'unknown'
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true }
        }
      ]
    }
  }
]
