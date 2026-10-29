import * as Yup from 'yup';

// function validateVendorPrice(this: Yup.TestContext<Yup.AnyObject>, value: number) {
//     console.log("checking",this)
//     const { priceExcludedVat, VAT, discount } = this.options.context;
//     const maxAllowedPrice = priceExcludedVat - discount + VAT;
//     console.log("price value",{values:value,price:parseFloat(maxAllowedPrice)})
//     console.log("price details",value <= parseFloat(maxAllowedPrice))
//     return value <= maxAllowedPrice;
// }

const ProductSchema = Yup.object().shape({
    name: Yup.string()
        .required('Please enter the product name')
        .min(3, 'Product name must be at least 3 characters')
        .matches(
            /^(?!.*[!@#$%^&*()\-_=+[\]{};:'",.<>?/|`~]{2,}).*$/,
            'Product name cannot contain consecutive special characters'
        )
        .test(
            'no-leading-whitespace',
            'Product name cannot start with whitespace',
            value => !/^\s/.test(value) // Check if starts with whitespace
        )
        .test(
            'no-multiple-whitespace',
            'Product name cannot contain consecutive whitespaces',
            value => !/\s{2,}/.test(value)
        ) // No consecutive spaces
        .test(
            'not-only-whitespace',
            'Product name cannot be only whitespace',
            value => !/^\s*$/.test(value)
        ), // Not only whitespaces
    brand: Yup.string()
        .required('Please enter the brand name')
        .min(3, 'Brand name must be at least 3 characters'),
    description: Yup.string()
        .required('Pease enter the description')
        .min(3, 'Description must be at least 3 characters'),
    highlights: Yup.string()
        .required('Please enter the highlights')
        .min(3, 'Highlights must be at least 3 characters'),
    // warranty: Yup.string().required('Warranty is required'),
    // SKUCode: Yup.string().required('SKU Code is required'),
    categoryId: Yup.string().required('Please select the category'),
    priceExcludedVat: Yup.number().required('Please enter the price'),
    quantity: Yup.number().required('Please enter the quantity'),
    discountType: Yup.string().required('Please select the discount type'),
    discount: Yup.number().required('Please enter the discount'),
    gstType: Yup.string().required('Please select the GST type'),
    productImage1: Yup.string().required('Please select the product image'),
    // productImage2: Yup.string().required('Image is required'),
    // productImage3: Yup.string().required('Image is required'),
    GST: Yup.number().required('Please enter the GST'),
    // vendors: Yup.array().of(
    //     Yup.object().shape({
    //         id: Yup.string().required('Please select a vendor'),
    //         price: Yup.string().required('Please enter the vendor price'),
    //     })
    // ),
    vendors: Yup.array()
        .of(
            Yup.object().shape({
                id: Yup.string().required('Please select a vendor'),
                price: Yup.number()
                    .required('Please enter the vendor price')
                    .test(
                        'maxPrice',
                        'Vendor price exceeds maximum allowed price',
                        function validateVendorPrice(value) {
                            const { priceExcludedVat, GST, discount } = this.options.context as any;
                      

                            const maxAllowedPrice =
                                parseFloat(priceExcludedVat) -
                                parseFloat(discount) +
                                parseFloat(GST);
                    

                            return value <= maxAllowedPrice;
                        }
                    )
                    .positive('Price must be a positive number'),
            })
        )
        .min(1, 'Please add at least one vendor'),
});

export default ProductSchema;
