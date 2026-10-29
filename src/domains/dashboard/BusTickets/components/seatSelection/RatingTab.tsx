import { useMemo } from 'react';

import { Flex, Typography } from 'antd';

function StarIcon({ filled }: { filled: boolean }) {
    return <span style={{ color: filled ? '#facc15' : '#e5e7eb', fontSize: 20, lineHeight: 1 }}>★</span>;
}

export default function RatingTab({ rating, ratingsBreakUp, totalRatingCount }: {
    rating?: string;
    ratingsBreakUp?: Record<string, number>;
    totalRatingCount?: string;
}) {
    const score = parseFloat(rating ?? '0');
    const filledStars = Math.round(score);
    const total = parseInt(totalRatingCount ?? '0', 10);

    const breakdown = useMemo(() => {
        if (!ratingsBreakUp) return [];
        return [5, 4, 3, 2, 1].map(star => {
            const count = ratingsBreakUp[String(star)] ?? 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return { star, pct };
        });
    }, [ratingsBreakUp, total]);

    if (!score) {
        return (
            <Flex align="center" justify="center" style={{ padding: '40px 18px' }}>
                <Typography.Text style={{ color: '#8c8c8c', fontSize: 13 }}>No ratings available for this bus.</Typography.Text>
            </Flex>
        );
    }

    return (
        <Flex vertical gap={20} style={{ padding: '20px 18px' }}>
            <Flex align="center" gap={16}>
                <Typography.Text style={{ fontSize: 52, fontWeight: 700, color: '#101010', lineHeight: 1 }}>
                    {score.toFixed(1)}
                </Typography.Text>
                <Flex vertical gap={4}>
                    <Flex gap={2}>
                        {[1, 2, 3, 4, 5].map(i => <StarIcon key={i} filled={i <= filledStars} />)}
                    </Flex>
                    {total > 0 && (
                        <Typography.Text style={{ fontSize: 12, color: '#8c8c8c' }}>{total} reviews</Typography.Text>
                    )}
                </Flex>
            </Flex>

            {breakdown.length > 0 && (
                <Flex vertical gap={10}>
                    {breakdown.map(({ star, pct }) => (
                        <Flex key={star} align="center" gap={10}>
                            <Flex align="center" gap={3} style={{ width: 28, flexShrink: 0 }}>
                                <Typography.Text style={{ fontSize: 12, color: '#555' }}>{star}</Typography.Text>
                                <StarIcon filled />
                            </Flex>
                            <div style={{ flex: 1, height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: '#52c41a', borderRadius: 4 }} />
                            </div>
                            <Typography.Text style={{ fontSize: 12, color: '#8c8c8c', width: 32, textAlign: 'right', flexShrink: 0 }}>
                                {pct}%
                            </Typography.Text>
                        </Flex>
                    ))}
                </Flex>
            )}
        </Flex>
    );
}
