import js from '@eslint/js'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import eslintPluginBetterTailwindcss from "eslint-plugin-better-tailwindcss"
import eslintPluginTestingLibrary from 'eslint-plugin-testing-library'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      eslintPluginPrettierRecommended,
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    settings: {
      "better-tailwindcss": {
        entryPoint: "./src/index.css"
      },
    },
    plugins: {
      "better-tailwindcss": eslintPluginBetterTailwindcss,
      "testing-library": eslintPluginTestingLibrary,
    },
    rules: {
      ...eslintPluginBetterTailwindcss.configs['recommended-error'].rules,
      ...eslintPluginTestingLibrary.configs['flat/react'].rules,
    }
  },
])
