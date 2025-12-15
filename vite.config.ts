import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: './', // Important for Electron
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.OPENAI_API_KEY': JSON.stringify(env.OPENAI_API_KEY),
        'process.env.ANTHROPIC_API_KEY': JSON.stringify(env.ANTHROPIC_API_KEY),
        'process.env.OPENROUTER_API_KEY': JSON.stringify(env.OPENROUTER_API_KEY),
        'process.env.GROQ_API_KEY': JSON.stringify(env.GROQ_API_KEY),
        'process.env.NETMIND_API_KEY': JSON.stringify(env.NETMIND_API_KEY),
        'process.env.COHERE_API_KEY': JSON.stringify(env.COHERE_API_KEY),
        'process.env.MISTRAL_API_KEY': JSON.stringify(env.MISTRAL_API_KEY),
        // Define process global for browser compatibility
        'process.platform': JSON.stringify('browser'),
        'process.env.NODE_ENV': JSON.stringify(mode),
        global: 'globalThis'
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        outDir: 'dist',
        emptyOutDir: true,
      },
      publicDir: 'images'
    };
});
