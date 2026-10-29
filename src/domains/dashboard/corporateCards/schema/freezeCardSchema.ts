import * as Yup from 'yup';

import {
    FREEZE_CONFIRM_WORD,
    FREEZE_REASON_NOTE_MAX,
    FREEZE_REASON_OTHERS,
    reasonNoteSchema,
} from '../utils/cardsData';

export interface FreezeCardValues {
    confirm: string;
    reason?: number;
    note: string;
}

export const freezeCardSchema = Yup.object().shape({
    confirm: Yup.string()
        .trim()
        .oneOf([FREEZE_CONFIRM_WORD], `Type ${FREEZE_CONFIRM_WORD} to confirm.`)
        .required(`Type ${FREEZE_CONFIRM_WORD} to confirm.`),
    reason: Yup.number().required('Please select a reason to freeze the card.'),
    note: reasonNoteSchema(FREEZE_REASON_NOTE_MAX).when('reason', {
        is: FREEZE_REASON_OTHERS,
        then: schema => schema.required('Please enter the reason to freeze the card.'),
    }),
});
