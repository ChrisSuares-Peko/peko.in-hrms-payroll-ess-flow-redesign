import * as Yup from 'yup';

export const airlinePriceUpdateSchema = Yup.object().shape({
    oldPrice: Yup.number().typeError('Please enter a valid number'),
    newPrice: Yup.number()
        .typeError('Please enter a valid number')
        .required('Please enter the new price'),
    additionalPayment: Yup.number()
        .typeError('Please enter a valid number')
        .required('Please enter the additional payment'),
    email: Yup.string()
        .required('Please enter the email ID')
        .matches(
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:,[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})*$/,
            'Please enter a valid email ID'
        ),
    adminComments: Yup.string().max(10000, 'Comments cannot exceed 10,000 characters'),
});

export const airlineTicketUpdateSchema = Yup.object().shape({
    flightTicketDoc: Yup.lazy(value => {
        if (typeof value === 'object') {
            return Yup.object().required('Please upload a file');
        }
        return Yup.string().required('Please upload a file');
    }),
    flightTicketPNR: Yup.string().required('Please enter the PNR'),
});
