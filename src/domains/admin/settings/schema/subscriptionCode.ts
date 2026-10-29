import * as Yup from 'yup';

const subscriptionCodeSchema = Yup.object().shape({
    billingType: Yup.string().required('Please select the billing type'),
    packageId: Yup.string().required('Please select the package'),
    quantity: Yup.number()
        .required('Please enter the quantity')
        .min(1, 'Quantity must be at least 1'),
});

export default subscriptionCodeSchema;
