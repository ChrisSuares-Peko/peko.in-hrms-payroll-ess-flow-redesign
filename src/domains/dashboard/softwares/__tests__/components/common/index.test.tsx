/**
 * @file index.test.tsx
 * @description Unit tests for common barrel exports
 * Verifies:
 *  - ProductCard and ProductCardOverView are exported
 */

import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../components/common/ProductCard', () => ({ default: () => null }));
vi.mock('../../../components/common/productCardOverView', () => ({ default: () => null }));

describe('common barrel exports', () => {
    it('should export ProductCard and ProductCardOverView', async () => {
        const mod = await import('../../../components/common/index');
        expect(mod.ProductCard).toBeDefined();
        expect(mod.ProductCardOverView).toBeDefined();
    });
});
