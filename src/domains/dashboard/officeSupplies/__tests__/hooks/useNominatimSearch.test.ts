import { describe, expect, it } from 'vitest';

import {
    filterPlacesByPrefix,
    isIndiaNominatimRow,
    nominatimIndiaSearchUrl,
} from '../../hooks/useNominatimSearch';
import { INDIAN_PIN_RE } from '../../utils/indianCityStdCodes';

describe('INDIAN_PIN_RE', () => {
    it('accepts India Post PINs and rejects leading-zero / short codes', () => {
        expect(INDIAN_PIN_RE.test('560001')).toBe(true);
        expect(INDIAN_PIN_RE.test('110001')).toBe(true);
        expect(INDIAN_PIN_RE.test('012345')).toBe(false);
        expect(INDIAN_PIN_RE.test('56001')).toBe(false);
        expect(INDIAN_PIN_RE.test('SW1A1A')).toBe(false);
    });
});

describe('nominatimIndiaSearchUrl', () => {
    it('always scopes to India', () => {
        const url = nominatimIndiaSearchUrl({ q: '110001', limit: 5 });
        expect(url).toContain('countrycodes=in');
        expect(url).toContain('q=110001');
        expect(url).not.toContain('postalcode=');
    });

    it('uses postalcode for PIN lookups so foreign 6-digit codes are not queried', () => {
        const url = nominatimIndiaSearchUrl({ postalcode: '110001', limit: 5 });
        expect(url).toContain('countrycodes=in');
        expect(url).toContain('postalcode=110001');
        expect(url).not.toMatch(/[?&]q=/);
    });
});

describe('isIndiaNominatimRow', () => {
    it('keeps India and drops other country codes', () => {
        expect(isIndiaNominatimRow({ address: { country_code: 'in' } })).toBe(true);
        expect(isIndiaNominatimRow({ address: { country_code: 'IN' } })).toBe(true);
        expect(isIndiaNominatimRow({})).toBe(true);
        expect(isIndiaNominatimRow({ address: { country_code: 'cn' } })).toBe(false);
        expect(isIndiaNominatimRow({ address: { country_code: 'gb' } })).toBe(false);
    });
});

describe('filterPlacesByPrefix', () => {
    const delhi = {
        label: 'Connaught Place, New Delhi, Delhi, 110001, India',
        lat: 28.63,
        lng: 77.22,
    };
    const chinaPin = {
        label: '110001, Some District, China',
        lat: 39.9,
        lng: 116.4,
    };

    it('does not keep an Indian place when filtering a PIN by prefix', () => {
        expect(filterPlacesByPrefix([delhi], '110001')).toEqual([]);
    });

    it('would keep a foreign label that starts with the PIN — callers must skip prefix for PINs', () => {
        expect(filterPlacesByPrefix([chinaPin], '110001')).toEqual([chinaPin]);
    });
});
