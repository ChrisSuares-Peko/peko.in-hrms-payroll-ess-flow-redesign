import * as Yup from 'yup';

import { textField } from '../../utils/yupHelpers';

export const itemsSchema = Yup.object({
    items: Yup.array()
        .of(
            Yup.object({
                description: textField('Description', 'Please enter the description'),
                hsnSac: Yup.string()
                    .required('Please enter the HSN/SAC')
                    .test('hsn-validation', 'HSN code must be 4, 6, or 8 numeric digits', v => {
                        if (!v) return true;
                        return /^\d+$/.test(v) && [4, 6, 8].includes(v.length);
                    }),
                quantity: Yup.number()
                    .typeError('Quantity must be a number')
                    .required('Please enter the quantity')
                    .min(1, 'Quantity must be at least 1'),
                unit: Yup.string().required('Please select the unit'),
                unitPrice: Yup.number()
                    .typeError('Price must be a number')
                    .required('Please enter the price')
                    .moreThan(0, 'Price must be greater than zero'),
                discount: Yup.number()
                    .transform((value, originalValue) =>
                        originalValue === '' || originalValue === null ? undefined : value
                    )
                    .typeError('Discount must be a number')
                    .min(0, 'Discount must be 0 or more')
                    .test(
                        'max-discount',
                        'Discount must be less than the item total amount.',
                        function validateMaxDiscount(value) {
                            if (value === undefined || value === null) return true;
                            const { unitPrice, quantity } = this.parent;
                            if (!unitPrice || !quantity) return true;
                            return value < unitPrice * quantity;
                        }
                    ),
                gstRate: Yup.string().required('Please select the GST tax rate'),
            })
        )
        .min(1, 'At least one item is required'),
});
