import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const backend = 'http://127.0.0.1:3010';

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: { '/api': backend, '/go': backend, '/uploads': backend },
  },
});
