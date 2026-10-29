import * as Yup from 'yup';

import { CardStatus } from './types';

/** Status filter options for the Cards filter bar. */
export const CARD_STATUS_OPTIONS: { label: string; value: CardStatus | '' }[] = [
    { label: 'All', value: '' },
    { label: 'Active', value: 'Active' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Frozen', value: 'Frozen' },
    { label: 'Failed', value: 'Failed' },
];

/** Typed before a freeze goes through, on every freeze screen. */
export const FREEZE_CONFIRM_WORD = 'FREEZE';

/** Freeze reason codes (mirrors backend FREEZE_REASON) — used by the freeze reason picker. */
export const FREEZE_REASON_OPTIONS: { value: number; label: string }[] = [
    { value: 1, label: 'Lost' },
    { value: 2, label: 'Stolen' },
    { value: 3, label: 'Physical Damage' },
    { value: 4, label: 'Others' },
];

/**
 * The one reason code that carries no meaning on its own, so whoever freezes the card must type what
 * actually happened. Mirrors backend FREEZE_REASON.OTHERS.
 */
export const FREEZE_REASON_OTHERS = 4;

/** Matches the cardIssuance.freezeReasonNote column width — the backend rejects anything longer. */
export const FREEZE_REASON_NOTE_MAX = 255;

/** How each backend FREEZE_ACTOR reads to an admin looking at someone else's frozen card. */
const FROZEN_BY_LABELS: Record<string, string> = {
    ADMIN: 'an admin',
    CARDHOLDER: 'the cardholder',
    SYSTEM: 'Peko',
};

/** A frozen card, as far as the freeze reason is concerned. */
export interface FrozenCardFields {
    frozenByRole?: string | null;
    freezeReasonLabel?: string | null;
    freezeReasonNote?: string | null;
}

/**
 * One line telling an admin who froze a card and why, or null when the card carries no reason — which is
 * every card frozen before the reason became mandatory, so callers must handle the null.
 */
export const freezeReasonSummary = (card: FrozenCardFields): string | null => {
    const reason = [card.freezeReasonLabel, card.freezeReasonNote].filter(Boolean).join(' — ');
    if (!reason) return null;
    const by = FROZEN_BY_LABELS[card.frozenByRole ?? ''];
    return by ? `Frozen by ${by} · ${reason}` : `Frozen · ${reason}`;
};

/**
 * Shortest free-text reason we accept. These notes land in the card's audit trail and, for a freeze, in
 * the reason sent to Pine Labs — "lost" or "abc" is not an explanation anyone can act on later.
 */
export const REASON_NOTE_MIN = 10;

/**
 * Space rules for a free-text reason, applied as the admin types: never a leading space, never a run of
 * two or more spaces. A single trailing space has to survive typing — it is how you get to the next word
 * — so it is removed by the trim applied on submit (which the backend repeats).
 */
export const sanitizeReasonNote = (value: string): string =>
    value.replace(/^\s+/, '').replace(/ {2,}/g, ' ');

/**
 * Yup rules for a free-text reason note. `.trim()` transforms before the length tests, so padding cannot
 * pad a short note up to the minimum; the empty → undefined transform keeps an untouched optional note
 * from tripping `min`. Callers add `.required()` where the note is mandatory.
 *
 * The double-space test is a backstop: `sanitizeReasonNote` already makes one impossible to type or
 * paste, but the schema is what the submit is gated on, so it must be able to stand on its own.
 */
export const reasonNoteSchema = (max: number) =>
    Yup.string()
        .trim()
        .transform((value: string) => (value === '' ? undefined : value))
        .min(REASON_NOTE_MIN, `Please enter at least ${REASON_NOTE_MIN} characters.`)
        .max(max, `The reason must be ${max} characters or fewer.`)
        .test(
            'no-double-space',
            'Please remove the extra spaces.',
            (value?: string) => !/ {2}/.test(value ?? '')
        );

/**
 * The same rules for a screen that is not on Formik yet (BulkCardActionModal): runs the schema and
 * returns its message, or null when the value is acceptable. Delegates rather than restating the rules
 * so the two screens cannot drift apart.
 */
export const reasonNoteError = (value: string, max: number): string | null => {
    try {
        reasonNoteSchema(max).validateSync(value);
        return null;
    } catch (error) {
        return (error as Yup.ValidationError).message;
    }
};

/**
 * Termination reasons. Plain strings, not codes: unlike freeze these never reach Pine Labs, so the label
 * IS the value and nothing has to map it back. The chosen reason is folded into the request's existing
 * `reason` text — no new column, no new endpoint.
 */
export const TERMINATE_REASON_OPTIONS: { value: string; label: string }[] = [
    { value: 'Employee exited', label: 'Employee exited' },
    { value: 'Card lost', label: 'Card lost' },
    { value: 'Card stolen', label: 'Card stolen' },
    { value: 'Physical Damage', label: 'Physical Damage' },
    { value: 'No longer required', label: 'No longer required' },
    { value: 'Others', label: 'Others' },
];

export const TERMINATE_REASON_OTHERS = 'Others';

/** Leaves room for the reason label inside the backend's 500-char slice of cardRequests.reason. */
export const TERMINATE_REASON_NOTE_MAX = 400;

/** Reason + optional note as the single string the terminate endpoint already accepts. */
export const composeTerminateReason = (reason: string, note: string) => {
    const trimmed = note.trim();
    return trimmed ? `${reason}: ${trimmed}` : reason;
};
