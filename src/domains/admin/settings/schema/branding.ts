import * as Yup from 'yup';

const brandingSchema = Yup.object().shape({
    branding: Yup.string().required('Please enter the branding name'),
    baseUrl: Yup.string().required('Please enter the portal url'),
    cleverTapProjectId: Yup.string().required('Please enter the clevertap project id'),
    cleverTapPasscode: Yup.string().required('Please enter the clevertap passcode'),
    sharePercentage: Yup.string().required('Please enter the share percentage'),
    logo: Yup.string().optional(),
    signUpLogo: Yup.string().optional(),
});

export default brandingSchema;
