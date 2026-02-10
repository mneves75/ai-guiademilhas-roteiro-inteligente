# Contributing to NextJS Bootstrapped Shipped

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/nextjs-bootstrapped-shipped.git`
3. Install dependencies: `pnpm install`
4. Create a branch: `git checkout -b feature/your-feature-name`

## Development Workflow

### Code Quality Requirements

All code must pass these checks before merge:

```bash
pnpm lint          # ESLint - no warnings allowed
pnpm type-check    # TypeScript strict mode
pnpm format:check  # Prettier formatting
pnpm test          # All tests passing
```

### Pre-commit Hooks

Husky automatically runs lint-staged on commit. If your commit is blocked:

1. Read the error message
2. Run `pnpm lint:fix` to auto-fix issues
3. Manually fix remaining issues
4. Commit again

### Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]
[optional footer]
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Formatting (no code change)
- `refactor`: Code restructuring
- `test`: Adding/updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

**Examples:**

```
feat(auth): add GitHub OAuth provider
fix(payments): handle webhook timeout gracefully
docs(readme): update installation instructions
```

## Pull Request Process

1. **Update documentation** if you change any user-facing behavior
2. **Add tests** for new features
3. **Ensure all checks pass** (lint, type-check, tests)
4. **Fill out the PR template** completely
5. **Request review** from maintainers

### PR Title Format

Use the same format as commit messages:

```
feat(auth): add GitHub OAuth provider
```

## Code Style

- **TypeScript**: Strict mode enabled, no `any` types
- **React**: Functional components with hooks
- **Formatting**: Prettier handles this automatically
- **Naming**: camelCase for variables, PascalCase for components

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed code style guidelines.

## Reporting Issues

### Bug Reports

Include:

- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, browser)

### Feature Requests

Include:

- Clear description of the feature
- Use case / problem it solves
- Proposed implementation (optional)

## Release Process

This repository uses git tags and `CHANGELOG.md` for releases.

1. Ensure the full quality gate passes: `pnpm verify`
2. Update `CHANGELOG.md` and bump the version in `package.json`
3. Create and push a tag (example): `git tag vX.Y.Z && git push --tags`
4. Publish a GitHub Release using the changelog notes

## Questions?

- Open a [Discussion](https://github.com/mneves75/nextjs-bootstrapped-shipped/discussions)
- Check existing [Issues](https://github.com/mneves75/nextjs-bootstrapped-shipped/issues)

Thank you for contributing!
