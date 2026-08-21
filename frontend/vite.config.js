// ==========================================
// TaskFlow Frontend: Vite Configuration
// ==========================================
// Vite is used for rapid frontend development and asset packaging.
// For additional configurations like proxying, aliases, and environment loading,
// see: https://vite.dev/config/

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Load plugins: @vitejs/plugin-react enables Fast Refresh and React-specific features
  plugins: [react()],
})
