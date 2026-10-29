import { describe, expect, it } from 'vitest';


import { vehicleDescriptor, vehicleHeadline } from '../../utils/vehicleLabel';

describe('vehicleHeadline', () => {
    it('leads with the registration number when there is one', () => {
        expect(
            vehicleHeadline({ vehicleNumber: 'KA01AB1234', manufacturer: 'Kia', model: 'Seltos' })
        ).toBe('KA01AB1234');
    });

    it('falls back to the spec when there is no registration number', () => {
        expect(vehicleHeadline({ manufacturer: 'Kia', model: 'Seltos', variant: 'HTX' })).toBe(
            'Kia Seltos HTX'
        );
    });

    // "Enter details manually" hands the form an empty vehicle.
    it('names a bare manual vehicle rather than rendering nothing', () => {
        expect(vehicleHeadline({ isManual: true })).toBe('New vehicle');
        expect(vehicleHeadline({})).toBe('New vehicle');
    });
});

describe('vehicleDescriptor', () => {
    it('describes a registered vehicle by make and model', () => {
        expect(
            vehicleDescriptor({
                vehicleNumber: 'KA01AB1234',
                manufacturer: 'Kia',
                model: 'Seltos',
                variant: 'HTX',
            })
        ).toBe('Kia · Seltos HTX');
    });

    it('prompts the user when the manual vehicle has no details yet', () => {
        expect(vehicleDescriptor({ isManual: true })).toBe(
            'Not part of your fleet — enter the details below'
        );
    });

    it('omits missing parts rather than leaving separators behind', () => {
        expect(vehicleDescriptor({ vehicleNumber: 'KA01AB1234', manufacturer: 'Kia' })).toBe('Kia');
    });
});
