jest.mock('../../../entities/savedTraveller', () => ({}));
jest.mock('../../../entities/setting', () => ({ findAll: jest.fn() }));

const { __test } = require('../../../use-cases/savedTraveller');

const { toLimit, groupTypesFor, groupKeyFor, travellerKey, limitFor } = __test;

const GROUPS = { travel: ['tbo_airline', 'hotels_api'] };

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
        input: { firstName: ' Jane ', lastName: 'Mary  Smith', passportNo: null, contactNo: '', email: ' ' },
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

describe('savedTraveller pure helpers', () => {
    describe('travellerKey (BE dedup key — must mirror FE fullTravellerKey)', () => {
        IDENTITY_VECTORS.forEach(({ input, key }, i) => {
            it(`vector ${i} produces the expected key`, () => {
                expect(travellerKey(input)).toBe(key);
            });
        });

        it('a passport-only difference yields a different key', () => {
            expect(travellerKey(IDENTITY_VECTORS[0].input)).not.toBe(
                travellerKey(IDENTITY_VECTORS[2].input)
            );
        });
    });

    describe('toLimit', () => {
        it("treats '1' and 1 as the unlimited sentinel", () => {
            expect(toLimit('1')).toBe(Infinity);
            expect(toLimit(1)).toBe(Infinity);
        });

        it('treats absent/blank as unconfigured (null)', () => {
            expect(toLimit(undefined)).toBeNull();
            expect(toLimit(null)).toBeNull();
            expect(toLimit('')).toBeNull();
            expect(toLimit('   ')).toBeNull();
        });

        it('rejects 0/negative/garbage as null so they cannot lock users out', () => {
            expect(toLimit('0')).toBeNull();
            expect(toLimit(0)).toBeNull();
            expect(toLimit('-5')).toBeNull();
            expect(toLimit('abc')).toBeNull();
        });

        it('returns the literal number for valid caps', () => {
            expect(toLimit('2')).toBe(2);
            expect(toLimit('500')).toBe(500);
            expect(toLimit(' 50 ')).toBe(50);
        });
    });

    describe('groupTypesFor', () => {
        it('widens airline and hotels to the shared travel pool', () => {
            expect(groupTypesFor(GROUPS, 'tbo_airline')).toEqual(['tbo_airline', 'hotels_api']);
            expect(groupTypesFor(GROUPS, 'hotels_api')).toEqual(['tbo_airline', 'hotels_api']);
        });

        it('keeps an ungrouped type isolated', () => {
            expect(groupTypesFor(GROUPS, 'some_other')).toEqual(['some_other']);
        });

        it('falls back to the type alone when the group is malformed', () => {
            expect(groupTypesFor({ travel: 'nope' }, 'x')).toEqual(['x']);
        });
    });

    describe('groupKeyFor', () => {
        it('maps a member to its group key', () => {
            expect(groupKeyFor(GROUPS, 'hotels_api')).toBe('travel');
        });

        it('returns the type itself for a non-member', () => {
            expect(groupKeyFor(GROUPS, 'zzz')).toBe('zzz');
        });
    });

    describe('limitFor', () => {
        const def = limitFor({ groups: GROUPS, limitDetails: undefined }, 'tbo_airline');

        it('has a finite positive default', () => {
            expect(Number.isFinite(def)).toBe(true);
            expect(def).toBeGreaterThanOrEqual(1);
        });

        it('honours a plain numeric limit', () => {
            expect(limitFor({ groups: GROUPS, limitDetails: 3 }, 'x')).toBe(3);
        });

        it("treats plain '1' as unlimited", () => {
            expect(limitFor({ groups: GROUPS, limitDetails: '1' }, 'x')).toBe(Infinity);
        });

        it('resolves byType by the group key', () => {
            expect(
                limitFor({ groups: GROUPS, limitDetails: { default: 10, byType: { travel: 25 } } }, 'tbo_airline')
            ).toBe(25);
        });

        it('falls back to the object default when byType misses', () => {
            expect(limitFor({ groups: GROUPS, limitDetails: { default: 10, byType: {} } }, 'x')).toBe(10);
        });

        it('degrades a 0 config to the default instead of a lockout', () => {
            expect(limitFor({ groups: GROUPS, limitDetails: 0 }, 'x')).toBe(def);
            expect(limitFor({ groups: GROUPS, limitDetails: '0' }, 'x')).toBe(def);
        });
    });
});
