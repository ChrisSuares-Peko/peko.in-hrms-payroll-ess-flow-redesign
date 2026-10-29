import { describe, expect, it } from 'vitest';

import {
    cityFromGeocode,
    DEFAULT_CITY,
    indianPincode,
    isIndiaCountry,
    ondcCityCode,
    withPincode,
} from '../../utils/indianCityStdCodes';

describe('cityFromGeocode', () => {
    it('accepts India country values', () => {
        expect(isIndiaCountry('in')).toBe(true);
        expect(isIndiaCountry('India')).toBe(true);
        expect(isIndiaCountry('ae')).toBe(false);
    });

    it('stores an empty code outside India so the catalog stays empty', () => {
        expect(
            cityFromGeocode({ cityName: 'Dubai', countryCode: 'ae', countryName: 'UAE' })
        ).toEqual({ name: 'Dubai', code: '' });
        expect(ondcCityCode({ name: 'Dubai', code: '' })).toBeUndefined();
    });

    it('does not map a foreign namesake onto an Indian std: city', () => {
        expect(cityFromGeocode({ cityName: 'Hyderabad', countryCode: 'pk' })).toEqual({
            name: 'Hyderabad',
            code: '',
        });
    });

    it('resolves Indian places to an ONDC std: code', () => {
        const city = cityFromGeocode({
            cityName: 'Hyderabad',
            state: 'Telangana',
            countryCode: 'in',
        });
        expect(city.code).toBe('std:040');
        expect(ondcCityCode(city)).toBe('std:040');
        expect(cityFromGeocode({})).toEqual(DEFAULT_CITY);
    });
});

describe('indianPincode / withPincode', () => {
    it('accepts a 6-digit Indian PIN and strips decoration', () => {
        expect(indianPincode('560001')).toBe('560001');
        expect(indianPincode('  110001  ')).toBe('110001');
        expect(indianPincode('PIN-400001')).toBe('400001');
    });

    it('rejects leading-zero, short, and empty values', () => {
        expect(indianPincode('012345')).toBeUndefined();
        expect(indianPincode('56001')).toBeUndefined();
        expect(indianPincode('')).toBeUndefined();
        expect(indianPincode(null)).toBeUndefined();
    });

    it('attaches a valid PIN onto a city and strips an invalid one', () => {
        const city = { name: 'Bangalore', code: 'std:080' };
        expect(withPincode(city, '560001')).toEqual({
            name: 'Bangalore',
            code: 'std:080',
            pincode: '560001',
        });
        expect(withPincode({ ...city, pincode: '000000' })).toEqual(city);
        expect(withPincode(city, 'abc')).toEqual(city);
    });
});
