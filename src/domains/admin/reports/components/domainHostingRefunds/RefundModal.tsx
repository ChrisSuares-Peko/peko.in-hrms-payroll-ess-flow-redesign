import { Divider, Flex, Form, Typography } from 'antd';
import * as Yup from 'yup';

import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { DomainHostingRefund } from '../../types/domainHostingRefunds';

type RefundModalProps = {
    open: boolean;
    data: DomainHostingRefund;
    loading: boolean;
    handleCancel: () => void;
    handleRefresh: () => void;
    refundOrder: (payload: { corporateTxnId: string; refundAmount: number; remarks: string }) => Promise<boolean>;
};

const RefundModal = ({ open, data, loading, handleCancel, handleRefresh, refundOrder }: RefundModalProps) => {
    const dispatch = useAppDispatch();
    const totalAmount = parseFloat(data?.amountInINR) || 0;

    return (
        <CustomModalWithForm
            modalTitle="Domain & Hosting Refund"
            open={open}
            isLoading={loading}
            handleCancel={handleCancel}
            handleFormSubmit={async values => {
                const result = await refundOrder({
                    corporateTxnId: data.corporateTxnId,
                    refundAmount: parseFloat(values.refundAmount),
                    remarks: values.remarks,
                });
                if (result) {
                    dispatch(showToast({ description: 'Processed successfully', variant: 'success' }));
                    handleCancel();
                    handleRefresh();
                }
            }}
            initialValues={{ refundAmount: '', remarks: '' }}
            validationSchema={Yup.object().shape({
                refundAmount: Yup.number()
                    .typeError('Amount must be a number')
                    .min(0, 'Refund amount must be 0 or greater')
                    .max(
                        totalAmount,
                        `Refund amount cannot exceed ₹${formatNumberWithLocalString(totalAmount)}`
                    )
                    .test(
                        'is-decimal',
                        'Amount must be a valid number with up to 2 decimal places',
                        value => /^\d+(\.\d{1,2})?$/.test(value?.toString() || '')
                    )
                    .required('Refund amount is required'),
                remarks: Yup.string().trim().required('Remarks are required'),
            })}
        >
            <Flex vertical className="w-full" gap={10}>
                <Typography.Text>
                    Total Amount Paid: ₹ {formatNumberWithLocalString(totalAmount)} ({data?.paymentMode})
                </Typography.Text>
                <Typography.Text type="secondary">
                    Enter 0 to approve cancellation without refund.
                </Typography.Text>
                <Divider />
                <Form>
                    <TextInput
                        name="refundAmount"
                        label="Refund Amount (₹)"
                        type="text"
                        placeholder="Enter refund amount (0 for no refund)"
                        allowTwoDecimalsOnly
                        maxLength={10}
                    />
                    <TextInput
                        name="remarks"
                        label="Remarks"
                        type="text"
                        placeholder="Enter remarks"
                        maxLength={255}
                    />
                </Form>
            </Flex>
        </CustomModalWithForm>
    );
};

export default RefundModal;
