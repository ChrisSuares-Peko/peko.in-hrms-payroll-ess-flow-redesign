import { describe, it, expect } from 'vitest';

import {
    cleanTravellerDate,
    fullTravellerKey,
    nameDobKey,
    optionIdentityKey,
    optionToIdentifiable,
} from '@utils/travellerIdentity';

const IDENTITY_VECTORS = [
    {
        input: {
            firstName: 'John',
            lastName: 'Doe',
            dateOfBirth: '1990-01-01',
            passportNo: 'ab12',
            contactNo: '9998887776',
            email: 'John.Doe@X.com',
        },
        key: 'john|doe|1990-01-01|AB12|9998887776|john.doe@x.com',
    },
    {
        input: { firstName: ' Jane ', lastName: 'Mary  Smith', passportNo: undefined, contactNo: '', email: ' ' },
        key: 'jane|mary  smith||||',
    },
    {
        input: {
            firstName: 'John',
            lastName: 'Doe',
            dateOfBirth: '1990-01-01',
            passportNo: 'zz99',
            contactNo: '9998887776',
            email: 'John.Doe@X.com',
        },
        key: 'john|doe|1990-01-01|ZZ99|9998887776|john.doe@x.com',
    },
    {
        input: {
            firstName: '  bob',
            lastName: 'O Brien',
            dateOfBirth: ' 2000-12-31 ',
            passportNo: ' x1 ',
            contactNo: ' 123 ',
            email: '  BOB@TEST.IO ',
        },
        key: 'bob|o brien|2000-12-31|X1|123|bob@test.io',
    },
];

describe('travellerIdentity', () => {
    describe('fullTravellerKey (FE dedup key — must mirror BE travellerKey)', () => {
        IDENTITY_VECTORS.forEach(({ input, key }, i) => {
            it(`vector ${i} produces the expected key`, () => {
                expect(fullTravellerKey(input)).toBe(key);
            });
        });

        it('a passport-only difference yields a different key', () => {
            expect(fullTravellerKey(IDENTITY_VECTORS[0].input)).not.toBe(
                fullTravellerKey(IDENTITY_VECTORS[2].input)
            );
        });
    });

    describe('cleanTravellerDate', () => {
        it('passes a clean date-only value through', () => {
            expect(cleanTravellerDate('1990-01-01')).toBe('1990-01-01');
        });

        it('returns undefined for empty/invalid inputs', () => {
            expect(cleanTravellerDate('')).toBeUndefined();
            expect(cleanTravellerDate(undefined)).toBeUndefined();
            expect(cleanTravellerDate('Invalid date')).toBeUndefined();
            expect(cleanTravellerDate('not-a-date')).toBeUndefined();
        });
    });

    describe('optionToIdentifiable', () => {
        it('normalizes the option DOB through cleanTravellerDate (employee-guard fix)', () => {
            expect(optionToIdentifiable({ fullName: 'John Doe', dateOfBirth: '1990-01-01' } as any).dateOfBirth).toBe(
                cleanTravellerDate('1990-01-01')
            );
            expect(optionToIdentifiable({ fullName: 'John Doe', dateOfBirth: '' } as any).dateOfBirth).toBeUndefined();
        });

        it('makes an employee option match a cleaned payload on name + DOB', () => {
            const option = { fullName: 'John Doe', dateOfBirth: '1990-01-01' } as any;
            const payload = {
                firstName: 'John',
                lastName: 'Doe',
                dateOfBirth: cleanTravellerDate('1990-01-01'),
            };
            expect(nameDobKey(optionToIdentifiable(option))).toBe(nameDobKey(payload));
        });
    });

    describe('optionIdentityKey', () => {
        it('matches fullTravellerKey for the same person (select-path baseline)', () => {
            const option = {
                fullName: 'John Doe',
                dateOfBirth: '1990-01-01',
                passportNo: 'ab12',
                mobileNo: '9998887776',
                email: 'John.Doe@X.com',
            } as any;
            expect(optionIdentityKey(option)).toBe(
                fullTravellerKey({
                    firstName: 'John',
                    lastName: 'Doe',
                    dateOfBirth: cleanTravellerDate('1990-01-01'),
                    passportNo: 'ab12',
                    contactNo: '9998887776',
                    email: 'John.Doe@X.com',
                })
            );
        });
    });
});
