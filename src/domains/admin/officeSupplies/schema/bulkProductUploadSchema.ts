import * as Yup from 'yup';

export const bulkProductUploadSchema = Yup.object().shape({
    name: Yup.string()
        .trim()
        .required('Please enter the product name')
        .min(3, 'Product name must be at least 3 characters'),
    brand: Yup.string()
        .trim()
        .required('Please enter the brand name')
        .min(3, 'Brand name must be at least 3 characters'),
    categoryName: Yup.string().trim().required('Please select the category'),
    description: Yup.string()
        .trim()
        .required('Pease enter the description')
        .min(3, 'Description must be at least 3 characters'),
    highlights: Yup.string()
        .trim()
        .required('Please enter the highlights')
        .min(3, 'Highlights must be at least 3 characters'),
    warranty: Yup.string().trim(),
    SKUCode: Yup.string().trim(),
    actualPrice: Yup.number()
        .required('Please enter the price')
        .typeError('Price must be a number'),
    price: Yup.number()
        .required('Please enter the discounted price')
        .typeError('Price must be a number')
        .test('valid-price', 'Price cannot be greater than actual price', function validatePrice(value) {
            const { actualPrice } = this.parent; // Access other field value
            return value <= actualPrice; // Return true if price is less than or equal to actual price
        })
        .min(0, 'Price cannot be less than or equal to 0'),
    quantity: Yup.number()
        .required('Please enter the quantity')
        .typeError('Quantity must be a number'),
    discountType: Yup.string()
        .required('Please select the discount type')
        .oneOf(['PERCENTAGE', 'FLAT'], 'Discount type should be either "PERCENTAGE" or "FLAT"'),
    discount: Yup.number()
        .test('valid-discount', 'Please enter the discount', function validateDiscount(value) {
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

    vatType: Yup.string()
        .required('Please select the VAT type')
        .oneOf(['PERCENTAGE', 'CUSTOM'], 'VAT type should be either "PERCENTAGE" or "CUSTOM"'),
    VAT: Yup.number()
        .test('valid-vat', 'Please enter the VAT', function validateVat(value) {
            const { vatType } = this.parent; // Access the value of vatType
            const isPercentage = vatType === 'PERCENTAGE'; // Check if vatType is 'PERCENTAGE'
            const isVATProvided = typeof value === 'number' && value >= 0; // Check if VAT is provided and non-negative

            if (isPercentage) {
                // If VAT type is percentage, check if value is between 0 and 100
                return isVATProvided && value >= 0 && value <= 100;
            }
            // If VAT type is custom, check if value is provided and non-negative
            return isVATProvided;
        })
        .typeError('Please enter the VAT')
        .min(0, 'VAT amount cannot be less than 0'), // Additional validation for non-negative VAT

    vendorName: Yup.string().trim().required('Please select a vendor'),
    vendorPrice: Yup.number()
        .required('Please enter the vendor price')
        .typeError('Vendor price must be a number'),
    productImage1: Yup.string().url('Product image 1 must be a valid URL').nullable(),
    productImage2: Yup.string().url('Product image 2 must be a valid URL').nullable(),
    productImage3: Yup.string().url('Product image 3 must be a valid URL').nullable(),
});
