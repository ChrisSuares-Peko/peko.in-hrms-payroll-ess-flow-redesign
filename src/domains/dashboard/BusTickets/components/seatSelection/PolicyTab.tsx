import { useMemo } from 'react';

import { Flex, Typography } from 'antd';

export default function PolicyTab({ cancellationPolicy }: { cancellationPolicy?: string }) {
    const rows = useMemo(() => {
        if (!cancellationPolicy) return [];
        return cancellationPolicy.split(';').flatMap(segment => {
            const parts = segment.split(':');
            if (parts.length < 3) return [];
            const fromHrs = parseInt(parts[0], 10);
            const toHrs = parseInt(parts[1], 10);
            const charge = parseInt(parts[2], 10);
            if (Number.isNaN(fromHrs) || Number.isNaN(charge)) return [];
            const time = toHrs === -1
                ? `${fromHrs}+ hrs before departure`
                : `${fromHrs}–${toHrs} hrs before departure`;
            return [{ time, percent: `${charge}%`, amount: charge === 100 ? 'Non-refundable' : `${charge}% of fare` }];
        });
    }, [cancellationPolicy]);

    return (
        <Flex vertical gap={20} style={{ padding: '16px 18px' }}>
            <Flex vertical gap={10}>
                <Typography.Text style={{ fontSize: 14, fontWeight: 700, color: '#101010' }}>Cancellation Policy</Typography.Text>
                {rows.length > 0 ? (
                    <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                            {['Time', 'Charge %', 'Amount'].map(h => (
                                <div key={h} style={{ padding: '10px 12px' }}>
                                    <Typography.Text style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>{h}</Typography.Text>
                                </div>
                            ))}
                        </div>
                        {rows.map(row => (
                            <div key={row.time} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', borderBottom: '1px solid #f0f0f0' }}>
                                <div style={{ padding: '10px 12px' }}><Typography.Text style={{ fontSize: 12, color: '#333' }}>{row.time}</Typography.Text></div>
                                <div style={{ padding: '10px 12px' }}><Typography.Text style={{ fontSize: 12, color: '#333' }}>{row.percent}</Typography.Text></div>
                                <div style={{ padding: '10px 12px' }}><Typography.Text style={{ fontSize: 12, color: '#333' }}>{row.amount}</Typography.Text></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <Typography.Text style={{ fontSize: 13, color: '#8c8c8c' }}>
                        Cancellation policy not available for this trip.
                    </Typography.Text>
                )}
                <Typography.Text style={{ fontSize: 11, color: '#8c8c8c' }}>
                    *Cancellation charges shown above are indicative and exact charges will be available after the ticket is booked.
                </Typography.Text>
            </Flex>
        </Flex>
    );
}
