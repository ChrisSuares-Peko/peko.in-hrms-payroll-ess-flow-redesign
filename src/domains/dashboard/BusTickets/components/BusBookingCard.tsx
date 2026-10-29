import { useState } from 'react';

import { CloseCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { Button, Drawer, Flex, Grid, Modal, Tag, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import { cancelBooking, downloadTicket } from '../api';
import icBus from '../assets/icons/travelsIcon.svg';
import { BusBooking } from '../types/buslist';
import { formatDuration } from '../utils/formatDuration';
import { triggerPdfDownload } from '../utils/pdfDownload';

interface Props {
    booking: BusBooking;
    onViewTicket?: (booking: BusBooking) => void;
    onCancelSuccess?: () => void;
    showCancel?: boolean;
}

export default function BusBookingCard({ booking, onViewTicket, onCancelSuccess, showCancel = false }: Props) {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const contactEmail = useAppSelector(state => state.reducer.busTicket.contactEmail);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [policyDrawerOpen, setPolicyDrawerOpen] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        setIsDownloading(true);
        const result = await downloadTicket({ userId: id, userType: role, corporateTxnId: booking.confirmationNumber });
        setIsDownloading(false);
        if (result) {
            triggerPdfDownload(result.pdfBase64, result.pdfName);
        } else {
            dispatch(showToast({ variant: 'error', description: 'Failed to download ticket. Please try again.' }));
        }
    };
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;

    const handleConfirmCancel = async () => {
        setIsCancelling(true);
        const result = await cancelBooking({
            userId: id,
            userType: role,
            tin: booking.pnrNumber,
            corporateTxnId: booking.confirmationNumber,
            seatsToCancel: booking.seats ?? [],
            email: contactEmail || undefined,
        });
        setIsCancelling(false);
        if (result?.status === true) {
            setCancelModalOpen(false);
            dispatch(showToast({ variant: 'success', description: 'Booking cancelled successfully.' }));
            onCancelSuccess?.();
        } else {
            setCancelModalOpen(false);
            if (result?.message) {
                dispatch(showToast({ variant: 'error', description: result.message }));
            }
        }
    };

    return (
        <>
            <div style={{ border: '1px solid #d9d9d9', borderRadius: 6, overflow: 'hidden', background: 'white' }}>
                <Flex vertical={isMobile}>
                    {/* Left — operator panel */}
                    <Flex
                        vertical align="center" justify="center" gap={12}
                        style={{
                            width: isMobile ? '100%' : 180,
                            minWidth: isMobile ? 0 : 180,
                            background: '#fff7f6',
                            margin: isMobile ? 0 : 4,
                            borderRadius: isMobile ? 0 : 5,
                            padding: isMobile ? '16px' : '24px 16px',
                            flexShrink: 0,
                            flexDirection: isMobile ? 'row' : 'column',
                            gap: isMobile ? 12 : 12,
                        }}
                    >
                        <img src={icBus} alt="bus" style={{ width: 36, height: 36, objectFit: 'contain' }} />
                        <Flex vertical align={isMobile ? 'flex-start' : 'center'} gap={2}>
                            <Typography.Text style={{ fontSize: 16, fontWeight: 600, textAlign: isMobile ? 'left' : 'center' }}>
                                {booking.operator}
                            </Typography.Text>
                            <Typography.Text style={{
                                fontSize: 10, color: '#333', textAlign: isMobile ? 'left' : 'center',
                                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                            }}>
                                {booking.busType}
                            </Typography.Text>
                            {(booking.orderStatus === 'CANCELLED' || booking.status === 'CANCELLED') && (
                                <Tag color="error" style={{ marginTop: 6, fontSize: 10, lineHeight: '16px' }}>Cancelled</Tag>
                            )}
                        </Flex>
                    </Flex>

                    {/* Center — departure / timeline / arrival */}
                    <Flex
                        flex={1} align="center" justify={isMobile ? 'center' : 'space-between'} gap={isMobile ? 8 : 0}
                        style={{ padding: isMobile ? '16px 12px' : '24px 40px' }}
                    >
                        <Flex vertical align="center" gap={6} style={{ width: isMobile ? undefined : 215, flexShrink: 0 }}>
                            <Typography.Text style={{ fontSize: 12, color: '#86898b' }}>Departure</Typography.Text>
                            <Flex vertical align="center">
                                <Typography.Text style={{ fontSize: isMobile ? 15 : 18, fontWeight: 600 }}>{booking.departureTime}</Typography.Text>
                                <Typography.Text style={{ fontSize: 12, textAlign: 'center' }}>{booking.departureDate}</Typography.Text>
                            </Flex>
                            <Typography.Text style={{ fontSize: 11, color: '#86898b', textAlign: 'center' }}>
                                {booking.departureLocation}
                            </Typography.Text>
                        </Flex>

                        <Flex vertical align="center" gap={8} style={{ paddingTop: 16, flex: 1, minWidth: isMobile ? 40 : 140, margin: '0 16px' }}>
                            <Flex align="center" style={{ width: '100%', position: 'relative' }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff4f4f', flexShrink: 0 }} />
                                <div style={{ flex: 1, borderTop: '1.5px dashed #ff4f4f' }} />
                                <div style={{
                                    position: 'absolute', left: '50%', transform: 'translateX(-50%)',
                                    background: '#fff7f6', padding: '3px 8px', borderRadius: 24, whiteSpace: 'nowrap',
                                }}>
                                    <Typography.Text style={{ color: '#ff3a3a', fontWeight: 600, fontSize: 11 }}>
                                        {formatDuration(booking.duration)}
                                    </Typography.Text>
                                </div>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff4f4f', flexShrink: 0 }} />
                            </Flex>
                            <Typography.Text style={{ fontSize: 11, color: '#86898b' }}>{booking.stops}</Typography.Text>
                        </Flex>

                        <Flex vertical align="center" gap={6} style={{ width: isMobile ? undefined : 215, flexShrink: 0 }}>
                            <Typography.Text style={{ fontSize: 12, color: '#86898b' }}>Arrival</Typography.Text>
                            <Flex vertical align="center">
                                <Typography.Text style={{ fontSize: isMobile ? 15 : 18, fontWeight: 600 }}>{booking.arrivalTime}</Typography.Text>
                                <Typography.Text style={{ fontSize: 12, textAlign: 'center' }}>{booking.arrivalDate}</Typography.Text>
                            </Flex>
                            <Typography.Text style={{ fontSize: 11, color: '#86898b', textAlign: 'center' }}>
                                {booking.arrivalLocation}
                            </Typography.Text>
                        </Flex>
                    </Flex>

                    {/* Right — action buttons */}
                    <Flex
                        gap={8}
                        justify="center"
                        vertical
                        style={{
                            width: isMobile ? '100%' : 160,
                            minWidth: isMobile ? 0 : 160,
                            padding: isMobile ? '12px 16px' : '16px 12px 16px 8px',
                            flexShrink: 0,
                            borderTop: isMobile ? '1px solid #f0f0f0' : 'none',
                        }}
                    >
                        <Button
                            style={{ background: '#ff4f4f', borderColor: '#ff4f4f', color: 'white', height: 40, fontWeight: 500, width: '100%' }}
                            onClick={() => onViewTicket?.(booking)}
                        >
                            View Booking
                        </Button>
                        <Button
                            loading={isDownloading}
                            onClick={handleDownload}
                            style={{ height: 40, fontWeight: 500, width: '100%' }}
                        >
                            Download Ticket
                        </Button>
                        {showCancel && (
                            <Button
                                type="text"
                                style={{ color: '#ff4f4f', height: 40, fontWeight: 500, width: '100%' }}
                                onClick={() => setCancelModalOpen(true)}
                            >
                                Cancel Booking
                            </Button>
                        )}
                    </Flex>
                </Flex>

                {/* Bottom footer */}
                <Flex align="center">
                    {!isMobile && <div style={{ width: 188, minWidth: 188, flexShrink: 0 }} />}
                    <Flex flex={1} justify="center" align="center" gap={20} wrap="wrap" style={{ padding: '10px 8px' }}>
                        <Typography.Text style={{ fontSize: 13 }}>
                            <span style={{ color: '#666' }}>Ticket number: </span>
                            <span style={{ fontWeight: 600 }}>{booking.pnrNumber}</span>
                        </Typography.Text>
                        {booking.bookingDate && (
                            <Typography.Text style={{ fontSize: 13 }}>
                                <span style={{ color: '#666' }}>Booking Date: </span>
                                <span style={{ fontWeight: 600 }}>{booking.bookingDate}</span>
                            </Typography.Text>
                        )}
                    </Flex>
                    <Flex gap={16} align="center" style={{ padding: '10px 16px', flexShrink: 0 }}>
                        <Flex gap={6} align="center" style={{ cursor: 'pointer' }} onClick={() => setPolicyDrawerOpen(true)}>
                            <CloseCircleOutlined style={{ fontSize: 16, color: '#8e8e8e' }} />
                            {!isMobile && <Typography.Text style={{ fontSize: 11, color: '#8e8e8e' }}>Cancellation Policy</Typography.Text>}
                        </Flex>
                        <Flex gap={6} align="center" style={{ cursor: 'pointer' }} onClick={() => navigate(paths.dashboard.needHelp)}>
                            <QuestionCircleOutlined style={{ fontSize: 16, color: '#8e8e8e' }} />
                            {!isMobile && <Typography.Text style={{ fontSize: 11, color: '#8e8e8e' }}>Support</Typography.Text>}
                        </Flex>
                    </Flex>
                </Flex>
            </div>

            <Drawer
                open={policyDrawerOpen}
                onClose={() => setPolicyDrawerOpen(false)}
                title="Cancellation Policy"
                placement="right"
                width={460}
            >
                {booking.cancellationPolicy ? (
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
                            {booking.cancellationPolicy.split(';').filter(seg => {
                                const parts = seg.split(':');
                                return parts.length >= 3 && !Number.isNaN(parseInt(parts[0], 10)) && !Number.isNaN(parseInt(parts[2], 10));
                            }).map((segment, i) => {
                                const parts = segment.split(':');
                                const fromHrs = parseInt(parts[0], 10);
                                const toHrs = parseInt(parts[1], 10);
                                const charge = parseInt(parts[2], 10);
                                const timeLabel = toHrs === -1
                                    ? `${fromHrs}+ hrs`
                                    : `${fromHrs}–${toHrs} hrs`;
                                const fare = parseFloat(booking.amount ?? '0');
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

            <Modal
                open={cancelModalOpen}
                onCancel={() => setCancelModalOpen(false)}
                footer={null}
                width={440}
                centered
            >
                <Flex vertical gap={16} style={{ padding: '8px 0' }}>
                    <Typography.Title level={4} style={{ margin: 0 }}>Cancel Ticket</Typography.Title>
                    <Typography.Text style={{ fontSize: 14, color: '#555' }}>
                        Are you sure you want to cancel this ticket? Please review the cancellation charges below.
                    </Typography.Text>

                    {booking.cancellationPolicy && (() => {
                        const fare = parseFloat(booking.amount ?? '0');
                        const rows = booking.cancellationPolicy.split(';').filter(seg => {
                            const p = seg.split(':');
                            return p.length >= 3 && !Number.isNaN(parseInt(p[0], 10)) && !Number.isNaN(parseInt(p[2], 10));
                        }).map(seg => {
                            const p = seg.split(':');
                            const fromHrs = parseInt(p[0], 10);
                            const toHrs = parseInt(p[1], 10);
                            const charge = parseInt(p[2], 10);
                            const timeLabel = toHrs === -1 ? `${fromHrs}+ hrs before departure` : `${fromHrs}–${toHrs} hrs before departure`;
                            let refund: string;
                            if (charge === 100) refund = 'Non-refundable';
                            else if (fare > 0) refund = `₹${((1 - charge / 100) * fare).toFixed(2)}`;
                            else refund = `${100 - charge}% of fare`;
                            const chargeLabel = charge === 100 ? '100%' : `${charge}%`;
                            return { timeLabel, chargeLabel, refund };
                        });
                        if (!rows.length) return null;
                        return (
                            <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', background: '#f5f5f5', padding: '8px 12px' }}>
                                    <Typography.Text style={{ fontSize: 11, fontWeight: 600, color: '#444' }}>Time Before Departure</Typography.Text>
                                    <Typography.Text style={{ fontSize: 11, fontWeight: 600, color: '#444', textAlign: 'center' }}>Charge</Typography.Text>
                                    <Typography.Text style={{ fontSize: 11, fontWeight: 600, color: '#444', textAlign: 'right' }}>You Get Back</Typography.Text>
                                </div>
                                {rows.map((row, i) => (
                                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '8px 12px', borderTop: '1px solid #f0f0f0' }}>
                                        <Typography.Text style={{ fontSize: 12, color: '#333' }}>{row.timeLabel}</Typography.Text>
                                        <Typography.Text style={{ fontSize: 12, color: '#d4380d', textAlign: 'center' }}>{row.chargeLabel}</Typography.Text>
                                        <Typography.Text style={{ fontSize: 12, color: '#389e0d', textAlign: 'right' }}>{row.refund}</Typography.Text>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}

                    <Typography.Text style={{ fontSize: 12, color: '#8c8c8c' }}>
                        Refunds will be credited to your original payment method within <span style={{ fontWeight: 600, color: '#555' }}>5–7 business days</span>.
                    </Typography.Text>

                    <Flex gap={12} justify="flex-end" style={{ marginTop: 4 }}>
                        <Button
                            style={{ height: 40, minWidth: 100 }}
                            onClick={() => setCancelModalOpen(false)}
                            disabled={isCancelling}
                        >
                            Go back
                        </Button>
                        <Button
                            style={{ background: '#ff4f4f', borderColor: '#ff4f4f', color: 'white', height: 40, minWidth: 100 }}
                            loading={isCancelling}
                            onClick={handleConfirmCancel}
                        >
                            Yes, Cancel
                        </Button>
                    </Flex>
                </Flex>
            </Modal>
        </>
    );
}
