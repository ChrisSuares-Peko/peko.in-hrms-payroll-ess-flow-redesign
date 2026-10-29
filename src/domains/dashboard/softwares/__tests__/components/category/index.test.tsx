/**
 * @file index.test.tsx
 * @description Unit tests for category barrel exports
 * Verifies:
 *  - All named exports are defined
 */

import { describe, it, expect, vi } from 'vitest';

vi.mock('@src/domains/dashboard/softwares/components/category/sections/Header', () => ({
    default: () => null,
}));
vi.mock('@src/domains/dashboard/softwares/components/category/sections/ProductCards', () => ({
    default: () => null,
}));
vi.mock('@src/domains/dashboard/softwares/components/category/sections/SearchNSort', () => ({
    default: () => null,
}));

describe('category barrel exports', () => {
    it('should export Header, SearchNSort, and ProductCards', async () => {
        const mod = await import('../../../components/category/index');
        expect(mod.Header).toBeDefined();
        expect(mod.SearchNSort).toBeDefined();
        expect(mod.ProductCards).toBeDefined();
    });
});
