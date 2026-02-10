.PHONY: help install dev build start test lint type-check format format-check verify e2e

help:
	@echo "Targets:"
	@echo "  install        Install dependencies (pnpm)"
	@echo "  dev            Run dev server"
	@echo "  build          Build for production"
	@echo "  start          Start production server"
	@echo "  test           Run unit tests"
	@echo "  e2e            Run Playwright E2E tests"
	@echo "  lint           Run ESLint"
	@echo "  type-check     Run TypeScript checks"
	@echo "  format         Format code with Prettier"
	@echo "  format-check   Check formatting"
	@echo "  verify         Run the full local verification pipeline"

install:
	pnpm install

dev:
	pnpm dev

build:
	pnpm build

start:
	pnpm start

test:
	pnpm test

e2e:
	pnpm test:e2e

lint:
	pnpm lint

type-check:
	pnpm type-check

format:
	pnpm format

format-check:
	pnpm format:check

verify:
	pnpm verify

