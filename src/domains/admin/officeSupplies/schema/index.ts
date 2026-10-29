import * as Yup from 'yup';

export const orderUpdateSchema = (productIds: string[]) => {
    let schema = Yup.object();

    schema = Yup.object().shape({
        ecomOrderStatus: Yup.string().required('Please select order status'),
        cancelReason: Yup.string().when('ecomOrderStatus', {
            is: 'CANCELLED',
            then: yup =>
                yup
                    .required('Please enter the cancel reason')
                    .matches(/^[^\s].*$/, 'Cancel reason cannot start with whitespace')
                    .min(3, 'Cancel reason must be at least 3 characters'),
            otherwise: yup => yup.optional(),
        }),
        deliveryPartner: Yup.string()
            .trim()
            .matches(/^[A-Za-z\s]*$/, 'Delivery partner must only contain alphabetic characters')
            .optional(), // Allows empty string

        trackingWebsite: Yup.string()
            .trim()
            .matches(
                /^[A-Za-z:/.]*$/,
                'Tracking website must only contain alphabetic characters and : / .'
            )
            .optional(), // Allows empty string
    });

    productIds.forEach(productId => {
        schema = schema.shape({
            [`product_${productId}`]: Yup.string().required(`Please select vendor`),
        });
    });

    return schema;
};
