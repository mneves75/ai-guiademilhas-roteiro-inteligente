# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Upgraded to Next.js 16.1.6 (from 15.x)
- Upgraded @typescript-eslint packages to v8 for ESLint 9 compatibility
- Updated eslint-config-next and @next/eslint-plugin-next to v16

### Added

- Phase 1: Foundation & Code Quality complete
  - TypeScript 5.9 with strict mode enabled
  - ESLint 9 flat config with Next.js 15 + React 19 rules
  - Prettier 3.8 formatting configuration
  - Husky pre-commit hooks with lint-staged
  - GitHub Actions CI/CD workflows (lint, type-check, test)
  - Developer documentation (DEVELOPMENT.md)
  - Environment variables template (.env.example)

### Infrastructure

- Next.js 15 project scaffold with App Router
- pnpm as package manager
- GitHub repository with best practices docs

## [0.1.0] - 2026-02-05

### Added

- Initial project setup
- Phase 1 planning and research documentation
- Project roadmap with 12 phases covering 90 requirements

[Unreleased]: https://github.com/mneves75/nextjs-bootstrapped-shipped/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/mneves75/nextjs-bootstrapped-shipped/releases/tag/v0.1.0
