import { describe, it, expect } from 'vitest';

import { freezeReasonSummary } from '../../utils/cardsData';

describe('freezeReasonSummary', () => {
    it('names the cardholder as the one who froze it', () => {
        expect(freezeReasonSummary({ frozenByRole: 'CARDHOLDER', freezeReasonLabel: 'Lost' })).toBe(
            'Frozen by the cardholder · Lost'
        );
    });

    it('names an admin', () => {
        expect(freezeReasonSummary({ frozenByRole: 'ADMIN', freezeReasonLabel: 'Stolen' })).toBe(
            'Frozen by an admin · Stolen'
        );
    });

    it('names Peko for a system freeze', () => {
        expect(
            freezeReasonSummary({
                frozenByRole: 'SYSTEM',
                freezeReasonLabel: 'Others',
                freezeReasonNote: 'Member removed from the corporate',
            })
        ).toBe('Frozen by Peko · Others — Member removed from the corporate');
    });

    it('keeps both the reason code and the note', () => {
        expect(
            freezeReasonSummary({
                frozenByRole: 'CARDHOLDER',
                freezeReasonLabel: 'Others',
                freezeReasonNote: 'Left it in a cab',
            })
        ).toBe('Frozen by the cardholder · Others — Left it in a cab');
    });

    it('falls back to a reason with no actor when the role is missing', () => {
        expect(freezeReasonSummary({ freezeReasonLabel: 'Lost' })).toBe('Frozen · Lost');
    });

    it('ignores an unrecognised role rather than printing the raw code', () => {
        expect(freezeReasonSummary({ frozenByRole: 'ROBOT', freezeReasonLabel: 'Lost' })).toBe(
            'Frozen · Lost'
        );
    });

    it('reports the note alone when only a note was stored', () => {
        expect(
            freezeReasonSummary({ frozenByRole: 'ADMIN', freezeReasonNote: 'Vendor audit' })
        ).toBe('Frozen by an admin · Vendor audit');
    });

    // Cards frozen before the reason became mandatory carry none, so every caller must handle null.
    it('returns null when no reason was recorded', () => {
        expect(freezeReasonSummary({ frozenByRole: 'ADMIN' })).toBeNull();
        expect(freezeReasonSummary({ freezeReasonLabel: null, freezeReasonNote: null })).toBeNull();
        expect(freezeReasonSummary({})).toBeNull();
    });
});
