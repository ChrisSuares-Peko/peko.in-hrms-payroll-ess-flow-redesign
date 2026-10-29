import { useState } from 'react';

import { CloseCircleOutlined, DownloadOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { Button, Divider, Drawer, Flex, Modal, Spin, Tag, Typography } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import { cancelBooking, downloadTicket } from '../api';
import pekoLogo from '../assets/icons/pekologo.svg';
import useBookingDetailsApi from '../hooks/useBookingDetailsApi';
import { triggerPdfDownload } from '../utils/pdfDownload';

const IMPORTANT_INFO = [
    'Please arrive at the boarding point at least 15 minutes before departure.',
    'Carry a valid government-issued photo ID for verification at the time of boarding.',
    'The bus operator is not obligated to wait beyond the scheduled departure time.',
    'Excess baggage over 10 kgs per passenger will be chargeable.',
    "Cancellation charges apply as per the bus operator's policy.",
    'Use your Order ID for all communication with Peko about this booking.',
];

export default function BookingConfirmed() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const corporateTxnId: string = state?.corporateTxnId ?? '';
    const [canCancel, setCanCancel] = useState<boolean>(state?.canCancel === true);
    const { detail, isLoading } = useBookingDetailsApi(corporateTxnId);
    const { id, role } = useAppSelector(s => s.reducer.auth);
    const reduxContactEmail = useAppSelector(s => s.reducer.busTicket.contactEmail);
    const dispatch = useAppDispatch();
    const [isDownloading, setIsDownloading] = useState(false);
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [isCancelled, setIsCancelled] = useState(false);
    const [policyDrawerOpen, setPolicyDrawerOpen] = useState(false);

    const handleConfirmCancel = async () => {
        if (!detail) return;
        setIsCancelling(true);
        const result = await cancelBooking({
            userId: id,
            userType: role,
            tin: detail.tin,
            corporateTxnId,
            seatsToCancel: detail.passengers.map(p => p.seat),
            email: detail.contactEmail || reduxContactEmail || undefined,
        });
        setIsCancelling(false);
        if (result?.status === true) {
            setCancelModalOpen(false);
            setIsCancelled(true);
            setCanCancel(false);
            dispatch(showToast({ variant: 'success', description: 'Booking cancelled successfully.' }));
        } else {
            setCancelModalOpen(false);
            if (result?.message) {
                dispatch(showToast({ variant: 'error', description: result.message }));
            }
        }
    };

    const handleDownload = async () => {
        setIsDownloading(true);
        const result = await downloadTicket({ userId: id, userType: role, corporateTxnId });
        setIsDownloading(false);
        if (result) {
            triggerPdfDownload(result.pdfBase64, result.pdfName);
        } else {
            dispatch(showToast({ variant: 'error', description: 'Failed to download ticket. Please try again.' }));
        }
    };

    return (
        <>
            <Spin spinning={isLoading}>
                <Flex vertical style={{ padding: '20px 24px', maxWidth: 920, margin: '0 auto' }}>
                    {/* Page Header */}
                    <Flex justify="space-between" align="center" style={{ marginBottom: 28 }}>
                        <Typography.Title level={3} style={{ margin: 0, fontWeight: 500 }}>
                            Booking Confirmed
                        </Typography.Title>
                        <Flex gap={12} align="center">
                            <Button
                                style={{ background: '#ff4f4f', borderColor: '#ff4f4f', color: 'white', height: 40, fontWeight: 500, borderRadius: 8 }}
                                onClick={() => navigate(`${paths.dashboard.corporateTravel}/${paths.bus.index}/${paths.bus.manageBookings}`)}
                            >
                                View Booking
                            </Button>
                            <Button
                                icon={<DownloadOutlined />}
                                loading={isDownloading}
                                onClick={handleDownload}
                                style={{ height: 40, fontWeight: 500, borderRadius: 8 }}
                            >
                                Download Ticket
                            </Button>
                            {isCancelled ? (
                                <Tag color="error" style={{ fontSize: 13, padding: '4px 12px', fontWeight: 600, borderRadius: 6 }}>
                                    Cancelled
                                </Tag>
                            ) : canCancel && (
                                <Button
                                    style={{ borderColor: '#ff4f4f', color: '#ff4f4f', height: 40, fontWeight: 500, borderRadius: 8 }}
                                    onClick={() => setCancelModalOpen(true)}
                                >
                                    Cancel Booking
                                </Button>
                            )}
                        </Flex>
                    </Flex>

                    {/* Ticket Confirmation header */}
                    <Flex justify="space-between" align="flex-start" style={{ marginBottom: 12 }}>
                        <div>
                            <Typography.Title level={4} style={{ margin: '0 0 28px 0', fontWeight: 700 }}>
                                Ticket Confirmation
                            </Typography.Title>
                            <Flex gap={48} wrap="wrap">
                                <Typography.Text style={{ fontWeight: 600, fontSize: 14 }}>
                                    Order ID: {detail?.corporateTxnId ?? '—'}
                                </Typography.Text>
                            </Flex>
                        </div>
                        <img src={pekoLogo} alt="PEKO" style={{ height: 36, flexShrink: 0 }} />
                    </Flex>

                    <Divider style={{ margin: '12px 0' }} />

                    <Typography.Text style={{ fontSize: 14, display: 'block', margin: '20px 0', color: '#2f2f2f' }}>
                        Booked on {detail?.bookingDate ?? '—'}
                    </Typography.Text>

                    {/* Main Ticket Card */}
                    <div style={{
                        background: 'white',
                        borderRadius: 24,
                        boxShadow: '0px 1.24px 12.36px 1.14px rgba(0,0,0,0.06)',
                        overflow: 'hidden',
                        marginTop: 30,
                        marginBottom: 16,
                    }}>
                        {/* Gray header band */}
                        <div style={{ background: '#f8fafc', padding: '16px 24px' }}>
                            <Flex justify="space-between" align="center" gap={16}>
                                <div style={{ minWidth: 160, flexShrink: 0 }}>
                                    <Typography.Text style={{ fontSize: 16, fontWeight: 500, color: '#1e293b', display: 'block', lineHeight: '24px' }}>
                                        {detail?.operator ?? '—'}
                                    </Typography.Text>
                                    <Typography.Text style={{ fontSize: 12, color: '#475569', lineHeight: '20px' }}>
                                        {detail?.busType ?? '—'}
                                    </Typography.Text>
                                </div>
                                <Typography.Text style={{ fontSize: 14, textAlign: 'center', flex: 1 }}>
                                    <span style={{ color: '#475569' }}>Ticket number: </span>
                                    <span style={{ fontWeight: 500 }}>{detail?.tin ?? '—'}</span>
                                </Typography.Text>
                            </Flex>
                        </div>

                        {/* Route section */}
                        <div style={{ padding: '30px 30px 20px' }}>
                            <Flex align="center" justify="space-between" gap={16}>
                                {/* Departure */}
                                <Flex vertical align="center" gap={4} style={{ width: 160, flexShrink: 0 }}>
                                    <Typography.Text style={{ fontSize: 16, color: '#475569', lineHeight: '24px' }}>
                                        {detail?.routeFrom || detail?.departureLocation || '—'}
                                    </Typography.Text>
                                    <Typography.Text style={{ fontSize: 24, fontWeight: 600, color: '#1e293b', lineHeight: '32px' }}>
                                        {detail?.departureTime ?? '—'}
                                    </Typography.Text>
                                    <Typography.Text style={{ fontSize: 12, color: '#475569', lineHeight: '20px' }}>
                                        {detail?.departureDate ?? '—'}
                                    </Typography.Text>
                                    {detail?.departureLandmark && (
                                        <Typography.Text style={{ fontSize: 12, color: '#475569', fontWeight: 700, textAlign: 'center', lineHeight: '20px' }}>
                                            {detail.departureLandmark}
                                        </Typography.Text>
                                    )}
                                </Flex>

                                {/* Timeline */}
                                <Flex vertical align="center" style={{ flex: 1, position: 'relative', paddingTop: 8 }}>
                                    <Flex align="center" style={{ width: '100%', position: 'relative' }}>
                                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(233, 211, 247, 1)', flexShrink: 0 }} />
                                        <div style={{ flex: 1, borderTop: '1px dashed #e0e0e0' }} />
                                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(233, 211, 247, 1)', flexShrink: 0 }} />
                                    </Flex>
                                    <div style={{
                                        position: 'absolute',
                                        left: '50%',
                                        top: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        background: 'rgba(233, 211, 247, 1)',
                                        borderRadius: 24,
                                        padding: '5px 16px',
                                        whiteSpace: 'nowrap',
                                        zIndex: 1,
                                    }}>
                                        <Typography.Text style={{ color: '#4a3a56', fontWeight: 600, fontSize: 14 }}>
                                            {detail?.duration ?? '—'}
                                        </Typography.Text>
                                    </div>
                                </Flex>

                                {/* Arrival */}
                                <Flex vertical align="center" gap={4} style={{ width: 160, flexShrink: 0 }}>
                                    <Typography.Text style={{ fontSize: 16, color: '#475569', lineHeight: '24px' }}>
                                        {detail?.routeTo || detail?.arrivalLocation || '—'}
                                    </Typography.Text>
                                    <Typography.Text style={{ fontSize: 24, fontWeight: 600, color: '#1e293b', lineHeight: '32px' }}>
                                        {detail?.arrivalTime ?? '—'}
                                    </Typography.Text>
                                    <Typography.Text style={{ fontSize: 12, color: '#475569', lineHeight: '20px' }}>
                                        {detail?.arrivalDate ?? '—'}
                                    </Typography.Text>
                                    {detail?.arrivalLandmark && (
                                        <Typography.Text style={{ fontSize: 12, color: '#475569', fontWeight: 700, textAlign: 'center', lineHeight: '20px' }}>
                                            {detail.arrivalLandmark}
                                        </Typography.Text>
                                    )}
                                </Flex>
                            </Flex>
                        </div>

                        {/* Cancellation Policy + Support */}
                        <Flex justify="center" gap={24} style={{ padding: '4px 24px 20px' }}>
                            <Flex gap={6} align="center" style={{ cursor: 'pointer' }} onClick={() => setPolicyDrawerOpen(true)}>
                                <CloseCircleOutlined style={{ fontSize: 18, color: '#8e8e8e' }} />
                                <Typography.Text style={{ fontSize: 11, color: '#8e8e8e' }}>Cancellation Policy</Typography.Text>
                            </Flex>
                            <Flex gap={6} align="center" style={{ cursor: 'pointer' }} onClick={() => navigate(paths.dashboard.needHelp)}>
                                <QuestionCircleOutlined style={{ fontSize: 18, color: '#8e8e8e' }} />
                                <Typography.Text style={{ fontSize: 11, color: '#8e8e8e' }}>Support</Typography.Text>
                            </Flex>
                        </Flex>
                    </div>

                    {/* Boarding & Dropping Points */}
                    {detail && (detail.departureLocation || detail.arrivalLocation) && (
                        <div style={{ border: '1px solid #dedede', borderRadius: 12, overflow: 'hidden', background: 'white', marginBottom: 16 }}>
                            <div style={{ background: '#f5f5f5', padding: '10px 20px' }}>
                                <Typography.Text style={{ fontWeight: 600, fontSize: 12, letterSpacing: 0.3 }}>BOARDING &amp; DROP POINTS</Typography.Text>
                            </div>
                            <Flex gap={0} style={{ padding: '16px 20px' }}>
                                {detail.departureLocation && (
                                    <Flex vertical gap={4} style={{ flex: 1 }}>
                                        <Typography.Text style={{ fontSize: 12, color: '#8c8c8c' }}>Boarding Point</Typography.Text>
                                        <Typography.Text style={{ fontSize: 14, fontWeight: 600 }}>{detail.departureLocation}</Typography.Text>
                                        {detail.departureLandmark && (
                                            <Typography.Text style={{ fontSize: 12, color: '#666' }}>{detail.departureLandmark}</Typography.Text>
                                        )}
                                    </Flex>
                                )}
                                {detail.arrivalLocation && (
                                    <Flex vertical gap={4} style={{ flex: 1 }}>
                                        <Typography.Text style={{ fontSize: 12, color: '#8c8c8c' }}>Drop Point</Typography.Text>
                                        <Typography.Text style={{ fontSize: 14, fontWeight: 600 }}>{detail.arrivalLocation}</Typography.Text>
                                        {detail.arrivalLandmark && (
                                            <Typography.Text style={{ fontSize: 12, color: '#666' }}>{detail.arrivalLandmark}</Typography.Text>
                                        )}
                                    </Flex>
                                )}
                            </Flex>
                        </div>
                    )}

                    {/* Travellers */}
                    {detail && detail.passengers.length > 0 && (
                        <div style={{ border: '1px solid #dedede', borderRadius: 12, overflow: 'hidden', background: 'white', marginBottom: 16 }}>
                            <div style={{ background: '#f5f5f5', padding: '10px 20px' }}>
                                <Flex style={{ maxWidth: 580 }}>
                                    <Typography.Text style={{ fontWeight: 600, fontSize: 12, flex: 1, letterSpacing: 0.3 }}>TRAVELLERS</Typography.Text>
                                    <Typography.Text style={{ fontWeight: 600, fontSize: 12, width: 120, letterSpacing: 0.3 }}>SEAT NO.</Typography.Text>
                                </Flex>
                            </div>
                            {detail.passengers.map((p, i) => (
                                <div key={i} style={{ padding: '16px 20px', borderTop: i > 0 ? '1px solid #f0f0f0' : 'none' }}>
                                    <Flex style={{ maxWidth: 580 }}>
                                        <div style={{ flex: 1 }}>
                                            <Typography.Text style={{ fontWeight: 500, fontSize: 14, display: 'block' }}>
                                                {p.name}
                                            </Typography.Text>
                                            <Typography.Text style={{ fontSize: 12, color: '#666' }}>
                                                {[p.gender, p.age ? `${p.age} yrs` : ''].filter(Boolean).join(' · ')}
                                            </Typography.Text>
                                        </div>
                                        <Typography.Text style={{ fontWeight: 500, fontSize: 14, width: 120 }}>{p.seat}</Typography.Text>
                                    </Flex>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Fare Breakup */}
                    {detail && (() => {
                        const baseFare = parseFloat(detail.baseFare || '0');
                        const platformFee = parseFloat(detail.bookingFee || '0');
                        const gst = parseFloat(detail.serviceTax || '0');
                        const couponDiscount = parseFloat(detail.couponDiscount || '0');
                        const totalFare = parseFloat(detail.amount || '0');
                        const pgAmount = parseFloat(detail.pgAmount || '0');
                        return (
                            <div style={{ border: '1px solid #dedede', borderRadius: 12, padding: '20px 24px', background: 'white', marginBottom: 16 }}>
                                <Typography.Text style={{ fontWeight: 600, fontSize: 13, letterSpacing: 0.3, display: 'block', marginBottom: 20 }}>
                                    FARE BREAKUP
                                </Typography.Text>
                                <Flex justify="space-between" wrap="wrap" gap={12}>
                                    <Flex gap={8} align="center">
                                        <Typography.Text style={{ fontSize: 13 }}>Base Fare:</Typography.Text>
                                        <Typography.Text style={{ fontWeight: 600, fontSize: 13 }}>₹{baseFare.toFixed(2)}</Typography.Text>
                                        {detail.passengers.length > 1 && (
                                            <Typography.Text style={{ fontSize: 13, color: '#8b8b8b' }}>x ({detail.passengers.length})</Typography.Text>
                                        )}
                                    </Flex>
                                    {platformFee > 0 && (
                                        <Flex gap={8}>
                                            <Typography.Text style={{ fontSize: 13 }}>Platform Fee:</Typography.Text>
                                            <Typography.Text style={{ fontWeight: 600, fontSize: 13 }}>₹{platformFee.toFixed(2)}</Typography.Text>
                                        </Flex>
                                    )}
                                    <Flex gap={8}>
                                        <Typography.Text style={{ fontSize: 13 }}>
                                            GST{detail.serviceTaxPercentage ? ` (${detail.serviceTaxPercentage}%)` : ''}:
                                        </Typography.Text>
                                        <Typography.Text style={{ fontWeight: 600, fontSize: 13 }}>₹{gst.toFixed(2)}</Typography.Text>
                                    </Flex>
                                    <Flex gap={8}>
                                        <Typography.Text style={{ fontSize: 13 }}>
                                            Total Fare{detail.passengers.length > 1 ? ` (${detail.passengers.length} passengers)` : ''}:
                                        </Typography.Text>
                                        <Typography.Text style={{ fontWeight: 600, fontSize: 13 }}>
                                            ₹{totalFare.toFixed(2)}
                                        </Typography.Text>
                                    </Flex>
                                    {couponDiscount > 0 && (
                                        <Flex gap={8}>
                                            <Typography.Text style={{ fontSize: 13 }}>
                                                Coupon Discount{detail.couponCode ? ` (${detail.couponCode})` : ''}:
                                            </Typography.Text>
                                            <Typography.Text style={{ fontWeight: 600, fontSize: 13, color: '#52c41a' }}>
                                                -₹{couponDiscount.toFixed(2)}
                                            </Typography.Text>
                                        </Flex>
                                    )}
                                    {couponDiscount > 0 && pgAmount > 0 && (
                                        <Flex gap={8}>
                                            <Typography.Text style={{ fontSize: 13, fontWeight: 600 }}>Amount Paid:</Typography.Text>
                                            <Typography.Text style={{ fontWeight: 700, fontSize: 13 }}>₹{pgAmount.toFixed(2)}</Typography.Text>
                                        </Flex>
                                    )}
                                </Flex>
                            </div>
                        );
                    })()}

                    {/* Important Information */}
                    <div style={{ border: '1px solid #dedede', borderRadius: 12, padding: '20px 24px', background: 'white', marginBottom: 40 }}>
                        <Typography.Text style={{ fontWeight: 600, fontSize: 13, letterSpacing: 0.3, display: 'block', marginBottom: 20 }}>
                            IMPORTANT INFORMATION
                        </Typography.Text>
                        <ul style={{ paddingLeft: 18, margin: 0 }}>
                            {IMPORTANT_INFO.map((info, i) => (
                                <li key={i} style={{ fontSize: 11, color: '#000', lineHeight: 1.45, marginBottom: i < IMPORTANT_INFO.length - 1 ? 11 : 0 }}>
                                    {info}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Footer */}
                    <Flex justify="space-between" wrap="wrap" gap={12}>
                        <Typography.Text style={{ fontSize: 13 }}>
                            Peko Helpline:{' '}
                            <span style={{ fontWeight: 600 }}>Call +97145401266</span>
                        </Typography.Text>
                        <Typography.Text style={{ fontSize: 13 }}>
                            Peko support email:{' '}
                            <span style={{ fontWeight: 600 }}>help@peko.one</span>
                        </Typography.Text>
                        <Typography.Text style={{ fontWeight: 600, fontSize: 13 }}>www.peko.one</Typography.Text>
                    </Flex>
                </Flex>
            </Spin>

            <Drawer
                open={policyDrawerOpen}
                onClose={() => setPolicyDrawerOpen(false)}
                title="Cancellation Policy"
                placement="right"
                width={460}
            >
                {detail?.cancellationPolicy ? (
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
                            {detail.cancellationPolicy.split(';').filter(seg => {
                                const parts = seg.split(':');
                                return parts.length >= 3 && !Number.isNaN(parseInt(parts[0], 10)) && !Number.isNaN(parseInt(parts[2], 10));
                            }).map((segment, i) => {
                                const parts = segment.split(':');
                                const fromHrs = parseInt(parts[0], 10);
                                const toHrs = parseInt(parts[1], 10);
                                const charge = parseInt(parts[2], 10);
                                const timeLabel = toHrs === -1 ? `${fromHrs}+ hrs` : `${fromHrs}–${toHrs} hrs`;
                                const fare = parseFloat(detail.amount ?? '0');
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
                    <Typography.Title level={4} style={{ margin: 0 }}>Cancel Booking</Typography.Title>
                    <Typography.Text style={{ fontSize: 14, color: '#555' }}>
                        Are you sure you want to cancel this ticket? Please review the cancellation charges below.
                    </Typography.Text>

                    {detail?.cancellationPolicy && (() => {
                        const fare = parseFloat(detail.totalFare ?? '0');
                        const rows = detail.cancellationPolicy.split(';').filter(seg => {
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
                        <Button style={{ height: 40, minWidth: 100 }} onClick={() => setCancelModalOpen(false)} disabled={isCancelling}>
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
