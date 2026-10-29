import React, { useState } from 'react';

import { Alert, Button, Divider, Flex, Modal, Spin, Typography, theme } from 'antd';
import { Content } from 'antd/es/layout/layout';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import OtpModal from '@components/molecular/modals/OtpModal';
import { Scope } from '@src/enums/enums';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import ChargeRow from './ChargeRow';
import { getotp } from '../../../Api';
import useBookingCancelApi from '../../../hooks/useBookingCancelApi';
import { getTxnId } from '../../../slices/getHotelSlice';
import { CancellationData } from '../../../types/cancellationTypes';

dayjs.extend(customParseFormat);

interface ModalProps {
    orderId?: number;
    isModalOpen: boolean;
    handleCancel: () => void;
    charges: CancellationData[];
    baseAmt: number;
    refetch?: any;
    isLoading?: boolean;
    txnId: string;
}

const CancelBooking = ({
    orderId,
    isModalOpen,
    handleCancel,
    charges,
    baseAmt,
    refetch,
    isLoading,
    txnId,
}: ModalProps) => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const [isOpen, setIsOpen] = useState(false);
    const [isOtpSending, setIsOtpSending] = useState(false);
    const dispatch = useAppDispatch();

    const {
        token: { colorPrimary },
    } = theme.useToken();

    const today = new Date();

    // Find today's applicable charges
    // Find today's applicable charges using range logic
   
    const todayCharges = charges
        .map(charge => ({
            ...charge,
            fromDateOnly: new Date(charge?.FromDate?.split(' ')[0].split('-').reverse().join('-')), // Convert DD-MM-YYYY to Date
        }))
        .filter(charge => charge?.fromDateOnly <= today) // Only include dates on or before today
        .sort((a, b) => b.fromDateOnly.getTime() - a.fromDateOnly.getTime())[0]; // Get the latest applicable one

    // Calculate cancellation charges based on ChargeType
    let cancellationCharge = 0;
    if (todayCharges) {
        if (todayCharges.ChargeType === 'Fixed') {
            cancellationCharge = todayCharges.CancellationCharge;
        } else {
            cancellationCharge = (todayCharges.CancellationCharge / 100) * baseAmt; // Percentage calculation
        }
    }

    // Calculate refund amount and ensure it's not less than 0
    const refundAmount = Math.max(0, baseAmt - cancellationCharge);

    const { cancelBooked, loader } = useBookingCancelApi();

    const handleCancelBooked = async () => {
        setIsOtpSending(true);
        dispatch(getTxnId(txnId));
        const resp = await getotp({
            userId: id,
            userType: role,
            scope: Scope.EMAIL,
        });
        if (resp) {
            setIsOtpSending(false);
            setIsOpen(true);
        } else {
            setIsOtpSending(false);
        }
    };

    return (
        <>
            <Modal
                title="Confirm Cancellation"
                open={isModalOpen}
                onCancel={handleCancel}
                footer={null}
            >
                <Divider />
                <Spin className="w-full" spinning={isLoading}>
                    <Content className="sm:px-4">
                        <Alert
                            className="mt-5"
                            message="Are you sure you want to cancel this booking?"
                            type="error"
                            showIcon
                        />
                        <Flex justify="space-between" className="mt-5 sm:px-3">
                            <Typography.Text className="font-medium sm:text-lg">
                                Cancellation Charges
                            </Typography.Text>
                        </Flex>
                        <ChargeRow label="Total Amount you paid" amount={baseAmt || 0} />
                        {[...charges]
                            .sort(
                                (a, b) =>
                                    dayjs(a.FromDate, 'DD-MM-YYYY HH:mm:ss').valueOf() -
                                    dayjs(b.FromDate, 'DD-MM-YYYY HH:mm:ss').valueOf()
                            )
                            .map((charge, index, sortedCharges) => {
                                const DISPLAY_FORMAT = 'DD MMM YYYY';
                                const startDate = dayjs(charge.FromDate, 'DD-MM-YYYY HH:mm:ss');
                                const nextCharge = sortedCharges[index + 1];
                                const endDate = nextCharge
                                    ? dayjs(nextCharge.FromDate, 'DD-MM-YYYY HH:mm:ss').subtract(
                                          1,
                                          'day'
                                      )
                                    : null;

                                const label = endDate
                                    ? `Cancel between ${startDate.format(DISPLAY_FORMAT)} - ${endDate.format(DISPLAY_FORMAT)}`
                                    : `Cancel from ${startDate.format(DISPLAY_FORMAT)} onwards`;

                                const amount =
                                    charge.ChargeType === 'Fixed'
                                        ? charge.CancellationCharge
                                        : (charge.CancellationCharge / 100) * baseAmt;

                                const valueText =
                                    charge.ChargeType === 'Fixed' && charge.CancellationCharge === 0
                                        ? 'Free'
                                        : undefined;

                                return (
                                    <ChargeRow
                                        key={index}
                                        label={label}
                                        amount={amount}
                                        valueText={valueText}
                                    />
                                );
                            })}

                        <Divider />
                        <Flex justify="space-between" className="mt-5 sm:px-3">
                            <Typography.Text className="font-medium sm:text-lg">
                                Amount to be refunded
                            </Typography.Text>
                            <Typography.Text data-testid="amount" className="text-lg font-medium">
                                ₹ {formatNumberWithLocalString(refundAmount)}
                            </Typography.Text>
                        </Flex>

                        <Alert
                            className="my-5"
                            message="Note: Your money will be credited within 7-10 business days"
                            type="warning"
                            showIcon
                        />
                        <Flex justify="end">
                            <Button
                                size="middle"
                                className="px-5 mt-3 rounded-md w-36"
                                onClick={handleCancelBooked}
                                style={{ backgroundColor: colorPrimary, color: 'white' }}
                                loading={isOtpSending}
                            >
                                Cancel Booking
                            </Button>
                        </Flex>
                    </Content>
                </Spin>
            </Modal>
            <OtpModal
                isOpen={isOpen}
                isLoading={loader!}
                handleCancel={() => setIsOpen(false)}
                isOtpSending={isOtpSending}
                onResend={async () => {
                    setIsOtpSending(true);
                    await getotp({
                        userId: id,
                        userType: role,
                        scope: Scope.EMAIL,
                    });
                    setIsOtpSending(false);
                }}
                handleSubmit={async otp => {
                    const scope = Scope.EMAIL;

                    if (orderId !== undefined) {
                        const result = await cancelBooked(orderId, otp, scope);
                        if (result) {
                            setIsOpen(false);

                            handleCancel();
                            refetch();
                        }
                    } else {
                        console.error('Order ID is undefined');
                    }
                }}
                title="Confirmation"
            />
        </>
    );
};

export default CancelBooking;
