import { useState } from 'react';

import { Flex, Form, Typography } from 'antd';
import dayjs from 'dayjs';

import CustomSelectSearch from '@components/atomic/inputs/CustomSelectSearch';
import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import OtpModal from '@components/molecular/modals/OtpModal';
import { Scope } from '@src/enums/enums';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';
import { formattedDateTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';
import formatString from '@utils/wordFormat';

import { getOtpEcommerce } from '../api/order';
import useReturnRequestUpdate from '../hooks/useReturnRequestUpdate';
import { returnOrderSchema } from '../schema/returnOrderSchema';
import { UpdateOrderRequestPayload } from '../types/types';
import { allowedReturnStatus, ReturnStatusOptions } from '../utils/data';

type DepartmentModalProps = {
    open: boolean;
    handleCancel: () => void;
    data?: any;
    handleRefresh: () => void;
    product?: any;
};

const ReturnModal = ({
    open,
    handleCancel,
    data,
    handleRefresh,
    product,
}: DepartmentModalProps) => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const [formValues, setFormValues] = useState<UpdateOrderRequestPayload>();
    const [isOpen, setIsOpen] = useState(false);
    const [isOtpSending, setIsOtpSending] = useState(false);
    const [resetOtp, setResetOtp] = useState(false);
    const dispatch = useAppDispatch();
    const today = dayjs();
    const { isLoading, handleUpdateOrder } = useReturnRequestUpdate({
        handleCancel,
        handleOtpClose: () => setIsOpen(false),
        handleResetOtp: () => setResetOtp(!resetOtp),
    });
    return (
        <>
            <CustomModalWithForm
                modalTitle="Order Return Management"
                open={open}
                isLoading={isLoading}
                handleCancel={handleCancel}
                handleFormSubmit={async values => {
                    setFormValues(values);
                    if (!allowedReturnStatus.includes(values?.returnStatus)) {
                        dispatch(
                            showToast({
                                variant: 'error',
                                description:
                                    "Return status must be 'Return Rejected' or 'Return Completed' or 'Return Intiated'.",
                            })
                        );
                        return;
                    }
                    const resp = await getOtpEcommerce({
                        userId: id,
                        userType: role,
                    });
                    if (resp) {
                        setIsOpen(true);
                    }
                }}
                initialValues={{
                    corporateTxnId: data?.corporateTxnId || '',
                    paymentStatus: data.status || '',
                    returnStatus: product?.status || '',
                    returnPickUpDate: product?.returnPickUpDate || '',
                }}
                validationSchema={returnOrderSchema}
            >
                {({ values }) => (
                    <Flex vertical className="w-full ">
                        <Flex vertical className="mb-3">
                            <Typography.Text className="pb-1 text-base font-medium">
                                Product :
                            </Typography.Text>
                            <Typography.Text>{product.productName}</Typography.Text>
                        </Flex>
                        <Flex vertical className="mb-3">
                            <Typography.Text className="pb-1 text-base font-medium">
                                Customer Name :
                            </Typography.Text>
                            <Typography.Text>{data.credential.name}</Typography.Text>
                        </Flex>
                        <Flex vertical className="mb-3">
                            <Typography.Text className="pb-1 text-base font-medium">
                                Order Date :
                            </Typography.Text>
                            <Typography.Text>
                                {formattedDateTime(new Date(data?.transactionDate))}
                            </Typography.Text>
                        </Flex>
                        <Flex vertical className="mb-3">
                            <Typography.Text className="pb-1 text-base font-medium">
                                Amount :
                            </Typography.Text>
                            <Typography.Text>
                                ₹ {formatNumberWithLocalString(product?.totalPrice)}
                            </Typography.Text>
                        </Flex>
                        <Flex vertical className="mb-3">
                            <Typography.Text className="pb-1 text-base font-medium">
                                Payment Method :
                            </Typography.Text>
                            <Typography.Text>{formatString(data?.paymentMode)}</Typography.Text>
                        </Flex>
                        <Flex vertical className="mb-3">
                            <Typography.Text className="pb-1 text-base font-medium">
                                Reason for Cancellation :
                            </Typography.Text>
                            <Typography.Text>{product?.reason}</Typography.Text>
                        </Flex>
                        <Flex vertical className="mb-3">
                            <Typography.Text className="pb-1 text-base font-medium">
                                Cancellation Details :
                            </Typography.Text>
                            <Typography.Text>{product?.description}</Typography.Text>
                        </Flex>
                        <Flex vertical className="mb-3">
                            <Typography.Text className="pb-1 text-base font-medium">
                                Delivery Status :
                            </Typography.Text>
                            <Typography.Text>{formatString(data.ecomOrderStatus)}</Typography.Text>
                        </Flex>
                        <Form layout="vertical">
                            <CustomSelectSearch
                                name="returnStatus"
                                label="Return Status"
                                placeholder="Select Return Status"
                                isRequired
                                options={ReturnStatusOptions}
                                classes="rounded-sm"
                                showSearch={false}
                                allowClear={false}
                                isDisabled={product?.status === 'Return Rejected'}
                            />
                            {/* <CustomSelectSearch
                                name="paymentStatus"
                                label="Refund Status"
                                placeholder="Select Refund Status"
                                isRequired
                                options={PaymentStatusOptions}
                                classes="rounded-sm"
                                showSearch={false}
                                isDisabled={
                                    data.status === 'REFUNDED' || product?.status === 'Return Rejected'
                                }
                            /> */}
                            <DatePickerInput
                                isRequired={values.returnStatus === 'Return Initiated'}
                                name="returnPickUpDate"
                                placeholder="Select Date"
                                label="Return Date"
                                classes="w-full"
                                needConfirm={false}
                                minDate={today}
                                isDisabled={product?.status === 'Return Rejected'}
                            />
                        </Form>
                    </Flex>
                )}
            </CustomModalWithForm>
            <OtpModal
                isOpen={isOpen}
                isLoading={isLoading!}
                handleCancel={() => setIsOpen(false)}
                isOtpSending={isOtpSending}
                onResend={async () => {
                    setIsOtpSending(true);
                    const res = await getOtpEcommerce({
                        userId: id,
                        userType: role,
                    });
                    if (res) setIsOtpSending(false);
                    else setIsOtpSending(false);
                }}
                handleSubmit={otp => {
                    handleUpdateOrder({
                        ...formValues!,
                        otp,
                        productId: product.productId,
                        scope: Scope.EMAIL,
                        userId: id,
                        userType: role,
                    }).then(res => {
                        if (res) {
                            setIsOpen(false);
                            setResetOtp(!resetOtp);
                            handleRefresh();
                        }
                    });
                }}
                title="Confirmation"
                resetOtp={resetOtp}
            />
        </>
    );
};

export default ReturnModal;
