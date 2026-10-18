import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({plugins:[react(),tailwindcss()],base:'./',build:{outDir:'dist',emptyOutDir:true,rollupOptions:{input:{index:'index.html',updater:'updater.html'},output:{manualChunks(id){if(id.includes('clientItems.json'))return 'catalog';if(/node_modules\/(react|react-dom|scheduler)\//.test(id))return 'react';}}}}});
