import { describe, expect, it } from 'vitest';

import {
    describeGatewayCharge,
    gatewayChargeInputs,
    gatewayChargeOf,
} from '../utils/gatewayCharge';

describe('a partner’s gateway charge terms on the portal', () => {
    it('folds the two inputs into one set of terms, blank meaning none', () => {
        expect(gatewayChargeOf('1.95', '3')).toEqual({ percentage: 1.95, fixed: 3 });
        expect(gatewayChargeOf('2', '')).toEqual({ percentage: 2, fixed: 0 });
        expect(gatewayChargeOf('', ' ')).toBeNull();
    });

    it('describes the terms in one phrase, telling none from not set', () => {
        expect(describeGatewayCharge({ percentage: '1.9500', fixed: '3.0000' })).toBe(
            '1.95% + ₹ 3.00'
        );
        expect(describeGatewayCharge({ percentage: 0, fixed: 0 })).toBe('None');
        expect(describeGatewayCharge(null)).toBeNull();
        expect(describeGatewayCharge(undefined)).toBeNull();
    });

    it('prefills the inputs from the terms, and leaves them blank when there are none', () => {
        expect(gatewayChargeInputs({ percentage: '1.9500', fixed: 3 })).toEqual({
            gatewayChargePercentage: '1.95',
            gatewayChargeFixed: '3',
        });
        expect(gatewayChargeInputs(null)).toEqual({
            gatewayChargePercentage: '',
            gatewayChargeFixed: '',
        });
    });
});
