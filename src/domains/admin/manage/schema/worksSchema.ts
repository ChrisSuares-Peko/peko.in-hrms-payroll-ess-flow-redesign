import * as Yup from 'yup';

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const nameRegex = /^[A-Za-z0-9\s\-']+$/;
const numbers = /^\d+$/;
const worksSchema = Yup.object().shape({
    name: Yup.string()
        .trim()
        .required('Please enter the work name')
        .min(3, 'Work name must be at least 3 characters')
        .matches(nameRegex, 'Enter a valid work name'),
    features: Yup.string()
        .trim()
        .required('Please enter the features')
        .min(3, 'Features must be at least 3 characters'),
    description: Yup.string()
        .trim()
        .required('Please enter the description')
        .min(3, 'Description must be at least 3 characters'),
    contactName: Yup.string()
        .trim()
        .required('Please enter the POC name')
        .min(3, 'POC name must be at least 3 characters')
        .matches(nameRegex, 'Enter a valid POC name'),
    contactEmail: Yup.string()
        .required('Please enter the POC email ID')
        .matches(emailRegex, 'Please enter a valid email ID'),
    contactMobile: Yup.string()
        .required('Please enter the POC mobile number')
        .trim()
        .min(10, 'Mobile number must be at least 10 digits')
        .max(10, 'Maximum 10 characters are allowed')
        .matches(numbers, 'Please enter a valid POC mobile number'),
    vendorId: Yup.string().trim().required('Please select the vendor'),
    partnerId: Yup.string().required('Please enter the partner name'),
    imageBase: Yup.string().trim().required('Please upload image'),
    imageFormat: Yup.mixed().nullable().optional(),
    portfolio: Yup.array(),
});

export default worksSchema;
