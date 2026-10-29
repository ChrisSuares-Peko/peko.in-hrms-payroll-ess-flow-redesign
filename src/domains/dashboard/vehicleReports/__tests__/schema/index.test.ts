import { describe, expect, it } from 'vitest';

import { historySchema, inspectionSchema, valuationSchema } from '../../schema/index';

const validInspection = {
    bodyType: 'SUV',
    make: 'Kia',
    model: 'Seltos',
    manufacturingYear: '2021',
    variant: 'HTX',
    registrationNumber: 'KA01AB1234',
    contactName: 'Asha Menon',
    mobileNumber: '9876543210',
    fullAddress: '12 MG Road',
    pincode: '560001',
    city: 'Bengaluru',
    state: 'Karnataka',
    slot1Date: '2026-08-01',
    slot1Time: '10:00 AM',
    slot2Date: '',
    slot2Time: '',
};

describe('historySchema', () => {
    it('accepts a well-formed registration number', async () => {
        await expect(historySchema.validate({ registrationNumber: 'KA01AB1234' })).resolves
            .toBeTruthy();
    });

    it('rejects a malformed registration number', async () => {
        await expect(historySchema.validate({ registrationNumber: '1234' })).rejects.toThrow(
            /valid registration number/
        );
    });
});

describe('valuationSchema', () => {
    const base = {
        purpose: 'sell',
        counterparty: '',
        vehicleCategory: 'car',
        make: 'Kia',
        model: 'Seltos',
        manufacturingYear: '2021',
        variant: 'HTX',
        kilometresDriven: '48000',
        city: 'Jaipur',
    };

    it('does not require a counterparty when selling', async () => {
        await expect(valuationSchema.validate(base)).resolves.toBeTruthy();
    });

    // Required by Droom's OBV endpoint, which prices per market.
    it('requires a city', async () => {
        await expect(valuationSchema.validate({ ...base, city: '  ' })).rejects.toThrow(
            /City is required/
        );
    });

    it('requires a counterparty when buying', async () => {
        await expect(valuationSchema.validate({ ...base, purpose: 'buy' })).rejects.toThrow(
            /who you are buying from/
        );
    });

    it('rejects a non-numeric kilometre reading', async () => {
        await expect(
            valuationSchema.validate({ ...base, kilometresDriven: 'lots' })
        ).rejects.toThrow(/kilometres as a number/);
    });
});

describe('inspectionSchema', () => {
    it('accepts a booking with only slot 1 filled', async () => {
        await expect(inspectionSchema.validate(validInspection)).resolves.toBeTruthy();
    });

    it('rejects a half-filled slot 2', async () => {
        await expect(
            inspectionSchema.validate({ ...validInspection, slot2Time: '02:00 PM' })
        ).rejects.toThrow(/date for slot 2/);
    });

    it('accepts a fully filled slot 2 on or after slot 1', async () => {
        await expect(
            inspectionSchema.validate({
                ...validInspection,
                slot2Date: '2026-08-05',
                slot2Time: '02:00 PM',
            })
        ).resolves.toBeTruthy();
    });

    it('rejects a slot 2 that falls before slot 1', async () => {
        await expect(
            inspectionSchema.validate({
                ...validInspection,
                slot2Date: '2026-07-20',
                slot2Time: '02:00 PM',
            })
        ).rejects.toThrow(/on or after slot 1/);
    });

    it('rejects a landline-style mobile number', async () => {
        await expect(
            inspectionSchema.validate({ ...validInspection, mobileNumber: '1234567890' })
        ).rejects.toThrow(/valid 10-digit mobile number/);
    });
});
