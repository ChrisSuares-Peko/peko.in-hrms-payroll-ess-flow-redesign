import { describe, it, expect } from 'vitest';

import { displayCardStatus } from '../../utils/helpers';
import { CardStatus } from '../../utils/types';

describe('displayCardStatus', () => {
    it('combines a frozen card awaiting termination into one status', () => {
        expect(displayCardStatus('Frozen', 'REQUESTED')).toBe('Frozen (Termination Requested)');
    });

    it('leaves a plain frozen card as Frozen', () => {
        expect(displayCardStatus('Frozen')).toBe('Frozen');
        expect(displayCardStatus('Frozen', null)).toBe('Frozen');
    });

    // COMPLETED is a finished termination, not a pending one — the card is gone, not awaiting anything.
    it('leaves a frozen card whose termination completed as Frozen', () => {
        expect(displayCardStatus('Frozen', 'COMPLETED')).toBe('Frozen');
    });

    // The composite only ever qualifies a freeze. A termination request against any other state must not
    // relabel it, or an Active card would read as frozen.
    it.each(['Active', 'Pending', 'Failed'] as CardStatus[])(
        'leaves %s untouched even with a termination requested',
        status => {
            expect(displayCardStatus(status, 'REQUESTED')).toBe(status);
        }
    );
});
