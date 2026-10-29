import { describe, it, expect } from 'vitest';

import { BLOCKER_LIST_MAX, blockerReasons } from '../../utils/helpers';

describe('blockerReasons', () => {
    it('lists the messages behind a disabled submit', () => {
        expect(
            blockerReasons({
                entityName: 'Please enter the Name of the Entity',
                bankIfsc: 'Please enter a valid IFSC Code',
            })
        ).toEqual(['Please enter the Name of the Entity', 'Please enter a valid IFSC Code']);
    });

    it('is empty when nothing is wrong', () => {
        expect(blockerReasons({})).toEqual([]);
    });

    it('ignores fields with no message', () => {
        expect(
            blockerReasons({ entityName: undefined, bankName: '', regCity: 'Pick a city' })
        ).toEqual(['Pick a city']);
    });

    // Two fields sharing a rule produce the same sentence; saying it twice reads like two problems.
    it('says a repeated message once when nothing distinguishes the fields', () => {
        expect(
            blockerReasons({
                a: 'City must be at least 2 characters',
                b: 'City must be at least 2 characters',
            })
        ).toEqual(['City must be at least 2 characters']);
    });

    /**
     * The agreement form reuses one label across sections — City for the registered, billing and bank
     * addresses — so identical messages belong to different fields and must not collapse into one line.
     */
    describe('when a section qualifies the field', () => {
        const sections: Record<string, string> = {
            regCity: 'Registered address',
            billCity: 'Billing address',
            bankCity: 'Bank details',
        };
        const sectionFor = (field: string) => sections[field];

        it('keeps one line per field despite the identical message', () => {
            expect(
                blockerReasons(
                    {
                        regCity: 'Please enter the City',
                        billCity: 'Please enter the City',
                        bankCity: 'Please enter the City',
                    },
                    { sectionFor }
                )
            ).toEqual([
                'Registered address · Please enter the City',
                'Billing address · Please enter the City',
                'Bank details · Please enter the City',
            ]);
        });

        it('leaves an unqualified field unprefixed', () => {
            expect(
                blockerReasons(
                    { entityName: 'Please enter the Name of the Entity' },
                    { sectionFor }
                )
            ).toEqual(['Please enter the Name of the Entity']);
        });

        it('counts the qualified lines when summarising the tail', () => {
            const errors = Object.fromEntries(
                Object.keys(sections).map(k => [k, 'Please enter the City'])
            );
            const reasons = blockerReasons(errors, { sectionFor, max: 2 });

            expect(reasons).toHaveLength(3);
            expect(reasons[2]).toBe('…and 1 more');
        });
    });

    it('drops nested error objects rather than rendering them as text', () => {
        expect(blockerReasons({ nested: { inner: 'nope' }, flat: 'Fix this' })).toEqual([
            'Fix this',
        ]);
    });

    it('summarises the tail once the list would get too long', () => {
        const errors = Object.fromEntries(
            Array.from({ length: BLOCKER_LIST_MAX + 3 }, (_, i) => [`f${i}`, `Problem ${i}`])
        );

        const reasons = blockerReasons(errors);

        expect(reasons).toHaveLength(BLOCKER_LIST_MAX + 1);
        expect(reasons[BLOCKER_LIST_MAX]).toBe('…and 3 more');
    });

    it('lists everything when it lands exactly on the cap', () => {
        const errors = Object.fromEntries(
            Array.from({ length: BLOCKER_LIST_MAX }, (_, i) => [`f${i}`, `Problem ${i}`])
        );

        const reasons = blockerReasons(errors);

        expect(reasons).toHaveLength(BLOCKER_LIST_MAX);
        expect(reasons.some(r => r.includes('more'))).toBe(false);
    });
});
