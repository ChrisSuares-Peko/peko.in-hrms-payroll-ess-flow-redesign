/**
 * @file index.test.tsx
 * @description Unit tests for searchResults barrel exports
 * Verifies:
 *  - Header and ProductCards are exported
 */

import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../components/searchResults/sections/Header', () => ({ default: () => null }));
vi.mock('../../../components/searchResults/sections/ProductCards', () => ({ default: () => null }));

describe('searchResults barrel exports', () => {
    it('should export Header and ProductCards', async () => {
        const mod = await import('../../../components/searchResults/index');
        expect(mod.Header).toBeDefined();
        expect(mod.ProductCards).toBeDefined();
    });
});
