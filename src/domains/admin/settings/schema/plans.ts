import * as Yup from 'yup';

export const plansSchema = Yup.object().shape({
    name: Yup.string().required('Please enter plan name'),
    price: Yup.string().required('Please enter plan price'),
    description: Yup.string().required('Please enter description'),
    highlights: Yup.string().required('Please enter highlights'),
    billingCycle: Yup.string().required('Please select billing cycle'),
    is_available: Yup.boolean().required('Please select availability'),
    // logo: Yup.string().required('Please provide logo URL'),
});
