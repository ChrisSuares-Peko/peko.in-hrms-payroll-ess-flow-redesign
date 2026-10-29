/**
 * @file index.test.tsx
 * @description Unit tests for product barrel exports
 * Verifies:
 *  - ProductDetails and Price are exported
 */

import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../components/product/sections/price', () => ({ default: () => null }));
vi.mock('../../../components/product/sections/productDetails', () => ({ default: () => null }));

describe('product barrel exports', () => {
    it('should export ProductDetails and Price', async () => {
        const mod = await import('../../../components/product/index');
        expect(mod.ProductDetails).toBeDefined();
        expect(mod.Price).toBeDefined();
    });
});
