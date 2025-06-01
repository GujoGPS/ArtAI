import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    resolve: {
      alias: {
        '@': path.resolve(new URL('.', import.meta.url).pathname, '.'),
      }
    },
    server: {
      port: 5173,
    }
  };
});
