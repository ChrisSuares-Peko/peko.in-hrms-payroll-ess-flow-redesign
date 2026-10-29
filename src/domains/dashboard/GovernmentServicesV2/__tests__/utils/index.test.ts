import { describe, expect, it } from 'vitest';

import { getServiceDetailByAccessKey, serviceDetailsMap } from '../../utils';

describe('getServiceDetailByAccessKey', () => {
    it('resolves the trademark registration access key to local id 10', () => {
        expect(getServiceDetailByAccessKey('govt_trademark_registration')).toBe(serviceDetailsMap[10]);
        expect(serviceDetailsMap[10]).toBeDefined();
    });

    it('resolves the trademark objection access key to local id 32', () => {
        expect(getServiceDetailByAccessKey('govt_trademark_objection')).toBe(serviceDetailsMap[32]);
        expect(serviceDetailsMap[32]).toBeDefined();
    });

    it('resolves the other trademark keys (protection 33, expedited 34)', () => {
        expect(getServiceDetailByAccessKey('govt_trademark_protection')).toBe(serviceDetailsMap[33]);
        expect(getServiceDetailByAccessKey('govt_expedited_trademark')).toBe(serviceDetailsMap[34]);
    });

    it('falls back to raw endpoint slugs', () => {
        expect(getServiceDetailByAccessKey('trademark-registration')).toBe(serviceDetailsMap[10]);
        expect(getServiceDetailByAccessKey('trademark-objection')).toBe(serviceDetailsMap[32]);
        expect(getServiceDetailByAccessKey('gstr-1')).toBe(serviceDetailsMap[35]);
    });

    it('converts every dash in a slug to an underscore', () => {
        expect(getServiceDetailByAccessKey('govt_gstr_1')).toBe(serviceDetailsMap[35]);
        expect(getServiceDetailByAccessKey('govt_dsc_company')).toBe(serviceDetailsMap[29]);
    });

    it.each([
        ['msme-udyam-registration', 9],
        ['import-export-code', 27],
        ['iec', 27],
        ['startup-india-recognition', 11],
        ['startup-india-dpiit', 11],
    ])('resolves slug override %s to local id %i', (slug, localId) => {
        expect(getServiceDetailByAccessKey(slug)).toBe(serviceDetailsMap[localId]);
        expect(serviceDetailsMap[localId]).toBeDefined();
    });

    it.each(['govt_shop_establishment', 'shop-establishment', 'govt_dsc', 'unknown', '', 'govt_trademark'])(
        'returns undefined for unmapped / Phase-2 key %s',
        (key) => {
            expect(getServiceDetailByAccessKey(key)).toBeUndefined();
        }
    );

    it('is case sensitive', () => {
        expect(getServiceDetailByAccessKey('GOVT_TRADEMARK_REGISTRATION')).toBeUndefined();
    });
});
