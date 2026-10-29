import * as Yup from 'yup';

export const DECISION_NOTE_MIN = 10;

export const DECISION_NOTE_MAX = 1000;

const LABEL = 'The decision note';

export const decisionNoteSchema = Yup.string()
    .transform((value: string) => (value === '' ? undefined : value))
    .test(
        'no-leading-whitespace',
        `${LABEL} cannot start with whitespace`,
        value => !value || !/^\s/.test(value)
    )
    .test(
        'no-trailing-whitespace',
        `${LABEL} cannot end with whitespace`,
        value => !value || !/\s$/.test(value)
    )
    .test(
        'no-multiple-whitespace',
        `${LABEL} cannot contain consecutive whitespaces`,
        value => !value || !/\s{2,}/.test(value)
    )
    .min(DECISION_NOTE_MIN, `${LABEL} must be at least ${DECISION_NOTE_MIN} characters`)
    .max(DECISION_NOTE_MAX, `${LABEL} cannot exceed ${DECISION_NOTE_MAX} characters`);

export const decisionNoteError = (note: string): string | null => {
    try {
        decisionNoteSchema.validateSync(note);
        return null;
    } catch (error) {
        return (error as Yup.ValidationError).message;
    }
};
