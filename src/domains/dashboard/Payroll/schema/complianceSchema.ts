import * as Yup from 'yup';

export const tdsSchema =  Yup.object().shape({
    tan: Yup.string()
        .test('no-leading-whitespace', 'No whitespace allowed at the start', value =>
            !value || !/^\s/.test(value)
        )
        .test('no-trailing-whitespace', 'No whitespace allowed at the end', value =>
            !value || !/\s$/.test(value)
        )
        .required('Please enter TAN'),
    taxRegime: Yup.string(),
    bankName: Yup.string()
        .test('no-leading-whitespace', 'No whitespace allowed at the start', value =>
            !value || !/^\s/.test(value)
        )
        .test('no-trailing-whitespace', 'No whitespace allowed at the end', value =>
            !value || !/\s$/.test(value)
        )
        .test('no-consecutive-whitespace', 'No consecutive whitespace allowed', value =>
            !value || !/\s{2,}/.test(value)
        ),
    bsrCode: Yup.string()
        .test('no-leading-whitespace', 'No whitespace allowed at the start', value =>
            !value || !/^\s/.test(value)
        )
        .test('no-trailing-whitespace', 'No whitespace allowed at the end', value =>
            !value || !/\s$/.test(value)
        )
        .test('no-consecutive-whitespace', 'No consecutive whitespace allowed', value =>
            !value || !/\s{2,}/.test(value)
        )
        .required('Please enter BSR Code'),
    name: Yup.string()
        .test('no-leading-whitespace', 'No whitespace allowed at the start', value =>
            !value || !/^\s/.test(value)
        )
        .test('no-trailing-whitespace', 'No whitespace allowed at the end', value =>
            !value || !/\s$/.test(value)
        )
        .test('no-consecutive-whitespace', 'No consecutive whitespace allowed', value =>
            !value || !/\s{2,}/.test(value)
        )
        .required('Please enter Authorized Signatory'),
    placeOfSigning: Yup.string()
        .test('no-leading-whitespace', 'No whitespace allowed at the start', value =>
            !value || !/^\s/.test(value)
        )
        .test('no-trailing-whitespace', 'No whitespace allowed at the end', value =>
            !value || !/\s$/.test(value)
        )
        .test('no-consecutive-whitespace', 'No consecutive whitespace allowed', value =>
            !value || !/\s{2,}/.test(value)
        ),
});