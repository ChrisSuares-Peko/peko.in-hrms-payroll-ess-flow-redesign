import * as Yup from 'yup';

const ipWhitelistSchema = Yup.object().shape({
    ip: Yup.string().required('Please enter the IP'),
    partnerId: Yup.string().required('Please select a partner'),
});

export default ipWhitelistSchema;
