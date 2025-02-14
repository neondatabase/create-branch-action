#!/usr/bin/env bash

version=$(node -p "require('./package.json').version")

printf "export const version = '%s'\n\n" "$version" >src/version.ts
printf "// This file is auto-generated. Use 'bun run prebuild' when you need to update the version!\n" >>src/version.ts
