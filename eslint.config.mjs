import nextPlugin from '@next/eslint-plugin-next';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import js from '@eslint/js';
import prettier from 'eslint-config-prettier/flat';

const baseIgnores = [
  'node_modules/',
  '.next/',
  '.next-playwright/',
  'dist/',
  'build/',
  '.vercel/',
  '.scrap_bin/',
  'coverage/',
  'playwright-report/',
  'test-results/',
  '.git/',
  '.planning/',
  'pnpm-lock.yaml',
  'package-lock.json',
  'yarn.lock',
];

export default [
  // Ignore patterns
  {
    ignores: baseIgnores,
  },

  // JavaScript base config
  {
    files: ['**/*.js', '**/*.jsx'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Node globals
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        process: 'readonly',
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
    },
  },

  // TypeScript files config
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: true,
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        React: 'readonly',
        JSX: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-types': 'off',
      '@typescript-eslint/no-require-imports': 'warn',
      'no-restricted-syntax': [
        'error',
        {
          selector: "TaggedTemplateExpression[tag.name='sql']",
          message:
            'Avoid drizzle-orm sql`` tagged templates in app code. Prefer the query builder for cross-dialect compatibility.',
        },
        {
          selector:
            "ImportDeclaration[source.value='drizzle-orm'] ImportSpecifier[imported.name='sql']",
          message:
            'Avoid importing `sql` from drizzle-orm in app code. Prefer and()/eq()/isNull()/gt()/etc for cross-dialect compatibility.',
        },
      ],
    },
  },

  // React and JSX config
  {
    files: ['**/*.jsx', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        React: 'readonly',
        JSX: 'readonly',
      },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/display-name': 'off',
      'react/no-unknown-property': 'off',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },

  // Next.js plugin config
  {
    files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },

  // Prettier config (must be last to disable formatting rules)
  prettier,
];
