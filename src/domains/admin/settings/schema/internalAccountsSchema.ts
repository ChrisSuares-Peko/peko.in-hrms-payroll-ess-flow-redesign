import * as Yup from 'yup';

const internalAccountsSchema = Yup.object().shape({
    accounts: Yup.array()
        .of(Yup.string().required())
        .min(1, 'Please select at least one account')
        .required('Please select accounts'),
});

export default internalAccountsSchema;
