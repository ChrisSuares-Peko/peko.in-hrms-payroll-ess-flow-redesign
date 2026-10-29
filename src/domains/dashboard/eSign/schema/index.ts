import * as Yup from 'yup';

const emailRegex = /^(?!\.)[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,3}$/;
export const fileUploadSchema = Yup.object().shape({
    docket_title: Yup.string().trim().required('Please enter the document name'),
    base64: Yup.string().required('Please upload a PDF file'),
});

export const eSignDocSchema = Yup.object().shape({
    docket_title: Yup.string()
        .required('Please enter the document name')
        .test(
            'no-leading-trailing-space',
            'Document name cannot start or end with a blank space.',
            value => (value ? value.trim() === value : true)
        )
        .test(
            'no-multiple-spaces',
            'Document name cannot contain consecutive blank spaces.',
            value => (value ? !/\s{2,}/.test(value) : true)
        ),
    expiry_date: Yup.date(), // required('Please enter the expiry date'),
    reminder: Yup.boolean().required('Please specify if reminders are needed'),
    initiator_name: Yup.string()
        .required('Please enter the initiator name')

        .test(
            'no-leading-trailing-space',
            'Initiator name cannot start or end with a blank space.',
            value => (value ? value.trim() === value : true)
        )
        .test('valid-spacing', 'Initiator name cannot contain consecutive blank spaces.', value =>
            value ? !/^\s*$/.test(value) && !/\s{2,}/.test(value) : true
        )
        .min(3, 'Initiator name must be at least 3 characters')
        .max(50, 'Initiator name must be at most 50 characters'),

    initiator_email: Yup.string()
        .email('Please enter a valid email ID')
        .required('Please enter the email ID')
        .matches(emailRegex, 'Please enter a valid email ID'),

    reminder_interval: Yup.string().when('reminder', {
        is: true,
        then: schema =>
            schema
                .required('Please enter the reminder interval')
                .matches(/^\d+$/, 'Reminder interval must be a number')
                .test(
                    'is-greater-than-zero',
                    'Reminder interval must be at least 1 day',
                    value => Number(value) > 0
                ),
        otherwise: schema => schema.optional(),
    }),
    documentBase64: Yup.string().required('Document base64 is required'),
    sequentialSignature: Yup.boolean().required('Please specify if reminders are needed'),
    signingPolicy: Yup.string()
        .oneOf(['QUICKSIGN', 'AADHAAR'])
        .required('Please select an eSign type'),
    termsofUse: Yup.boolean()
        .oneOf([true], 'Please accept the terms of use to proceed') // Ensures the value must be true
        .required('Please accept the terms of use to proceed'), // Optional, for consistency
    signers_info: Yup.array()
        .of(
            Yup.object().shape({
                signer_name: Yup.string()
                    .required('Please enter the signer name')

                    .test(
                        'no-leading-trailing-space',
                        'Signer name cannot start or end with a blank space.',
                        value => (value ? value.trim() === value : true)
                    )
                    .test(
                        'valid-spacing',
                        'Signer name cannot contain consecutive blank space.',
                        value => (value ? !/^\s*$/.test(value) && !/\s{2,}/.test(value) : true)
                    )
                    .min(3, 'Signer name must be at least 3 characters')
                    .max(50, 'Signer name must be at most 50 characters'),
                signer_email: Yup.string()
                    .email('Please enter a valid email ID')
                    .required('Please enter the email ID')
                    .matches(emailRegex, 'Please enter a valid email ID')
                    .test(
                        'unique-email',
                        'Signer email must be unique',
                        function uniqueEmailTest(value) {
                            if (!value) return true;
                            const formValues = this?.from?.[1]?.value || {};
                            const signers = Array.isArray(formValues.signers_info)
                                ? formValues.signers_info
                                : [];
                            // build an array of emails
                            const emails = signers
                                .map((s: { signer_email: string }) => s.signer_email?.toLowerCase())
                                .filter(Boolean);
                            // count how many times current value appears
                            const occurrences = emails.filter(
                                (email: string) => email === value.toLowerCase()
                            ).length;
                            return occurrences <= 1;
                        }
                    ),
                // signer_mobile: Yup.string()
                //     .matches(/^\d{9,10}$/, 'Mobile number must be at least 9 digits')
                //     .optional(),
                sequence: Yup.string()
                    .matches(/^\d+$/, 'Sequence must be a number')
                    .required('Please enter the sequence'),
            })
        )
        .required('Please add at least one signer')
        .test('unique-signer-emails', 'Signer email IDs must be unique', value => {
            if (!value) return true; // skip if empty
            const emails = value.map(v => v.signer_email?.toLowerCase());
            const uniqueEmails = new Set(emails);
            return emails.length === uniqueEmails.size;
        }),
});
export const signerValidationSchema = Yup.object().shape({
    signer_name: Yup.string().trim().required('Please enter the signer name'),
    signer_email: Yup.string().email('Invalid email').required('Please enter the signer email'),
    // signer_mobile: Yup.string()
    //     .matches(/^\d{9,10}$/, 'Mobile number must be at least 9 digits')
    //     .optional(),
});
export const touchedSignersSchema = Yup.object().shape({
    signer: Yup.string().required('Please select the signer'),
});
