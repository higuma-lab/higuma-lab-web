// @ts-check
import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import astro from 'eslint-plugin-astro';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    ignores: [
      'dist/',
      '.astro/',
      'test-results/',
      'playwright-report/',
      'node_modules/',
      'infra/cdk.out/',
      'sampleimages/',
    ],
  },
  js.configs.recommended,
  tseslint.configs.strict,
  astro.configs.recommended,
  astro.configs['jsx-a11y-strict'],
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  eslintConfigPrettier,
);
