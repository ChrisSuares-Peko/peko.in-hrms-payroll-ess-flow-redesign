/**
 * @file index.test.ts
 * @description Unit tests for findProductSuccess barrel exports
 * Verifies:
 *  - Header and ProductCards are exported
 */

import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../components/findProductSuccess/sections/Header', () => ({ default: () => null }));
vi.mock('../../../components/findProductSuccess/sections/ProductCards', () => ({
    default: () => null,
}));

describe('findProductSuccess barrel exports', () => {
    it('should export Header and ProductCards', async () => {
        const mod = await import('../../../components/findProductSuccess/index');
        expect(mod.Header).toBeDefined();
        expect(mod.ProductCards).toBeDefined();
    });
});
