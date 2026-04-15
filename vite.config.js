import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';


export default defineConfig({
  plugins: [react()],
  // Handle JSX in .js files
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.[jt]sx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // React core — changes rarely, long cache lifetime
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],

          // MUI + Emotion — very large, split from app code
          'vendor-mui': [
            '@mui/material',
            '@mui/icons-material',
            '@emotion/react',
            '@emotion/styled',
          ],

          // Firebase SDK — large and stable
          'vendor-firebase': [
            'firebase/app',
            'firebase/auth',
            'firebase/firestore',
            'firebase/analytics',
            'firebase/messaging',
          ],

          // Charting — heavy, only used on dashboard
          'vendor-charts': ['recharts'],

          // Query builder — moderately large, isolated feature
          'vendor-querybuilder': ['react-querybuilder'],

          // Icon library — tree-shaken but still benefits from its own chunk
          'vendor-icons': ['lucide-react'],

          // Remaining small utilities
          'vendor-misc': [
            'react-hot-toast',
            '@floating-ui/react',
            '@stomp/stompjs',
            'sockjs-client',
            'prop-types',
          ],
        },
      },
    },
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },
  server: {
    port: 5174, // Fix the port to avoid redirect issues
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
