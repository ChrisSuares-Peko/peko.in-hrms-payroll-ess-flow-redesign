import * as Yup from 'yup';

const rolesSchema = Yup.object().shape({
    registeredBy: Yup.mixed()
        .nullable()
        .test(
            'valid-partner',
            'Partner is required',
            value => value === null || typeof value === 'string' || typeof value === 'number'
        )
        .notOneOf([''], 'Partner is required'),
});

export default rolesSchema;
