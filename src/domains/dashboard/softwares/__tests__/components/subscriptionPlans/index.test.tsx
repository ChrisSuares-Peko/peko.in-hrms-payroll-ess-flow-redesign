/**
 * @file index.test.tsx
 * @description Unit tests for subscriptionPlans barrel exports
 * Verifies:
 *  - Description and Plans are exported
 */

import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../components/subscriptionPlans/sections/Description', () => ({
    default: () => null,
}));
vi.mock('../../../components/subscriptionPlans/sections/Plans', () => ({ default: () => null }));

describe('subscriptionPlans barrel exports', () => {
    it('should export Description and Plans', async () => {
        const mod = await import('../../../components/subscriptionPlans/index');
        expect(mod.Description).toBeDefined();
        expect(mod.Plans).toBeDefined();
    });
});
