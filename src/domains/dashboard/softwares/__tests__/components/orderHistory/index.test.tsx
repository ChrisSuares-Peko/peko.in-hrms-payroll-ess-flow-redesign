/**
 * @file index.test.tsx
 * @description Unit tests for orderHistory barrel exports
 * Verifies:
 *  - Header and OrderTable are exported
 */

import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../components/orderHistory/Header', () => ({ default: () => null }));
vi.mock('../../../components/orderHistory/OrderTable', () => ({ default: () => null }));

describe('orderHistory barrel exports', () => {
    it('should export Header and OrderTable', async () => {
        const mod = await import('../../../components/orderHistory/index');
        expect(mod.Header).toBeDefined();
        expect(mod.OrderTable).toBeDefined();
    });
});
