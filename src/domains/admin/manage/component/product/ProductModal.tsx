import { useState } from 'react';

import { Form, Skeleton } from 'antd';

import CustomFileUploadInput from '@components/atomic/inputs/CustomFileUploadInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextAreaInput from '@components/atomic/inputs/TextAreaInput';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { DropDown } from '@customtypes/general';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import AddVendorDetails from './AddVendorDetails';
import ProductSchema from '../../schema/ProductSchema';
import {
    NewProduct,
    Product,
    Vendor,
    modalImage,
    refresh,
    vendorDetails,
} from '../../types/products';

type DepartmentModalProps = {
    open: boolean;
    handleCancel: () => void;
    data?: Product;
    categoryData: DropDown | undefined;
    vendorData: DropDown | undefined;
    allVendors: Vendor[] | undefined;
    updateProducts: (val: NewProduct) => Promise<boolean>;
    createProducts: (val: NewProduct) => Promise<boolean>;
    productImages?: modalImage;
};

const ProductModal = ({
    open,
    handleCancel,
    data,
    categoryData,
    vendorData,
    createProducts,
    updateProducts,
    allVendors,
    setRefresh,
    productImages,
}: DepartmentModalProps & refresh) => {
    const [, setFile] = useState<any>('');

    const dispatch = useAppDispatch();
    function applyPrice(
        originalPrice: string | number,
        vatValue: string,
        discountValue: string | number,
        discountType: string,
        gstType: string
    ) {
        if (discountType === 'PERCENTAGE' && gstType === 'PERCENTAGE') {
            const discountAmount = (Number(originalPrice) * Number(discountValue)) / 100;
            const vatAmount = (Number(originalPrice) * Number(vatValue)) / 100;
            return Number(originalPrice) + vatAmount - discountAmount;
        }
        if (discountType === 'FLAT' && gstType === 'CUSTOM') {
            return Number(originalPrice) + Number(vatValue) - Number(discountValue);
        }
        if (discountType === 'FLAT' && gstType === 'PERCENTAGE') {
            const vatAmount = (Number(originalPrice) * Number(vatValue)) / 100;
            return Number(originalPrice) + vatAmount - Number(discountValue);
        }
        if (gstType === 'CUSTOM' && discountType === 'PERCENTAGE') {
            const discountAmount = (Number(originalPrice) * Number(discountValue)) / 100;
            return Number(originalPrice) + Number(vatValue) - discountAmount;
        }
        return Number(originalPrice);
    }
    function applyVat(originalPrice: string | number, vatValue: string, gstType: string) {
        if (gstType === 'PERCENTAGE') {
            const vatAmount = (Number(originalPrice) * Number(vatValue)) / 100;
            return Number(originalPrice) + vatAmount;
        }
        if (gstType === 'CUSTOM') {
            return Number(originalPrice) + Number(vatValue);
        }
        return Number(originalPrice);
    }

    return (
        <CustomModalWithForm
            reinitialise
            modalTitle="Product Management"
            open={open}
            validationSchema={ProductSchema}
            handleCancel={handleCancel}
            handleFormSubmit={async values => {
                let res: boolean;
                if (!data) {
                    res = await createProducts({
                        ...values,
                        productImageFormat1: values.format1,
                        productImageFormat2: values.format2,
                        productImageFormat3: values.format3,
                        price: applyPrice(
                            values.priceExcludedVat,
                            values.GST,
                            values.discount,
                            values.discountType,
                            values.gstType
                        ),
                        actualPrice: applyVat(values.priceExcludedVat, values.GST, values.gstType),
                        vendors: values.vendors.map((item: vendorDetails) => ({
                            ...item,

                            name: allVendors!.find(
                                vendor => vendor.id.toString() === item.id.toString()
                            )!.vendorName,
                        })),
                    });
                } else {
                    res = await updateProducts({
                        ...values,
                        productImageFormat1: values.format1,
                        productImageFormat2: values.format2,
                        productImageFormat3: values.format3,
                        price: applyPrice(
                            values.priceExcludedVat,
                            values.GST,
                            values.discount,
                            values.discountType,
                            values.gstType
                        ),
                        actualPrice: applyVat(values.priceExcludedVat, values.GST, values.gstType),
                        vendors: values.vendors.map((item: vendorDetails) => ({
                            ...item,

                            name: allVendors!.find(
                                vendor => vendor.id.toString() === item.id.toString()
                            )!.vendorName,
                        })),
                    });
                }

                if (res === true) {
                    setRefresh(true);
                    if (data)
                        dispatch(
                            showToast({
                                description: `Product updated successfully`,
                                variant: 'success',
                            })
                        );
                    else
                        dispatch(
                            showToast({
                                description: `Product added successfully`,
                                variant: 'success',
                            })
                        );
                }
                if (res === false) {
                    dispatch(
                        showToast({
                            description: `Something went wrong ,please try again later`,
                            variant: 'error',
                        })
                    );
                }
                handleCancel();
            }}
            initialValues={{
                id: data?.id || '',
                name: data?.name || '',
                brand: data?.brand || '',
                description: data?.description || '',
                highlights: data?.highlights || '',
                warranty: data?.warranty || '',
                SKUCode: data?.SKUCode || '',
                categoryId: data?.categoryId.toString() || '',
                priceExcludedVat: data?.price || '',
                quantity: data?.quantity || '',
                discountType: data?.discountType || '',
                discount: data?.discount || '',
                gstType: data?.gstType || '',
                productImage1: data?.productImage || '',
                productImage2: '',
                productImage3: '',
                GST: data?.GST || '',
                productImageFormat1: productImages?.productImage1,
                productImageFormat2: productImages?.productImage2,
                productImageFormat3: productImages?.productImage3,
                vendors: data?.vendors || [
                    {
                        id: '',
                        price: '',
                        name: '',
                    },
                ],
            }}
        >
            {({ handleSubmit, values }) => (
                <Form layout="vertical">
                    <TextInput
                        name="name"
                        label="Name"
                        type="text"
                        placeholder="Please enter name "
                        isRequired
                        classes=" rounded-sm"
                        allowAlphabetsAndSpaceOnly
                    />
                    <TextInput
                        name="brand"
                        label="Brand"
                        type="text"
                        placeholder="Please enter brand "
                        isRequired
                        classes=" rounded-sm"
                    />
                    <TextAreaInput
                        name="description"
                        label="Description"
                        placeholder="please enter description"
                        isRequired
                    />
                    <TextAreaInput
                        name="highlights"
                        label="Highlights"
                        placeholder="please enter highlights"
                        isRequired
                    />
                    <TextAreaInput
                        name="warranty"
                        label="Warranty"
                        placeholder="please enter warranty"
                    />
                    <TextInput
                        name="SKUCode"
                        label="SKU Code"
                        type="text"
                        placeholder="Please enter SKU Code "
                        classes=" rounded-sm"
                    />
                    {categoryData ? (
                        <SelectInput
                            isRequired
                            name="categoryId"
                            options={categoryData}
                            placeholder="please select a category"
                            label="Select Category"
                        />
                    ) : (
                        <Skeleton.Input active block />
                    )}
                    <TextInput
                        allowNumbersOnly
                        name="priceExcludedVat"
                        label="Price (Excluded VAT)"
                        type="text"
                        placeholder="Please enter amount "
                        isRequired
                        classes=" rounded-sm"
                    />
                    <TextInput
                        allowNumbersOnly
                        name="quantity"
                        label="Quantity"
                        type="text"
                        placeholder="Please enter quantity "
                        isRequired
                        classes=" rounded-sm"
                    />
                    <SelectInput
                        name="discountType"
                        isRequired
                        options={[
                            { value: 'PERCENTAGE', label: 'Percentage' },
                            { value: 'FLAT', label: 'Flat' },
                        ]}
                        placeholder="please select a discount type"
                        label="Discount type"
                    />
                    <TextInput
                        allowNumbersOnly
                        name="discount"
                        label="Discount"
                        type="text"
                        placeholder="Please enter discount  "
                        isRequired
                        classes=" rounded-sm"
                    />
                    <SelectInput
                        name="gstType"
                        isRequired
                        options={[
                            { value: 'PERCENTAGE', label: 'Percentage' },
                            { value: 'CUSTOM', label: 'Flat' },
                        ]}
                        placeholder="please select a gst type"
                        label="GST type"
                    />
                    <TextInput
                        allowNumbersOnly
                        name="GST"
                        label="GST "
                        type="text"
                        placeholder="Please enter gst "
                        isRequired
                    />
                    <AddVendorDetails values={values.vendors} vendorData={vendorData} />
                    <CustomFileUploadInput
                        existingFileUrl={productImages?.productImage1}
                        label="Product Image 1"
                        name="productImage1"
                        setFile={setFile}
                        format="format1"
                        showNotification
                        showFileName
                    />

                    <CustomFileUploadInput
                        existingFileUrl={productImages?.productImage2}
                        label="Product Image 2"
                        name="productImage2"
                        setFile={setFile}
                        format="format2"
                        showNotification
                        showFileName
                    />

                    <CustomFileUploadInput
                        existingFileUrl={productImages?.productImage3}
                        label="Product Image 3"
                        name="productImage3"
                        setFile={setFile}
                        format="format3"
                        showNotification
                        showFileName
                    />
                </Form>
            )}
        </CustomModalWithForm>
    );
};

export default ProductModal;
