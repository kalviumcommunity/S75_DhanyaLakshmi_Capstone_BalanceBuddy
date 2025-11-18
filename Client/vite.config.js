import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-redirects',
      closeBundle() {
        const src = path.resolve(__dirname, 'public/_redirects');
        const dest = path.resolve(__dirname, 'dist/_redirects');

        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest);
          console.log('✔ _redirects file copied to dist/');
        } else {
          console.warn('⚠ _redirects file not found in public/');
        }
      }
    }
  ]
});
