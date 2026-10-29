import * as Yup from 'yup';

const chartOfAccountSchema = Yup.object().shape({
    accountName: Yup.string().required('Please enter the account name'),
    accountType: Yup.string().required('Please select the account type'),
    accountCode: Yup.string()
        .matches(/^[A-Za-z0-9-]+$/, 'Account code can only contain letters, numbers, and dashes')
        .max(50, 'Account code must not exceed 50 characters'),
    description: Yup.string()
        .required('Please enter the description')
        .max(700, 'Description must not exceed 700 characters'),
    isSubAccount: Yup.boolean(),
    parentAccId: Yup.string().when('isSubAccount', {
        is: true,
        then: schema => schema.required('Please select a parent account'),
        otherwise: schema => schema.notRequired(),
    }),
});

export default chartOfAccountSchema;
