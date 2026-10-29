import path from 'path';

import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./vitest.setup.ts', '@testing-library/jest-dom/vitest'],
        // PROTOTYPE-SETUP: backend-reference is read-only backend source; never run its tests here.
        exclude: [...configDefaults.exclude, 'backend-reference/**'],
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
        },
    },
});
