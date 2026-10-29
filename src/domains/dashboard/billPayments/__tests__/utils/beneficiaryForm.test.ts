import { describe, expect, it } from 'vitest';

import { accessKeys } from '@utils/accessKeys';

import { generateBeneficaryDynamicSchema } from '../../schema/index';
import { CHALLAN_VEHICLE_PARAM } from '../../utils/beneficiaryForm';

describe('generateBeneficaryDynamicSchema - Traffic Challan', () => {
    const schema = generateBeneficaryDynamicSchema(
        [CHALLAN_VEHICLE_PARAM],
        undefined,
        accessKeys.challan
    );
    const base = { accessKey: accessKeys.challan, name: 'Jennifer', billerId: '' };

    it('does not require a service provider and accepts a valid vehicle number', () => {
        expect(schema.isValidSync({ ...base, vehicleNumber: 'KA01AB1234' })).toBe(true);
    });

    it('rejects a missing or malformed vehicle number', () => {
        expect(schema.isValidSync({ ...base, vehicleNumber: '' })).toBe(false);
        expect(schema.isValidSync({ ...base, vehicleNumber: 'KA 01' })).toBe(false);
    });

    it('still requires a service provider for BBPS services', () => {
        const bbps = generateBeneficaryDynamicSchema([], undefined, accessKeys.water);
        expect(bbps.isValidSync({ accessKey: accessKeys.water, name: 'Jennifer', billerId: '' })).toBe(
            false
        );
    });
});
