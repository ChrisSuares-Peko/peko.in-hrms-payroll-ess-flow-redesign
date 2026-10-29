import * as Yup from 'yup';

const ProductSchema = Yup.object().shape({
    name: Yup.string().required('Name is required').min(3, 'Name must be at least 3 characters'),
    brand: Yup.string().required('Brand is required').min(3, 'Brand must be at least 3 characters'),
    description: Yup.string()
        .required('Description is required')
        .min(3, 'Description must be at least 3 characters'),
    highlights: Yup.string()
        .required('Highlights is required')
        .min(3, 'Highlights must be at least 3 characters'),
    // warranty: Yup.string().required('Warranty is required'),
    // SKUCode: Yup.string().required('SKU Code is required'),
    categoryId: Yup.string().required('Category is required'),
    priceExcludedVat: Yup.number().required('Price is required'),
    quantity: Yup.number().required('Quantity is required'),
    discountType: Yup.string().required('Discount Type is required'),
    discount: Yup.number().required('Discount is required'),
    gstType: Yup.string().required('GST Type is required'),
    productImage1: Yup.string().required('Image is required'),
    // productImage2: Yup.string().required('Image is required'),
    // productImage3: Yup.string().required('Image is required'),
    GST: Yup.number().required('GST is required'),
    vendors: Yup.array().of(
        Yup.object().shape({
            id: Yup.string().required('Please select a vendor'),
            price: Yup.string().required('Please enter price'),
        })
    ),
});

export default ProductSchema;
