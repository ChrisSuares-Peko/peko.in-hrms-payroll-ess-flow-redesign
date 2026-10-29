import dayjs from 'dayjs';
import * as Yup from 'yup';


const DEFAULT_NAME_MIN_LENGTH = 1;
const DEFAULT_NAME_MAX_LENGTH = 50;

export type NameValidationConfig = {
    /** ValidationInfo.CharLimit — whether the supplier wants name length checked at all. */
    charLimitEnabled?: boolean;
    /** ValidationInfo.PaxNameMinLength */
    minLength?: number;
    /** ValidationInfo.PaxNameMaxLength */
    maxLength?: number;
    /** ValidationInfo.SpaceAllowed */
    spaceAllowed?: boolean;
    /** ValidationInfo.SpecialCharAllowed — governs hyphen/apostrophe/dot (e.g. "Mary-Ann",
     * "O'Brien", "Md. Irfan"); digits are never allowed in a name regardless of this flag. */
    specialCharAllowed?: boolean;
};

/** Character class (for use inside `[...]`) allowed in a name, per the supplier's rules. */
const nameCharClass = ({ spaceAllowed = true, specialCharAllowed = true }: NameValidationConfig) =>
    `a-zA-Z${spaceAllowed ? '\\s' : ''}${specialCharAllowed ? ".'-" : ''}`;

/** Regex that strips disallowed characters as the user types — see DetailBookings.tsx. */
export const nameSanitizerRegex = (config: NameValidationConfig = {}) =>
    new RegExp(`[^${nameCharClass(config)}]`, 'g');

const nameField = (label: string, config: NameValidationConfig = {}) => {
    const {
        charLimitEnabled = true,
        minLength = DEFAULT_NAME_MIN_LENGTH,
        maxLength = DEFAULT_NAME_MAX_LENGTH,
        spaceAllowed = true,
        specialCharAllowed = true,
    } = config;

    const pattern = new RegExp(`^[${nameCharClass({ spaceAllowed, specialCharAllowed })}]+$`);
    const allowedCharsDescription = [
        'letters',
        spaceAllowed && 'spaces',
        specialCharAllowed && 'hyphens, apostrophes and dots',
    ]
        .filter(Boolean)
        .join(', ');

    let schema = Yup.string()
        .required(`Please enter the ${label.toLowerCase()}`)
        // Leading/trailing spaces and doubled-up spaces are trimmed/collapsed before saving
        // (see DetailBookings.tsx onSubmit) rather than blocked here — this only rejects a
        // value that is nothing but whitespace once trimmed.
        .test(
            'not-only-whitespace',
            `Please enter the ${label.toLowerCase()}`,
            value => !!value && value.trim().length > 0
        )
        .matches(pattern, `${label} can only contain ${allowedCharsDescription}`);

    if (charLimitEnabled) {
        schema = schema
            .min(minLength, `${label} must be at least ${minLength} character${minLength > 1 ? 's' : ''}`)
            .max(maxLength, `${label} cannot be longer than ${maxLength} characters`);
    }

    return schema;
};

export const userDetailsSchema = (isFirstAdult: boolean, nameValidation?: NameValidationConfig) =>
    Yup.object().shape({
        firstName: nameField('First name', nameValidation),

        lastName: nameField('Last name', nameValidation),

        dob: Yup.string().required('Please select the date of birth'),


        isPassportRequired: Yup.boolean(),
        passportNo: Yup.string().when('isPassportRequired', {
            is: true,
            then: schema =>
                schema
                    .required('Please enter the passport number')
                    .matches(/^[A-Z0-9]*$/, 'No special characters or spaces are allowed.')
                    .min(6, 'Passport number must be at least 6 characters long'),
            otherwise: schema => schema.nullable(),
        }),
        passportIssueDate: Yup.string().when('isPassportRequired', {
            is: true,
            then: schema =>
                schema
                    .required('Please select the issue date')
                    .test(
                        'is-future-date',
                        'Issue date must be in the past',
                        value => !!value && dayjs(value).isBefore(dayjs())
                    ),
            otherwise: schema => schema.nullable(),
        }),
        passportExpDate: Yup.string().when('isPassportRequired', {
            is: true,
            then: schema =>
                schema
                    .required('Please select the expiry date')
                    .test(
                        'is-future-date',
                        'Expiry date must be in the future',
                        value => !!value && dayjs(value).isAfter(dayjs())
                    ),
            otherwise: schema => schema.nullable(),
        }),

        isPanRequired: Yup.boolean(),
        pan: Yup.string()

            .when('isPanRequired', {
                is: true,
                then: schema =>
                    schema
                        .required('Please enter the PAN')
                        .test(
                            'no-lowercase',
                            'PAN must be in uppercase',
                            value => !/[a-z]/.test(value || '')
                        )
                        .min(10, 'PAN must be 10 characters')
                        .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format'),

                otherwise: schema => schema.nullable(),
            }),
    });
