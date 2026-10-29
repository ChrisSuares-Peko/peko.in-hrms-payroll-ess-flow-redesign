/**
 * @file currencyConverter.test.ts
 * @description Unit tests for currencyConverter utility
 * Verifies:
 *  - USD amounts are correctly converted to AED using the env rate
 *  - Unsupported currencies return 0
 *  - Currency input is case-insensitive
 */

import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';

const USD_TO_AED = 3.67;

describe('currencyConverter', () => {
    beforeAll(() => {
        vi.stubEnv('VITE_USD_TO_AED', String(USD_TO_AED));
    });

    afterAll(() => {
        vi.unstubAllEnvs();
    });

    describe('USD conversion', () => {
        it('should convert a positive USD amount to AED with 2 decimal places', async () => {
            const { currencyConverter } = await import('../../utils/currencyConverter');

            expect(currencyConverter({ currency: 'USD', amount: 100 })).toBe(
                (100 * USD_TO_AED).toFixed(2)
            );
        });

        it('should convert a decimal USD amount correctly', async () => {
            const { currencyConverter } = await import('../../utils/currencyConverter');

            expect(currencyConverter({ currency: 'USD', amount: 9.99 })).toBe(
                (9.99 * USD_TO_AED).toFixed(2)
            );
        });

        it('should return "0.00" when amount is 0', async () => {
            const { currencyConverter } = await import('../../utils/currencyConverter');

            expect(currencyConverter({ currency: 'USD', amount: 0 })).toBe(
                (0 * USD_TO_AED).toFixed(2)
            );
        });
    });

    describe('case insensitivity', () => {
        it('should handle lowercase currency input', async () => {
            const { currencyConverter } = await import('../../utils/currencyConverter');

            expect(currencyConverter({ currency: 'usd', amount: 50 })).toBe(
                (50 * USD_TO_AED).toFixed(2)
            );
        });

        it('should handle mixed-case currency input', async () => {
            const { currencyConverter } = await import('../../utils/currencyConverter');

            expect(currencyConverter({ currency: 'Usd', amount: 50 })).toBe(
                (50 * USD_TO_AED).toFixed(2)
            );
        });
    });

    describe('unsupported currencies', () => {
        it('should return 0 for EUR', async () => {
            const { currencyConverter } = await import('../../utils/currencyConverter');

            expect(currencyConverter({ currency: 'EUR', amount: 100 })).toBe(0);
        });

        it('should return 0 for INR', async () => {
            const { currencyConverter } = await import('../../utils/currencyConverter');

            expect(currencyConverter({ currency: 'INR', amount: 100 })).toBe(0);
        });

        it('should return 0 for an unknown currency', async () => {
            const { currencyConverter } = await import('../../utils/currencyConverter');

            expect(currencyConverter({ currency: 'XYZ', amount: 100 })).toBe(0);
        });
    });
});
