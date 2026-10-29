import { useEffect, useState } from 'react';

import { ClockCircleOutlined } from '@ant-design/icons';
import { Button, Col, Drawer, Flex, Row, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { setPaymentData } from '@src/domains/dashboard/payments/slices/payment';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { getSurcharge } from '@src/services/surcharge';
import { accessKeys } from '@utils/accessKeys';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import BusSessionExpiredModal from '../components/BusSessionExpiredModal';
import BusSummaryCard from '../components/reviewBooking/BusSummaryCard';
import PassengerDetailsSection from '../components/reviewBooking/PassengerDetailsSection';
import useBusPaymentTimer from '../hooks/useBusPaymentTimer';

export default function ReviewBooking() {
    const dispatch   = useAppDispatch();
    const navigate   = useNavigate();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const tripInfo   = useAppSelector(state => state.reducer.busTicket.selectedTripInfo);
    const passengers = useAppSelector(state => state.reducer.busTicket.passengers);
    const seatData   = useAppSelector(state => state.reducer.busTicket.selectedSeatData);
    const blockKey      = useAppSelector(state => state.reducer.busTicket.blockKey);
    const contactEmail  = useAppSelector(state => state.reducer.busTicket.contactEmail);
    const contactPhone  = useAppSelector(state => state.reducer.busTicket.contactPhone);

    const [isLoading, setIsLoading] = useState(false);
    const [policyDrawerOpen, setPolicyDrawerOpen] = useState(false);
    const { timeRemaining, showExpiredModal, formatTime, handleGoBack } = useBusPaymentTimer(true);

    const amount = seatData.reduce((sum, s) => sum + s.fare, 0);

    useEffect(() => {
        if (seatData.length === 0) navigate(-1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleProceed = async () => {
        setIsLoading(true);
        const surchargeData = await getSurcharge({
            userId: id,
            userType: role,
            amount,
            accessKey: accessKeys.busTickets,
        });
        setIsLoading(false);

        const platformFee = surchargeData ? parseFloat(String(surchargeData.surcharge ?? 0)) : 0;
        const totalAmount = amount + platformFee;

        dispatch(setPaymentData({
            title: 'Bill Summary',
            billSummary: [
                { key: 'Service', value: 'Bus Ticket' },
                { key: 'Operator', value: tripInfo?.operator ?? '' },
                { key: 'Route', value: `${tripInfo?.from ?? ''} → ${tripInfo?.to ?? ''}` },
                { key: 'Date', value: tripInfo?.departDate ?? '' },
            ],
            paymentSummary: [
                { key: 'Base amount', value: `₹ ${formatNumberWithLocalString(amount)}` },
                { key: 'Platform fee (inclusive of GST)', value: `₹ ${formatNumberWithLocalString(platformFee)}` },
            ],
            totalAmount,
            url: 'travel/bus/book',
            payload: {
                blockKey,
                amount,
                accessKey: accessKeys.busTickets,
                couponCode: '',
                couponAmount: 0,
                pgAmount: totalAmount,
                contactEmail,
                contactPhone,
            },
        }));

        navigate(paths.dashboard.payments);
    };

    return (
        <>
        <BusSessionExpiredModal open={showExpiredModal} onGoBack={handleGoBack} />
        <Flex vertical gap={20} style={{ padding: '0 0 40px' }}>

            <Typography.Text style={{ fontSize: 24, fontWeight: 500, color: '#000' }}>
                Review Booking
            </Typography.Text>

            <Row gutter={[20, 20]} align="top">

                {/* Left: trip card + passenger details */}
                <Col xs={24} lg={16}>
                    <Flex vertical gap={16}>
                        <BusSummaryCard
                            operator={tripInfo?.operator ?? ''}
                            busType={tripInfo?.busType ?? ''}
                            departTime={tripInfo?.departTime}
                            departDate={tripInfo?.departDate}
                            departStop={tripInfo?.from}
                            arrivalTime={tripInfo?.arrivalTime}
                            arrivalDate={tripInfo?.arrivalDate}
                            arrivalStop={tripInfo?.to}
                            duration={tripInfo?.duration}
                            rating={tripInfo?.rating}
                            ratingCount={tripInfo?.ratingCount}
                        />
                        <PassengerDetailsSection passengers={passengers} />
                    </Flex>
                </Col>

                {/* Right: timer + fare summary + actions */}
                <Col xs={24} lg={8}>
                    <Flex vertical gap={16}>

                        {/* Timer */}
                        <Flex
                            gap={9}
                            align="center"
                            style={{ background: '#F4F4F4', borderRadius: 15, padding: '12px 16px' }}
                        >
                            <ClockCircleOutlined style={{ fontSize: 20, color: '#000' }} />
                            <Typography.Text style={{ fontSize: 14, color: '#727272' }}>
                                Complete payment in
                            </Typography.Text>
                            <Typography.Text style={{ fontSize: 20, fontWeight: 600, color: '#000' }}>
                                {formatTime(timeRemaining)}
                            </Typography.Text>
                        </Flex>

                        {/* Fare summary */}
                        <Flex
                            vertical
                            style={{
                                background: 'white',
                                borderRadius: 16,
                                border: '1px solid #f0f0f0',
                                overflow: 'hidden',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            }}
                        >
                            <Flex vertical gap={4} style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
                                <Typography.Text style={{ fontSize: 12, color: '#8c8c8c' }}>Total fare</Typography.Text>
                                <Typography.Text style={{ fontSize: 28, fontWeight: 700, color: '#101010' }}>
                                    ₹ {formatNumberWithLocalString(amount)}
                                </Typography.Text>
                            </Flex>
                            <Flex vertical gap={10} style={{ padding: '16px 20px' }}>
                                <Flex justify="space-between">
                                    <Typography.Text style={{ fontSize: 13, fontWeight: 600, color: '#101010' }}>Subtotal</Typography.Text>
                                    <Typography.Text style={{ fontSize: 13, fontWeight: 600, color: '#101010' }}>
                                        ₹ {formatNumberWithLocalString(amount)}
                                    </Typography.Text>
                                </Flex>
                            </Flex>
                        </Flex>

                        {/* Actions */}
                        <Button
                            type="primary"
                            danger
                            loading={isLoading}
                            onClick={handleProceed}
                            style={{ height: 46, fontSize: 16, fontWeight: 600, borderRadius: 6 }}
                        >
                            Continue
                        </Button>
                        <Button
                            danger
                            style={{ height: 46, fontSize: 14, fontWeight: 500, borderRadius: 6 }}
                            onClick={() => setPolicyDrawerOpen(true)}
                        >
                            View cancellation &amp; refund policy
                        </Button>

                    </Flex>
                </Col>

            </Row>
        </Flex>

        <Drawer
            open={policyDrawerOpen}
            onClose={() => setPolicyDrawerOpen(false)}
            title="Cancellation Policy"
            placement="right"
            width={460}
        >
            {tripInfo?.cancellationPolicy ? (
                <Flex vertical gap={0}>
                    <div style={{ background: '#fff7f6', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
                        <Typography.Text style={{ fontSize: 12, color: '#666' }}>
                            Charges are calculated based on time remaining before departure.
                        </Typography.Text>
                    </div>
                    <div style={{ borderRadius: 8, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#f5f5f5', padding: '10px 16px' }}>
                            <Typography.Text style={{ fontSize: 12, fontWeight: 600, color: '#444' }}>Time Before Departure</Typography.Text>
                            <Typography.Text style={{ fontSize: 12, fontWeight: 600, color: '#444', textAlign: 'right' }}>Cancellation Charge</Typography.Text>
                        </div>
                        {tripInfo.cancellationPolicy.split(';').filter(seg => {
                            const parts = seg.split(':');
                            return parts.length >= 3 && !Number.isNaN(parseInt(parts[0], 10)) && !Number.isNaN(parseInt(parts[2], 10));
                        }).map((segment, i) => {
                            const parts = segment.split(':');
                            const fromHrs = parseInt(parts[0], 10);
                            const toHrs = parseInt(parts[1], 10);
                            const charge = parseInt(parts[2], 10);
                            const fare = seatData.reduce((sum, s) => sum + s.fare, 0);
                            const timeLabel = toHrs === -1 ? `${fromHrs}+ hrs` : `${fromHrs}–${toHrs} hrs`;
                            let chargeLabel: string;
                            if (charge === 100) {
                                chargeLabel = 'Non-refundable';
                            } else if (fare > 0) {
                                chargeLabel = `₹${((charge / 100) * fare).toFixed(2)}`;
                            } else {
                                chargeLabel = `${charge}% of fare`;
                            }
                            return (
                                <div
                                    key={i}
                                    style={{
                                        display: 'grid', gridTemplateColumns: '1fr 1fr',
                                        padding: '12px 16px',
                                        borderTop: i > 0 ? '1px solid #f0f0f0' : 'none',
                                        background: charge === 100 ? '#fff5f5' : 'white',
                                    }}
                                >
                                    <Typography.Text style={{ fontSize: 13 }}>{timeLabel}</Typography.Text>
                                    <Typography.Text style={{ fontSize: 13, fontWeight: 500, color: charge === 100 ? '#ff4f4f' : '#2f2f2f', textAlign: 'right' }}>
                                        {chargeLabel}
                                    </Typography.Text>
                                </div>
                            );
                        })}
                    </div>
                </Flex>
            ) : (
                <Typography.Text style={{ color: '#8c8c8c', fontSize: 13 }}>
                    Cancellation policy not available for this booking.
                </Typography.Text>
            )}
        </Drawer>
        </>
    );
}
