import { describe, it, expect } from 'vitest';

import { EntityType } from '../../types';
import { shareholdingPeople, shareholdingRow, shareholdingTotal } from '../../utils/person';

describe('shareholdingPeople', () => {
    it('uses the directors list for Private Limited and LLP', () => {
        const directors = [{ firstName: 'A' }, { firstName: 'B' }];
        expect(shareholdingPeople({ entityType: EntityType.PRIVATE_LIMITED, directors })).toEqual(
            directors
        );
        expect(shareholdingPeople({ entityType: EntityType.LLP, directors })).toEqual(directors);
    });

    it('uses the single director for other entities (OPC / proprietorship)', () => {
        const director = { firstName: 'Solo' };
        expect(shareholdingPeople({ entityType: EntityType.OPC, director })).toEqual([director]);
    });

    it('returns [] when directors is missing for Private Limited', () => {
        expect(shareholdingPeople({ entityType: EntityType.PRIVATE_LIMITED })).toEqual([]);
    });
});

describe('shareholdingRow', () => {
    it('coerces shares to a number and excluded to a boolean', () => {
        const values = { shareholding: { 0: { shares: '100', excluded: true }, 1: {} } };
        expect(shareholdingRow(values, 0)).toEqual({ shares: 100, excluded: true });
        expect(shareholdingRow(values, 1)).toEqual({ shares: 0, excluded: false });
    });

    it('defaults a missing row to zero shares, not excluded', () => {
        expect(shareholdingRow({}, 5)).toEqual({ shares: 0, excluded: false });
    });
});

describe('shareholdingTotal', () => {
    it('sums shares across non-excluded rows only', () => {
        const values = {
            entityType: EntityType.PRIVATE_LIMITED,
            directors: [{}, {}, {}],
            shareholding: {
                0: { shares: 100 },
                1: { shares: 50, excluded: true },
                2: { shares: 25 },
            },
        };
        expect(shareholdingTotal(values)).toBe(125);
    });

    it('is zero when there are no rows', () => {
        expect(shareholdingTotal({ entityType: EntityType.OPC, director: {} })).toBe(0);
    });
});
