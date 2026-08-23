import js from '@eslint/js'
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
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // Componentes generados por la CLI de Untitled UI (`npx untitledui add ...`).
    // Es código de librería, no código propio de la app: no está escrito contra
    // las reglas más estrictas de este template (fast refresh, hooks, tipos
    // vacíos), así que se relajan acá en vez de editar los archivos vendored.
    files: [
      'src/components/base/**/*.{ts,tsx}',
      'src/components/application/**/*.{ts,tsx}',
      'src/components/foundations/**/*.{ts,tsx}',
      'src/hooks/use-breakpoint.ts',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    // Componentes pegados desde cuicui.day (ver SearchBar.tsx, Badge.tsx):
    // mismo caso que arriba, código de "librería" pegado tal cual viene del
    // sitio, no vale la pena reescribirlo para cumplir fast-refresh.
    files: ['src/components/ui/Badge.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
