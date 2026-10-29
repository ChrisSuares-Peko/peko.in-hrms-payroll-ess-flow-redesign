import { useEffect, useState } from 'react';

import { Flex, Form, Steps, Typography } from 'antd';
import { useDispatch } from 'react-redux';

import CustomSelectSearch from '@components/atomic/inputs/CustomSelectSearch';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextAreaInput from '@components/atomic/inputs/TextAreaInput';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import GetProducts from '@src/domains/systemUser/ecom_manager/home/utils/GetProducts';
import { showToast } from '@src/slices/apiSlice';
import { formattedDateTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import useOrderVendors from '../hooks/useOrderVendors';
import { orderUpdateSchema } from '../schema';
import { OrderUpdatePayload } from '../types/types';
import { DeliveryOptions, getCurrentStep } from '../utils/data';

type DepartmentModalProps = {
    open: boolean;
    handleCancel: () => void;
    data?: any;
    handleRefresh: () => void;
};
type Product = {
    productId: string;
};

const OrderUpdateModal = ({ open, handleCancel, data, handleRefresh }: DepartmentModalProps) => {
    const orderData = JSON.parse(data.orderResponse);
    const productIds = orderData.products.map((product: Product) => product.productId);
    const [isCancellation, setIsCancellation] = useState<boolean>(false);

    const { vendorDetails, isLoading, updateOrderDetails } = useOrderVendors(productIds);
    const dispatch = useDispatch();

    const currentStep = getCurrentStep(data.ecomOrderStatus);
    const dynamicField: { [key: string]: string } = {};
    orderData?.products?.forEach((product: any) => {
        dynamicField[`product_${product.productId}`] = product.vendorId;
    });

    const handleCheckIsCancellation = (status: string) => {
        if (status === 'CANCELLED') setIsCancellation(true);
        if (status !== 'CANCELLED') setIsCancellation(false);
    };

    useEffect(() => {
        handleCheckIsCancellation(data.ecomOrderStatus);
    }, [data.ecomOrderStatus]);

    const resposeData = JSON.parse(data.orderResponse);

    return (
        <CustomModalWithForm
            modalTitle="Order Management"
            open={open}
            isLoading={isLoading}
            handleCancel={handleCancel}
            handleFormSubmit={async values => {
                const selectedVendor: { [productId: string]: string } = {};
                Object.entries(values).forEach(([fieldName, selectedVendorId]) => {
                    const productId = fieldName.split('_')[1];
                    if (productId) {
                        selectedVendor[productId] = selectedVendorId as string;
                    }
                });

                const OrderDetails: OrderUpdatePayload = {
                    id: values.id,
                    ecomOrderStatus: values.ecomOrderStatus,
                    // paymentStatus: values.paymentStatus,
                    selectedVendor,
                    trackingDetails: {
                        trackingNumber: values.trackingNumber,
                        deliveryPartner: values.deliveryPartner,
                        trackingWebsite: values.trackingWebsite,
                    },
                };

                if (isCancellation) {
                    OrderDetails.cancelReason = values.cancelReason;
                }

                const result = await updateOrderDetails(OrderDetails);

                if (result === true) {
                    handleRefresh();
                    dispatch(
                        showToast({
                            description: `Order updated successfully`,
                            variant: 'success',
                        })
                    );
                }
                if (result === false) {
                    handleRefresh();
                    dispatch(
                        showToast({
                            description: `Something went wrong ,please try again later`,
                            variant: 'error',
                        })
                    );
                }
                handleCancel();
            }}
            validationSchema={orderUpdateSchema(productIds)}
            initialValues={{
                id: data?.corporateTxnId || '',
                ecomOrderStatus: data.ecomOrderStatus || '',
                cancelReason: orderData?.cancelReason || '',
                deliveryPartner: orderData?.trackingDetails?.deliveryPartner || '',
                trackingNumber: orderData?.trackingDetails?.trackingNumber || '',
                trackingWebsite: orderData?.trackingDetails?.trackingWebsite || '',
                ...dynamicField,
            }}
        >
            <Flex vertical className="w-full ">
                <Flex vertical className="mb-3">
                    <Typography.Text className="pb-1 text-base font-medium">
                        Products :
                    </Typography.Text>
                    <GetProducts orderResponse={data.orderResponse} />
                </Flex>
                <Flex vertical className="mb-3">
                    <Typography.Text className="pb-1 text-base font-medium">
                        Customer Name :
                    </Typography.Text>
                    <Typography.Text>{resposeData.address.firstName}</Typography.Text>
                </Flex>
                <Flex vertical className="mb-3">
                    <Typography.Text className="pb-1 text-base font-medium">
                        Order Date :
                    </Typography.Text>
                    <Typography.Text>
                        {formattedDateTime(new Date(data.transactionDate))}
                    </Typography.Text>
                </Flex>
                <Flex vertical className="mb-3">
                    <Typography.Text className="pb-1 text-base font-medium">
                        Amount :
                    </Typography.Text>
                    <Typography.Text>
                        {formatNumberWithLocalString(data.amountInINR)}
                    </Typography.Text>
                </Flex>
                <Form layout="vertical">
                    {vendorDetails?.map((product: any) => (
                        <CustomSelectSearch
                            key={product.id}
                            name={`product_${product.id}`}
                            label={`${product.name}`}
                            placeholder="Select Product Vendor"
                            isRequired
                            loading={isLoading}
                            options={product.options}
                            classes="rounded-sm"
                            showSearch={false}
                        />
                    ))}
                    <SelectInput
                        name="ecomOrderStatus"
                        label="Delivery Status"
                        placeholder="Enter Delivery Status"
                        isRequired
                        options={DeliveryOptions.map(option => ({
                            value: option.oValue,
                            label: option.oName,
                        }))}
                        classes="rounded-sm"
                        showSearch={false}
                        handleChange={e => {
                            handleCheckIsCancellation(e);
                        }}
                    />
                    {isCancellation && (
                        <TextAreaInput
                            name="cancelReason"
                            label="Cancel Reason"
                            placeholder="Enter cancel reason"
                            isRequired
                            maxLength={400}
                        />
                    )}
                    {/* <CustomSelectSearch
                        name="paymentStatus"
                        label="Payment Status"
                        placeholder="Select Payment Status"
                        options={PaymentStatusOptions}
                        classes="rounded-sm"
                        showSearch={false}
                    /> */}
                    {data.ecomOrderStatus === 'SHIPPED' || data.ecomOrderStatus === 'COMPLETED' ? (
                        <>
                            <TextInput
                                name="deliveryPartner"
                                label="Delivery Partner"
                                type="text"
                                placeholder="Enter Delivery Partner"
                                classes=" rounded-sm"
                                maxLength={30}
                            />
                            <TextInput
                                name="trackingNumber"
                                label="Tracking Number"
                                type="text"
                                placeholder="Enter Tracking Number"
                                classes=" rounded-sm"
                                maxLength={25}
                                allowDecimalsOnly
                            />
                            <TextInput
                                name="trackingWebsite"
                                label="Tracking Website"
                                type="text"
                                placeholder="Enter Tracking Website"
                                classes="rounded-sm"
                                maxLength={30}
                            />
                        </>
                    ) : null}
                    {currentStep !== 0 ? (
                        <Steps
                            className="py-4"
                            size="small"
                            current={currentStep}
                            items={[
                                {
                                    title: 'Processing',
                                },
                                {
                                    title: 'In Transit',
                                },
                                {
                                    title: 'Delivered',
                                },
                            ]}
                        />
                    ) : null}
                </Form>
            </Flex>
        </CustomModalWithForm>
    );
};

export default OrderUpdateModal;
