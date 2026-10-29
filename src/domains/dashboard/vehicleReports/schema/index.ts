import * as Yup from 'yup';

// Indian registration numbers: two-letter state, one/two-digit RTO, up to three
// series letters, four digits. Matches the format the RC verification API accepts.
export const REG_NUMBER_REGEX = /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$/;

export const valuationSchema = Yup.object({
    purpose: Yup.string().required('Select whether you want to buy or sell'),
    counterparty: Yup.string().when('purpose', {
        is: 'buy',
        then: rule => rule.required('Select who you are buying from'),
        otherwise: rule => rule.notRequired(),
    }),
    vehicleCategory: Yup.string().required('Vehicle category is required'),
    make: Yup.string().required('Make is required'),
    model: Yup.string().required('Model is required'),
    manufacturingYear: Yup.string().required('Manufacturing year is required'),
    variant: Yup.string().required('Trim/Variant is required'),
    kilometresDriven: Yup.number()
        .typeError('Enter kilometres as a number')
        .required('Kilometres driven is required')
        .min(0, 'Kilometres driven cannot be negative')
        .max(1000000, 'Enter a realistic kilometre reading'),
    city: Yup.string().trim().required('City is required'),
});

export const historySchema = Yup.object({
    registrationNumber: Yup.string()
        .required('Registration number is required')
        .matches(REG_NUMBER_REGEX, 'Enter a valid registration number, e.g. KA01AB1234'),
});

export const inspectionSchema = Yup.object({
    bodyType: Yup.string().required('Body type is required'),
    make: Yup.string().required('Make is required'),
    model: Yup.string().required('Model is required'),
    manufacturingYear: Yup.string().required('Manufacturing year is required'),
    variant: Yup.string().required('Trim/Variant is required'),
    registrationNumber: Yup.string()
        .required('Registration number is required')
        .matches(REG_NUMBER_REGEX, 'Enter a valid registration number, e.g. KA01AB1234'),
    contactName: Yup.string().trim().required('Contact name is required'),
    mobileNumber: Yup.string()
        .required('Mobile number is required')
        .matches(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
    fullAddress: Yup.string().trim().required('Full address is required'),
    pincode: Yup.string()
        .required('Pincode is required')
        .matches(/^\d{6}$/, 'Enter a valid 6-digit pincode'),
    city: Yup.string().required('City is required'),
    state: Yup.string().required('State is required'),
    slot1Date: Yup.string().required('Pick a date for slot 1'),
    slot1Time: Yup.string().required('Pick a time for slot 1'),
    // Slot 2 is optional, but a half-filled slot is not useful to the technician.
    // These are `test`s rather than mutual `when`s, which Yup rejects as a cycle.
    slot2Date: Yup.string()
        .test(
            'slot2-date-required',
            'Pick a date for slot 2',
            (value, ctx) => !ctx.parent.slot2Time || !!value
        )
        .test(
            'slot2-after-slot1',
            'Slot 2 must be on or after slot 1',
            // Both values are ISO `YYYY-MM-DD` strings, so a lexical compare is safe.
            (value, ctx) => !value || !ctx.parent.slot1Date || value >= ctx.parent.slot1Date
        ),
    slot2Time: Yup.string().test(
        'slot2-time-required',
        'Pick a time for slot 2',
        (value, ctx) => !ctx.parent.slot2Date || !!value
    ),
});
