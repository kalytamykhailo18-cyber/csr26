import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Section 19.1: Optimized Vite configuration for fast loading (<2 seconds)
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: Number(process.env.VITE_PORT) || 5173
  },
  preview: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 4173,
    strictPort: true,
    allowedHosts: ['.railway.app']
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Section 19.1: Production build optimizations - use esbuild (faster)
    minify: 'esbuild',
    // Target modern browsers for smaller bundle
    target: 'es2020',
    // Section 19.1: Code splitting for faster initial load
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for React and core libraries
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Redux chunk
          'vendor-redux': ['@reduxjs/toolkit', 'react-redux'],
          // Stripe chunk (lazy loaded when needed)
          'vendor-stripe': ['@stripe/stripe-js', '@stripe/react-stripe-js'],
        },
      },
    },
    // Section 19.1: Chunk size warning threshold (500KB)
    chunkSizeWarningLimit: 500,
  },
  // Section 19.1: Optimize dependency pre-bundling
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@reduxjs/toolkit', 'react-redux'],
  },
})
