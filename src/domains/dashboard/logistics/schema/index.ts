import * as Yup from 'yup';

export const senderSchema = Yup.object().shape({
    senderName: Yup.string()
        .required('Please enter name')
        .min(3, 'Name must be at least 3 characters')
        .max(50, 'First name cannot be longer than 50 characters'),
    senderCountry: Yup.string().required('Please select country'),
    senderAddress: Yup.string()
        .required('Please enter address')
        .min(3, 'Address must be at least 3 characters'),
    senderZipCode: Yup.string()
        .required('Please enter pin code')
        .matches(/^\d{5,10}$/, 'Please enter pin code'),
    senderCity: Yup.string().required('Please select city'),
    senderState: Yup.string().notRequired(),
    senderPhone: Yup.string()
        .matches(/^[0-9]{9,12}$/, 'Phone number must be at least 9 digits')
        .required('Please enter phone number'),
    senderEmail: Yup.string()
        .email('Please enter valid email address')
        .required('Please enter email address')
        .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter valid email address'),
    senderRemark: Yup.string().notRequired(),
});

// export const senderSchema = (pincodeErr: boolean|null) =>
//     Yup.object().shape({
//         senderName: Yup.string()
//             .required('Please enter name')
//             .min(3, 'Name must be at least 3 characters')
//             .max(50, 'First name cannot be longer than 50 characters'),
//         senderCountry: Yup.string().required('Please select country'),
//         senderAddress: Yup.string()
//             .required('Please enter address')
//             .min(3, 'Address must be at least 3 characters'),
//         senderZipCode: Yup.string()
//             .required('Please enter pin code')
//             .test(
//                 'pincodeServiceability',
//                 'This pincode is not serviceable',
//                 (value) => {
//                     if (pincodeErr) {
//                         return false;
//                     }
//                     return true;
//                 }
//             ),
//         senderCity: Yup.string().required('Please select city'),
//         senderState: Yup.string().notRequired(),
//         senderPhone: Yup.string()
//             .matches(/^[0-9]{9,12}$/, 'Phone number must be at least 9 digits')
//             .required('Please enter phone number'),
//         senderEmail: Yup.string()
//             .email('Please enter valid email address')
//             .required('Please enter email address')
//             .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter valid email address'),
//         senderRemark: Yup.string().notRequired(),
//     });

export const recieverSchema = () =>
    Yup.object().shape({
        recieverName: Yup.string()
            .required('Please enter name')
            .min(3, 'Name must be at least 3 characters')
            .max(50, 'First name cannot be longer than 50 characters'),
        recieverCountry: Yup.string().required('Please select country'),
        recieverCity: Yup.string().required('Please select city'),
        recieverAddress: Yup.string()
            .required('Please enter address')
            .min(3, 'Address must be at least 3 characters'),
        recieverPhone: Yup.string()
            .matches(/^[0-9]{9,12}$/, 'Phone number must be at least 9 digits')
            .required('Please enter phone number'),
        recieverEmail: Yup.string()
            .email('Please enter valid email address')
            .required('Please enter email address')
            .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter valid email address'),
        recieverZipCode: Yup.string()
            .required('Please enter pin code')
            .matches(/^\d{5,10}$/, 'Please enter pin code'),
        recieverState: Yup.string().notRequired(),
        recieverRemark: Yup.string().notRequired(),
    });

export const generateLogisticsPickupDetailsSchema = () => {
    const schema = Yup.object().shape({
        totalWeight: Yup.number()
            .required('Please enter total weight')
            .positive('Weight must be greater than zero')
            .test('maxDigits', 'Invalid weight', number => {
                const numStr = String(number).replace('.', '');
                return numStr.length <= 6;
            })
            .typeError('Only numeric values are allowed'),

        pickupDate: Yup.string().required('Please select pickup date'),
        serviceType: Yup.string().required('Please select service type'),
        orderCategory: Yup.string().required('Please enter order category'),
    });

    return schema;
};
export const agreementSchema = Yup.object().shape({
    agreementOne: Yup.boolean().required('Required').oneOf([true], 'Agree to continue'),
    agreementTwo: Yup.boolean().required('Required').oneOf([true], 'Agree to continue'),
});
