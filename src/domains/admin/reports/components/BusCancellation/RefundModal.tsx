import { Divider, Flex, Form, Typography } from 'antd';
import * as Yup from 'yup';

import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';
import { formatNumberWithLocalString } from '@utils/priceFormat';
import { toTitleCase } from '@utils/wordFormat';

import { calculateBusRefundAmount } from './busCancellationUtils';

type RefundModalProps = {
    open: boolean;
    handleCancel: () => void;
    handleRefresh: () => void;
    refundAmount: (payload: { corporateTxnId: string; refundAmount: number }) => Promise<boolean>;
    data: any;
    loading: boolean;
};

const RefundModal = ({
    open,
    data,
    loading,
    refundAmount,
    handleCancel,
    handleRefresh,
}: RefundModalProps) => {
    const dispatch = useAppDispatch();

    const amountInINR = data?.order?.amountInINR;
    const paymentMode = data?.order?.paymentMode;
    const bookingAmount = Number(amountInINR) || 0;

    const calculatedRefund = calculateBusRefundAmount(
        amountInINR,
        data?.cancellationPolicy,
        data?.tripDetails?.doj,
        data?.tripDetails?.pickUpTime
    );

    return (
        <CustomModalWithForm
            modalTitle="Bus Refund"
            open={open}
            isLoading={loading}
            handleCancel={handleCancel}
            handleFormSubmit={async (values) => {
                const result = await refundAmount({
                    refundAmount: parseFloat(values.refundAmount),
                    corporateTxnId: data?.order?.corporateTxnId,
                });
                if (result) {
                    dispatch(showToast({ description: 'Amount refunded successfully', variant: 'success' }));
                    handleCancel();
                    handleRefresh();
                }
            }}
            initialValues={{ refundAmount: calculatedRefund > 0 ? String(calculatedRefund) : '' }}
            validationSchema={Yup.object().shape({
                refundAmount: Yup.number()
                    .typeError('Amount must be a number')
                    .moreThan(0, 'Refund amount must be greater than 0')
                    .max(
                        bookingAmount,
                        `Refund amount cannot exceed total amount paid ₹${formatNumberWithLocalString(bookingAmount)}`
                    )
                    .test(
                        'is-decimal',
                        'Amount must be a valid number with up to 2 decimal places',
                        (value) => /^\d+(\.\d{1,2})?$/.test(value?.toString() || '')
                    )
                    .required('Refund amount is required'),
            })}
        >
            <Flex vertical className="w-full" gap={10}>
                <Typography.Text>
                    Total Amount Paid : ₹ {formatNumberWithLocalString(bookingAmount)} ({toTitleCase(paymentMode || '')})
                </Typography.Text>
                {calculatedRefund > 0 && (
                    <Typography.Text type="secondary">
                        Calculated Refund : ₹ {formatNumberWithLocalString(calculatedRefund)}
                    </Typography.Text>
                )}
                <Divider />
                <Form>
                    <TextInput
                        name="refundAmount"
                        label="Refund Amount : ₹"
                        type="text"
                        placeholder="Enter Refund Amount"
                        allowTwoDecimalsOnly
                        maxLength={10}
                    />
                </Form>
            </Flex>
        </CustomModalWithForm>
    );
};

export default RefundModal;
