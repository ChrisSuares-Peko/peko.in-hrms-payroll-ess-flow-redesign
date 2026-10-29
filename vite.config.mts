import path from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [react()],
    build: {
        // No data: URI inlining — sub-4KB svgs rendered via ReactSVG break in prod builds.
        assetsInlineLimit: 0,
        reportCompressedSize: false,
    },
    resolve: {
        alias: {
            '@assets': path.resolve(__dirname, './src/assets'),
            '@store': path.resolve(__dirname, './src/store'),
            '@components': path.resolve(__dirname, './src/components'),
            '@customtypes': path.resolve(__dirname, './src/types'),
            '@utils': path.resolve(__dirname, './src/utils'),
            '@src': path.resolve(__dirname, './src'),
            '@hooks': path.resolve(__dirname, './src/hooks'),
            '@routes': path.resolve(__dirname, './src/routes'),
            '@layouts': path.resolve(__dirname, './src/layouts'),
            '@domains': path.resolve(__dirname, './src/domains'),
            // PROTOTYPE-SETUP: payment and realtime-push SDKs need Peko's infrastructure; inert stubs instead.
            '@cashfreepayments/cashfree-js': path.resolve(__dirname, './src/prototype/stubs/cashfree.ts'),
            'pusher-js': path.resolve(__dirname, './src/prototype/stubs/pusher.ts'),
        },
    },
});
