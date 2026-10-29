import { Button, Flex, Typography } from 'antd';

import { StopPoint } from '../types/buslist';

export type { StopPoint };

interface Props {
    totalAmount: number;
    selectedSeats: string[];
    boardingPoint?: StopPoint;
    dropPoint?: StopPoint;
    onProceed: () => void;
}

function Divider() {
    return <div style={{ borderBottom: '1px solid #f0f0f0', margin: '10px 0' }} />;
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <Flex vertical gap={3}>
            <Typography.Text style={{ fontSize: 11, color: '#8c8c8c' }}>{label}</Typography.Text>
            {children}
        </Flex>
    );
}

export default function BookingSummary({ totalAmount, selectedSeats, boardingPoint, dropPoint, onProceed }: Props) {
    const seatLabel = selectedSeats.join(', ') || '—';
    const canProceed = selectedSeats.length > 0 && !!boardingPoint && !!dropPoint;

    return (
        <Flex vertical style={{ background: 'white', borderRadius: 12, padding: '20px 18px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', minHeight: 360 }}>
            <Typography.Text style={{ fontSize: 16, fontWeight: 700, letterSpacing: 0.8, color: '#333' }}>
                Booking Summary
            </Typography.Text>

            <Divider />

            <SummaryRow label="Total Amount">
                <Typography.Text style={{ fontSize: 24, fontWeight: 700, color: '#101010' }}>
                    ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography.Text>
            </SummaryRow>

            <Divider />

            <SummaryRow label="Seat(s)">
                <Typography.Text style={{ fontSize: 18, fontWeight: 700, color: '#101010' }}>
                    {seatLabel}
                </Typography.Text>
            </SummaryRow>

            <Divider />

            <SummaryRow label="Boarding Point">
                <Typography.Text style={{ fontSize: 15, fontWeight: 700, color: '#101010' }}>
                    {boardingPoint?.name || '—'}
                </Typography.Text>
                {boardingPoint && (
                    <Typography.Text style={{ fontSize: 11, color: '#8c8c8c' }}>
                        {boardingPoint.time}, {boardingPoint.date}
                    </Typography.Text>
                )}
            </SummaryRow>

            <Divider />

            <SummaryRow label="Drop Point">
                <Typography.Text style={{ fontSize: 15, fontWeight: 700, color: '#101010' }}>
                    {dropPoint?.name || '—'}
                </Typography.Text>
                {dropPoint && (
                    <Typography.Text style={{ fontSize: 11, color: '#8c8c8c' }}>
                        {dropPoint.time}, {dropPoint.date}
                    </Typography.Text>
                )}
            </SummaryRow>

            <div style={{ flex: 1 }} />

            <Button
                type="primary"
                disabled={!canProceed}
                onClick={onProceed}
                style={{
                    background: canProceed ? '#ff4f4f' : undefined,
                    borderColor: canProceed ? '#ff4f4f' : undefined,
                    width: '100%', height: 44, borderRadius: 8,
                    fontSize: 15, fontWeight: 600, marginTop: 20,
                }}
            >
                Proceed
            </Button>
        </Flex>
    );
}
