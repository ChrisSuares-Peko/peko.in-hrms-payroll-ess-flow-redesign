import { describe, expect, it } from 'vitest';

import { creditBalanceOf } from '../../utils/creditBalance';

describe('creditBalanceOf', () => {
    it('returns a negative bill as a positive credit amount', () => {
        expect(creditBalanceOf(-124)).toBe(124);
        expect(creditBalanceOf('-124.5')).toBe(124.5);
        expect(creditBalanceOf(-0.01)).toBe(0.01);
    });

    it('returns null for a payable, zero, missing or malformed bill amount', () => {
        [124, 0, '0', -0, undefined, null, '', 'abc', NaN, Infinity].forEach(value => {
            expect(creditBalanceOf(value)).toBeNull();
        });
    });
});
