import * as Yup from 'yup';

export const protectionSchema = Yup.object().shape({
    maxInvalidLoginAttempts: Yup.number()
        .required('Maximum invalid login attempts is required')
        .test('not-zero', 'Maximum invalid login attempts cannot be 0', value => value > 0),
    lockEffectivePeriod: Yup.string().required('Lock effective period is required'),
    lockoutTimespan: Yup.number()
        .required('Lockout timespan is required')
        .test('not-zero', 'Lockout timespan cannot be 0', value => value > 0),
});
export const policySchema = Yup.object().shape({
    minLength: Yup.string().required('This field is required'),
    minChangeChars: Yup.string().required('Minimum change character is required'),
    maxPasswordAge: Yup.string().required('Maximum password age is required'),
    prohibitPasswordReuseTimes: Yup.string().required('Prohibit password is required'),
});
