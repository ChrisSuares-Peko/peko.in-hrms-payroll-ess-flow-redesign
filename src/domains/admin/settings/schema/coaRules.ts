import * as Yup from 'yup';

const coaRulesSchema = Yup.object().shape({
    prefix: Yup.string()
        .required('Please enter prefix')
        .matches(/^[A-Za-z\s]+$/, 'Prefix must contain only alphabets and spaces')
        .max(50, 'Prefix must not exceed 50 characters'),

    accountType: Yup.string().required('Please select the account type'),
    entityType: Yup.string().required('Please select the entity type'),

    description: Yup.string()
        .required('Please enter the description')
        .max(700, 'Description must not exceed 700 characters'),

    isSubAccount: Yup.boolean(),

    parentAccId: Yup.string().when('isSubAccount', {
        is: true,
        then: schema => schema.required('Please select a parent account'),
        otherwise: schema => schema.notRequired(),
    }),
    isDefault: Yup.boolean(),
});

export default coaRulesSchema;
