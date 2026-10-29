import { describe, expect, it } from 'vitest';

import { accessKeys } from '../accessKeys';
import { isServiceGatewayEnabled } from '../ccavenueServices';

const cashfree = { pgProvider: 'cashfree_pg', code: 'CASHFREE' };
const ccavenue = { pgProvider: 'ccavenue_pg', code: 'CCAVENUE' };
const razorpay = { pgProvider: 'razorpay_pg', code: 'RAZORPAY' };
const mswipe = { pgProvider: 'mswipe_pg', code: 'MSWIPE' };

describe('isServiceGatewayEnabled', () => {
    it('keeps the gateway when no gateway is configured for the service', () => {
        expect(isServiceGatewayEnabled(accessKeys.electricity)).toBe(true);
        expect(isServiceGatewayEnabled(accessKeys.hotels, [])).toBe(true);
    });

    it('offers CC Avenue services only through CC Avenue', () => {
        expect(isServiceGatewayEnabled(accessKeys.electricity, [ccavenue])).toBe(true);
        expect(isServiceGatewayEnabled(accessKeys.electricity, [cashfree, ccavenue])).toBe(true);
        expect(isServiceGatewayEnabled(accessKeys.electricity, [cashfree])).toBe(false);
    });

    it('offers every other service only through Cashfree', () => {
        expect(isServiceGatewayEnabled(accessKeys.hotels, [cashfree])).toBe(true);
        expect(isServiceGatewayEnabled(accessKeys.hotels, [cashfree, ccavenue])).toBe(true);
        expect(isServiceGatewayEnabled(accessKeys.hotels, [ccavenue])).toBe(false);
    });

    it('offers other services through the gateway the API picked', () => {
        expect(isServiceGatewayEnabled(accessKeys.hotels, [razorpay], 'RAZORPAY')).toBe(true);
        expect(isServiceGatewayEnabled(accessKeys.hotels, [cashfree, razorpay], 'RAZORPAY')).toBe(
            true
        );
        expect(isServiceGatewayEnabled(accessKeys.hotels, [cashfree], 'CASHFREE')).toBe(true);
    });

    it('offers any gateway the API picked from the configured ones', () => {
        expect(isServiceGatewayEnabled(accessKeys.hotels, [mswipe], 'MSWIPE')).toBe(true);
    });

    it('hides other services when the picked gateway is not among the configured ones', () => {
        expect(isServiceGatewayEnabled(accessKeys.hotels, [cashfree], 'RAZORPAY')).toBe(false);
    });

    it('never offers other services through CC Avenue, even when the API picks it', () => {
        expect(isServiceGatewayEnabled(accessKeys.eSim, [ccavenue], 'CCAVENUE')).toBe(false);
        expect(isServiceGatewayEnabled(accessKeys.hotels, [ccavenue], 'CCAVENUE')).toBe(false);
    });

    it('keeps CC Avenue services on CC Avenue whatever gateway the API picked', () => {
        expect(isServiceGatewayEnabled(accessKeys.electricity, [razorpay], 'RAZORPAY')).toBe(false);
        expect(isServiceGatewayEnabled(accessKeys.electricity, [ccavenue], 'CCAVENUE')).toBe(true);
    });
});
