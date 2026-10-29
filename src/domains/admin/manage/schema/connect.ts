import * as Yup from 'yup';

export const connectSchema = Yup.object().shape({
    serviceProvider: Yup.string().required('Please enter service provider'),
    tagline: Yup.string().required('Please enter tagline'),
    mobileNo: Yup.string().matches(/^\d{10}$/, 'Please enter mobile number'),
    email: Yup.string().email('Please enter a valid email address'),
    //  website: Yup.string().url('Please enter website URL').required('Please enter website URL'),
    website: Yup.string().matches(
        /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/\S*)?$/,
        'Please enter a valid URL'
    ),
    address: Yup.string().required('Please enter address'),
    category: Yup.string().required('Please enter category'),
    description: Yup.string().required('Please enter description'),
    offerings: Yup.string().required('Please enter offerings'),
    rewards: Yup.string().required('Please enter rewards'),
    // status: Yup.boolean().required('Please specify status'),
    // services: Yup.array().of(Yup.string()),
});
