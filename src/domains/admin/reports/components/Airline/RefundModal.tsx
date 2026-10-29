import { Divider, Flex, Form, Typography } from 'antd';
import * as Yup from 'yup';

import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
// import { CancelationCharge } from '@src/domains/dashboard/Airline/types/manageBookings';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { Booking } from '../../types/airline';

type RefundModalModalProps = {
    open: boolean;
    handleCancel: () => void;
    handleRefresh: () => void;
    refundAmount: (payload: any) => Promise<boolean>;
    data: Booking;
    // cancelationCharges?: CancelationCharge;
    loading: boolean;
};

const RefundModal = ({
    open,
    data,
    // cancelationCharges,
    loading,
    refundAmount,
    handleCancel,
    handleRefresh,
}: RefundModalModalProps) => {
    const dispatch = useAppDispatch();
    const totalFare = data?.order?.amountInINR || 0;
    const initialBooking = totalFare;

    return (
        <CustomModalWithForm
            modalTitle="Airline Refund"
            open={open}
            isLoading={loading}
            handleCancel={handleCancel}
            handleFormSubmit={async values => {
                const result = await refundAmount({
                    amount: parseFloat(values.amount),
                    BookingId: data?.BookingId,
                    corporateTxnId: data?.corporateTxnId,
                });
                if (result) {
                    dispatch(
                        showToast({
                            description: 'Amount refunded successfully',
                            variant: 'success',
                        })
                    );
                    handleCancel();
                    handleRefresh();
                }
            }}
            initialValues={{
                amount: data?.refundedAmount || '',
            }}
            validationSchema={Yup.object().shape({
                amount: Yup.number()
                    .typeError('Amount must be a number')
                    .max(totalFare, `Refund amount cannot exceed total fare ₹ ${totalFare}`)
                    .test(
                        'is-decimal',
                        'Amount must be a valid number with up to 2 decimal places',
                        value => /^\d+(\.\d{1,2})?$/.test(value?.toString() || '')
                    )
                    .required('Refund amount is required'),
            })}
        >
            <Flex vertical className="w-full ">
                <Typography.Text>
                    Initial booking : ₹ {formatNumberWithLocalString(initialBooking)}
                </Typography.Text>
                {/* {modifiedPrices.map((price, index) => (
                    <Typography.Text key={index}>
                        Modification payments : ₹ {formatNumberWithLocalString(price)}
                    </Typography.Text>
                ))} */}
                <Divider />
                <Typography.Text>
                    Total Amount Paid : ₹ {formatNumberWithLocalString(totalFare)}
                </Typography.Text>
                <Form layout="vertical" className="mt-10">
                    <TextInput
                        name="amount"
                        label="Refund Amount"
                        type="text"
                        placeholder="Enter Refund Amount"
                        classes="rounded-sm"
                        allowTwoDecimalsOnly
                        maxLength={10}
                    />
                </Form>
            </Flex>
        </CustomModalWithForm>
    );
};

export default RefundModal;
