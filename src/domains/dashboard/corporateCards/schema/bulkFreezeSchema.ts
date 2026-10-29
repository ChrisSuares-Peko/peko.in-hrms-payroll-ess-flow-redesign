import * as Yup from 'yup';

import {
    FREEZE_CONFIRM_WORD,
    FREEZE_REASON_NOTE_MAX,
    FREEZE_REASON_OTHERS,
    reasonNoteSchema,
} from '../utils/cardsData';

export const BULK_FREEZE_CONFIRM_WORD = FREEZE_CONFIRM_WORD;

export interface BulkFreezeValues {
    confirm: string;
    reason?: number;
    note: string;
}

export const bulkFreezeSchema = Yup.object().shape({
    confirm: Yup.string()
        .trim()
        .oneOf([BULK_FREEZE_CONFIRM_WORD], `Type ${BULK_FREEZE_CONFIRM_WORD} to confirm.`)
        .required(`Type ${BULK_FREEZE_CONFIRM_WORD} to confirm.`),
    reason: Yup.number().required('Please select a reason to freeze the cards.'),
    note: reasonNoteSchema(FREEZE_REASON_NOTE_MAX).when('reason', {
        is: FREEZE_REASON_OTHERS,
        then: schema => schema.required('Please enter the reason to freeze the cards.'),
    }),
});
