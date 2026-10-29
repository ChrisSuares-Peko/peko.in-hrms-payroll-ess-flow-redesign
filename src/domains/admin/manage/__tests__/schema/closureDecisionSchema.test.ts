import { describe, it, expect } from 'vitest';

import {
    DECISION_NOTE_MAX,
    DECISION_NOTE_MIN,
    decisionNoteError,
} from '../../schema/closureDecisionSchema';

describe('decisionNoteError', () => {
    describe('when the note is left empty', () => {
        it('accepts it, because the note is optional', () => {
            expect(decisionNoteError('')).toBeNull();
        });
    });

    describe('length', () => {
        it('rejects a note shorter than the minimum', () => {
            expect(decisionNoteError('too short')).toBe(
                `The decision note must be at least ${DECISION_NOTE_MIN} characters`
            );
        });

        it('accepts a note exactly at the minimum', () => {
            expect(decisionNoteError('a'.repeat(DECISION_NOTE_MIN))).toBeNull();
        });

        it('accepts a note exactly at the maximum', () => {
            expect(decisionNoteError('a'.repeat(DECISION_NOTE_MAX))).toBeNull();
        });

        it('rejects a note longer than the maximum', () => {
            expect(decisionNoteError('a'.repeat(DECISION_NOTE_MAX + 1))).toBe(
                `The decision note cannot exceed ${DECISION_NOTE_MAX} characters`
            );
        });
    });

    describe('whitespace', () => {
        it('rejects a leading space rather than trimming it away', () => {
            expect(decisionNoteError(' Confirmed by phone')).toBe(
                'The decision note cannot start with whitespace'
            );
        });

        it('rejects a trailing space', () => {
            expect(decisionNoteError('Confirmed by phone ')).toBe(
                'The decision note cannot end with whitespace'
            );
        });

        it('rejects consecutive spaces inside the text', () => {
            expect(decisionNoteError('Confirmed by  phone')).toBe(
                'The decision note cannot contain consecutive whitespaces'
            );
        });

        it('rejects a tab at the end', () => {
            expect(decisionNoteError('Confirmed by phone\t')).toBe(
                'The decision note cannot end with whitespace'
            );
        });

        it('accepts single spaces between words', () => {
            expect(decisionNoteError('Confirmed by phone with the finance team')).toBeNull();
        });

        it('rejects a note made only of spaces', () => {
            expect(decisionNoteError('     ')).not.toBeNull();
        });
    });
});
