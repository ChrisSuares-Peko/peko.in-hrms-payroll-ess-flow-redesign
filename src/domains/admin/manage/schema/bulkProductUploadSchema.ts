import * as Yup from 'yup';

export const bulkProductUploadSchema = Yup.object().shape({
    name: Yup.string().trim().required('Product name is required'),
    brand: Yup.string().trim().required('Brand name is required'),
    categoryName: Yup.string().trim().required('Category name is required'),
    description: Yup.string().trim().required('Description is required'),
    highlights: Yup.string().trim().required('Highlights are required'),
    warranty: Yup.string().trim().required('Warranty information is required'),
    SKUCode: Yup.string().trim().required('SKU code is required'),
    actualPrice: Yup.number().required('Price is required').typeError('Price must be a number'),
    price: Yup.number()
        .required('Price is required')
        .typeError('Price must be a number')
        .test(
            'valid-price',
            'Price cannot be greater than actual price',
            function validatePrice(value) {
                const { actualPrice } = this.parent; // Access other field value
                return value <= actualPrice; // Return true if price is less than or equal to actual price
            }
        )
        .min(0, 'Price cannot be less than or equal to 0'),
    quantity: Yup.number().required('Quantity is required').typeError('Quantity must be a number'),
    discountType: Yup.string()
        .required('Discount type is required')
        .oneOf(['PERCENTAGE', 'FLAT'], 'Discount type should be either "PERCENTAGE" or "FLAT"'),
    discount: Yup.number()
        .test('valid-discount', 'Invalid discount amount', function validateDiscount(value) {
            const { discountType } = this.parent; // Access the value of discountType
            const isPercentage = discountType === 'PERCENTAGE'; // Check if discountType is 'PERCENTAGE'
            const isDiscountProvided = typeof value === 'number' && value >= 0; // Check if discount is provided and non-negative

            if (isPercentage) {
                // If discount type is percentage, check if value is between 0 and 100
                return isDiscountProvided && value >= 0 && value <= 100;
            }
            // If discount type is flat, check if value is provided and non-negative
            return isDiscountProvided;
        })
        .typeError('Discount must be a number')
        .min(0, 'Discount cannot be less than 0'), // Additional validation for non-negative VAT

    gstType: Yup.string()
        .required('GST type is required')
        .oneOf(['PERCENTAGE', 'CUSTOM'], 'GST type should be either "PERCENTAGE" or "CUSTOM"'),
    GST: Yup.number()
        .test('valid-gst', 'Invalid GST amount', function validateGst(value) {
            const { gstType } = this.parent; // Access the value of vatType
            const isPercentage = gstType === 'PERCENTAGE'; // Check if vatType is 'PERCENTAGE'
            const isGSTProvided = typeof value === 'number' && value >= 0; // Check if VAT is provided and non-negative

            if (isPercentage) {
                // If VAT type is percentage, check if value is between 0 and 100
                return isGSTProvided && value >= 0 && value <= 100;
            }
            // If VAT type is custom, check if value is provided and non-negative
            return isGSTProvided;
        })
        .typeError('GST must be a number')
        .min(0, 'GST amount cannot be less than 0'), // Additional validation for non-negative VAT

    vendorName: Yup.string().trim().required('Vendor name is required'),
    vendorPrice: Yup.number()
        .required('Vendor price is required')
        .typeError('Vendor price must be a number'),
    productImage1: Yup.string().url('Product image 1 must be a valid URL').nullable(),
    productImage2: Yup.string().url('Product image 2 must be a valid URL').nullable(),
    productImage3: Yup.string().url('Product image 3 must be a valid URL').nullable(),
});
