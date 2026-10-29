import { Flex, Typography } from 'antd';
import { BsStarFill, BsStar } from 'react-icons/bs';

import icBus from '../../assets/icons/busListIcon.svg';
import { formatDuration } from '../../utils/formatDuration';

type Props = {
    operator: string;
    busType: string;
    departTime?: string;
    departDate?: string;
    departStop?: string;
    arrivalTime?: string;
    arrivalDate?: string;
    arrivalStop?: string;
    duration?: string;
    rating?: number;
    ratingCount?: number;
};

function DurationLabel({ duration, fontSize = 12 }: { duration: string; fontSize?: number }) {
    const formatted = formatDuration(duration);
    const parts = formatted.split(' ');
    return (
        <span style={{ fontSize, color: '#101010', whiteSpace: 'nowrap' }}>
            {parts.map((part, i) => {
                const isUnit = part === 'hr' || part === 'min';
                return (
                    <span key={i} style={{ fontWeight: isUnit ? 400 : 600 }}>
                        {part}{i < parts.length - 1 ? ' ' : ''}
                    </span>
                );
            })}
        </span>
    );
}

export default function BusSummaryCard({
    operator,
    busType,
    departTime = '',
    departDate = '',
    departStop = '',
    arrivalTime = '',
    arrivalDate = '',
    arrivalStop = '',
    duration = '',
    rating = 0,
    ratingCount = 0,
}: Props) {
    return (
        <Flex
            vertical
            style={{
                borderRadius: 11,
                background: 'white',
                overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            }}
        >
            {/* Top row: operator + type + rating */}
            <Flex
                align="center"
                justify="space-between"
                style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}
            >
                <Flex align="center" gap={8}>
                    <img src={icBus} alt="bus" style={{ width: 22, height: 22, objectFit: 'contain', flexShrink: 0 }} />
                    <Flex vertical gap={1}>
                        <Typography.Text style={{ fontSize: 14, fontWeight: 600, color: '#101010' }}>{operator}</Typography.Text>
                        {busType && <Typography.Text style={{ fontSize: 12, color: '#8c8c8c' }}>{busType}</Typography.Text>}
                    </Flex>
                </Flex>
                {rating > 0 && (
                    <Flex vertical align="flex-end" gap={2}>
                        <Flex align="center" gap={4}>
                            <Typography.Text style={{ fontSize: 14, fontWeight: 600, color: '#43b75d' }}>{rating.toFixed(1)}</Typography.Text>
                            <Flex gap={2} align="center">
                                {[1, 2, 3, 4, 5].map(s =>
                                    s <= Math.round(rating)
                                        ? <BsStarFill key={s} size={12} color="#faad14" />
                                        : <BsStar key={s} size={12} color="#d9d9d9" />
                                )}
                            </Flex>
                        </Flex>
                        {ratingCount > 0 && (
                            <Typography.Text style={{ fontSize: 11, color: '#8c8c8c' }}>{ratingCount.toLocaleString()} ratings</Typography.Text>
                        )}
                    </Flex>
                )}
            </Flex>

            {/* Route row */}
            <Flex align="center" style={{ padding: 'clamp(12px, 4vw, 20px) clamp(12px, 4vw, 24px)', gap: 'clamp(6px, 2vw, 12px)' }}>
                {/* Departure */}
                <Flex vertical gap={4} style={{ flex: '0 0 auto', width: 'clamp(70px, 22%, 140px)', overflow: 'hidden' }}>
                    <Typography.Text ellipsis style={{ fontSize: 12, color: '#8c8c8c' }}>{departStop}</Typography.Text>
                    <Typography.Text style={{ fontSize: 'clamp(18px, 5.5vw, 28px)', fontWeight: 600, color: '#101010', lineHeight: 1.2 }}>{departTime}</Typography.Text>
                    <Typography.Text style={{ fontSize: 11, color: '#8c8c8c', whiteSpace: 'nowrap' }}>{departDate}</Typography.Text>
                </Flex>

                {/* Timeline */}
                <Flex align="center" justify="center" style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(246, 238, 251, 1)', flexShrink: 0 }} />
                    <div style={{ flex: 1, borderTop: '1px dashed #e0e0e0', minWidth: 0 }} />
                    <Flex align="center" style={{ background: 'rgba(246, 238, 251, 1)', padding: '3px 8px', borderRadius: 20, flexShrink: 0 }}>
                        <DurationLabel duration={duration} fontSize={12} />
                    </Flex>
                    <div style={{ flex: 1, borderTop: '1px dashed #e0e0e0', minWidth: 0 }} />
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(246, 238, 251, 1)', flexShrink: 0 }} />
                </Flex>

                {/* Arrival */}
                <Flex vertical gap={4} style={{ flex: '0 0 auto', width: 'clamp(70px, 22%, 140px)', overflow: 'hidden', alignItems: 'flex-end' }}>
                    <Typography.Text ellipsis style={{ fontSize: 12, color: '#8c8c8c' }}>{arrivalStop}</Typography.Text>
                    <Typography.Text style={{ fontSize: 'clamp(18px, 5.5vw, 28px)', fontWeight: 600, color: '#101010', lineHeight: 1.2 }}>{arrivalTime}</Typography.Text>
                    <Typography.Text style={{ fontSize: 11, color: '#8c8c8c', whiteSpace: 'nowrap' }}>{arrivalDate}</Typography.Text>
                </Flex>
            </Flex>
        </Flex>
    );
}
