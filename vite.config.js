import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost/Bunda%20Jaya%20Elektronik',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  }
});
