import { useEffect, useState } from 'react';

import { Form, Skeleton } from 'antd';

import TextAreaInput from '@components/atomic/inputs/TextAreaInput';
import TextInput from '@components/atomic/inputs/TextInput';
import { DropDown } from '@customtypes/general';
import { useAppDispatch } from '@src/hooks/store';

import CustomModalWithForm from './CustomModalWithForm';
import SelectInput from '../../../../../../components/atomic/inputs/SelectInput';
import { discountTypes, gstType } from '../../../../settings/utils/serviceOperator';
import { bulkProductUploadSchema } from '../../../schema/bulkProductUploadSchema';
import { updateProductDetails } from '../../../slices/bulkProducts';
import { bulkProduct, Vendor } from '../../../types/products';

type BulkUploadEditModalProps = {
    open: boolean;
    handleCancel: () => void;
    productData: bulkProduct | undefined;
    productIndex: number | undefined;
    allVendors: Vendor[] | undefined;
    categoryData: DropDown | undefined;
};

const BulkUploadEditModal = ({
    open,
    handleCancel,
    productData,
    productIndex,
    categoryData,
    allVendors,
}: BulkUploadEditModalProps) => {
    const vendorData = allVendors?.map((v, i) => ({
        label: v.vendorName,
        value: v.vendorName,
    }));

    const updatePrice = (
        actualPrice: number | string,
        discountType: string,
        discount: number | string
    ) => {
        const parsedActualPrice: number =
            typeof actualPrice === 'string' ? parseFloat(actualPrice) : actualPrice;
        const parsedDiscount: number =
            typeof discount === 'string' ? parseFloat(discount) : discount;
        if (!Number.isNaN(parsedActualPrice) && discountType && !Number.isNaN(parsedDiscount)) {
            let newPrice: number | undefined = parsedActualPrice;
            if (discountType === 'PERCENTAGE') {
                newPrice = parsedActualPrice - (parsedActualPrice * parsedDiscount) / 100;
            } else if (discountType === 'FLAT') {
                newPrice = parsedActualPrice - parsedDiscount;
            }
            setPrice(newPrice);
        } else {
            setPrice(undefined);
        }
    };

    const dispatch = useAppDispatch();
    const [price, setPrice] = useState<number | undefined>(productData?.price || undefined);
    const [discountType, setDiscountType] = useState<string>(productData?.discountType || '');
    const [discount, setDiscount] = useState<number | string>(productData?.discount || '');
    const [actualPrice, setActualPrice] = useState<number | string>(productData?.actualPrice || '');
    useEffect(() => {
        updatePrice(actualPrice, discountType!, discount!);
    }, [actualPrice, discountType, discount]);

    const handleUpdateProduct = (values: any) => {
        dispatch(updateProductDetails({ index: productIndex!, data: values }));
        handleCancel();
    };

    return (
        <CustomModalWithForm
            modalTitle="Product"
            open={open}
            handleCancel={handleCancel}
            handleFormSubmit={values => {
                handleUpdateProduct(values);
                handleCancel();
            }}
            reinitialize
            initialValues={{
                name: productData?.name || '',
                brand: productData?.brand || '',
                categoryName: productData?.categoryName || '',
                description: productData?.description || '',
                highlights: productData?.highlights || '',
                warranty: productData?.warranty || '',
                SKUCode: productData?.SKUCode || '',
                actualPrice: actualPrice || '',
                price: price || '',
                quantity: productData?.quantity || '',

                discountType: discountType || '',
                discount: discount || '',

                gstType: productData?.gstType || '',
                GST: productData?.GST || '',

                vendorName: productData?.vendorName || '',
                vendorPrice: productData?.vendorPrice || '',

                productImage1: productData?.productImage1 || '',
                productImage2: productData?.productImage2 || '',
                productImage3: productData?.productImage3 || '',
            }}
            validationSchema={bulkProductUploadSchema}
        >
            <Form layout="vertical" onFinish={handleUpdateProduct}>
                <TextInput
                    label="Product Name"
                    isRequired
                    name="name"
                    placeholder="Please enter product name"
                    type="text"
                    allowAlphabetsAndSpaceOnly
                />
                <TextInput
                    label="Brand Name"
                    isRequired
                    name="brand"
                    placeholder="Please enter brand name"
                    type="text"
                    allowAlphabetsAndSpaceOnly
                />

                {categoryData ? (
                    <SelectInput
                        isRequired
                        name="categoryName"
                        options={categoryData}
                        placeholder="Please select a category"
                        label="Category"
                    />
                ) : (
                    <Skeleton.Input active block />
                )}
                <TextInput
                    label="Description"
                    isRequired
                    name="description"
                    placeholder="Please enter description"
                    type="text"
                    allowAlphabetsSpaceAndNumbersOnly
                />
                <TextAreaInput
                    name="highlights"
                    label="Highlights"
                    placeholder="Please enter highlights"
                    isRequired
                />
                <TextAreaInput
                    name="warranty"
                    label="Warranty"
                    placeholder="Please enter warranty"
                />
                <TextInput
                    label="SKU code"
                    name="SKUCode"
                    placeholder="Please enter SKU code"
                    type="text"
                    allowAlphabetsSpaceAndNumbersOnly
                />
                <TextInput
                    label="Price (Excluded VAT)"
                    isRequired
                    name="actualPrice"
                    placeholder="Please enter price"
                    type="text"
                    allowTwoDecimalsOnly
                    handleChange={v => setActualPrice(v)}
                />

                <SelectInput
                    isRequired
                    name="discountType"
                    options={discountTypes}
                    handleChange={v => setDiscountType(v)}
                    placeholder="Please select discount type"
                    label="Discount Type"
                />
                <TextInput
                    label="Discount"
                    isRequired
                    name="discount"
                    placeholder="Please enter discount"
                    type="text"
                    allowNumbersOnly
                    handleChange={v => setDiscount(v)}
                />
                <TextInput
                    isDisabled
                    label="Discounted Price"
                    isRequired
                    name="price"
                    placeholder="Please enter price"
                    type="text"
                    allowTwoDecimalsOnly
                />

                <TextInput
                    label="Quantity"
                    isRequired
                    name="quantity"
                    placeholder="Please enter quantity"
                    type="text"
                    allowNumbersOnly
                />

                <SelectInput
                    isRequired
                    name="gstType"
                    options={gstType}
                    placeholder="Please select GST type"
                    label="GST Type"
                />
                <TextInput
                    label="GST"
                    isRequired
                    name="GST"
                    placeholder="Please enter GST"
                    type="text"
                    allowNumbersOnly
                />
                <SelectInput
                    isRequired
                    name="vendorName"
                    options={vendorData!}
                    placeholder="Please select vendor name"
                    label="Vendor"
                />
                <TextInput
                    label="Vendor Price"
                    isRequired
                    name="vendorPrice"
                    placeholder="Please enter vendor price"
                    type="text"
                    allowTwoDecimalsOnly
                />

                <TextInput
                    label="Product Image URL 1"
                    name="productImage1"
                    placeholder="Please enter url"
                    type="text"
                />
                <TextInput
                    label="Product Image URL 2"
                    name="productImage2"
                    placeholder="Please enter url"
                    type="text"
                />
                <TextInput
                    label="Product Image URL 3"
                    name="productImage3"
                    placeholder="Please enter url"
                    type="text"
                />
            </Form>
        </CustomModalWithForm>
    );
};

export default BulkUploadEditModal;
