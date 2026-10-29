import { describe, it, expect } from 'vitest';

import { PAN_REGEX, parsePanHolder } from '../../utils/pan';

describe('PAN_REGEX', () => {
    it('matches a valid uppercase PAN (5 letters, 4 digits, 1 letter)', () => {
        expect(PAN_REGEX.test('ABCDE1234F')).toBe(true);
    });

    it('rejects lowercase and malformed PANs', () => {
        expect(PAN_REGEX.test('abcde1234f')).toBe(false);
        expect(PAN_REGEX.test('ABCDE123F')).toBe(false);
        expect(PAN_REGEX.test('ABCD12345F')).toBe(false);
        expect(PAN_REGEX.test('ABCDE1234')).toBe(false);
    });
});

describe('parsePanHolder', () => {
    it('reads discrete first / middle / last / father name fields', () => {
        const res = {
            data: {
                first_name: 'John',
                middle_name: 'K',
                last_name: 'Doe',
                father_name: 'Richard Doe',
            },
        };
        expect(parsePanHolder(res)).toEqual({
            fullName: 'John K Doe',
            firstName: 'John',
            middleName: 'K',
            lastName: 'Doe',
            fathersName: 'Richard Doe',
        });
    });

    it('splits a single "nameoncard" into first/middle/last when discrete fields are absent', () => {
        const res = { data: { nameoncard: 'John Kumar Doe' } };
        expect(parsePanHolder(res)).toEqual(
            expect.objectContaining({
                fullName: 'John Kumar Doe',
                firstName: 'John',
                middleName: 'Kumar',
                lastName: 'Doe',
            })
        );
    });

    it('returns null when nothing usable is present', () => {
        expect(parsePanHolder({ data: {} })).toBeNull();
        expect(parsePanHolder(null)).toBeNull();
    });
});
