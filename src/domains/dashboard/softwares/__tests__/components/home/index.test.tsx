/**
 * @file index.test.tsx
 * @description Unit tests for home barrel exports
 * Verifies:
 *  - Header, Hero, Categories, PopularProducts are exported
 */

import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../components/home/sections/Header', () => ({ default: () => null }));
vi.mock('../../../components/home/sections/Hero', () => ({ default: () => null }));
vi.mock('../../../components/home/sections/Categories', () => ({ default: () => null }));
vi.mock('../../../components/home/sections/PopularProducts', () => ({ default: () => null }));

describe('home barrel exports', () => {
    it('should export Header, Hero, Categories, PopularProducts', async () => {
        const mod = await import('../../../components/home/index');
        expect(mod.Header).toBeDefined();
        expect(mod.Hero).toBeDefined();
        expect(mod.Categories).toBeDefined();
        expect(mod.PopularProducts).toBeDefined();
    });
});
