import * as Yup from 'yup';

import { withWhitespaceRules } from './validations';

export const CLOSURE_DETAILS_MIN = 10;

export const CLOSURE_DETAILS_MAX = 1000;

export const CLOSURE_REASON_OTHERS = 'OTHERS';

const DETAILS_LABEL = 'The details';

export interface AccountClosureValues {
    reason: string;
    details: string;
}

export const accountClosureSchema = Yup.object().shape({
    reason: Yup.string().required('Please select a reason for leaving.'),
    details: withWhitespaceRules(
        Yup.string()
            .transform((value: string) => (value === '' ? undefined : value))
            .min(
                CLOSURE_DETAILS_MIN,
                `${DETAILS_LABEL} must be at least ${CLOSURE_DETAILS_MIN} characters`
            )
            .max(
                CLOSURE_DETAILS_MAX,
                `${DETAILS_LABEL} cannot exceed ${CLOSURE_DETAILS_MAX} characters`
            ),
        DETAILS_LABEL
    ).when('reason', {
        is: CLOSURE_REASON_OTHERS,
        then: schema => schema.required('Please tell us a little more about why you are leaving.'),
    }),
});
