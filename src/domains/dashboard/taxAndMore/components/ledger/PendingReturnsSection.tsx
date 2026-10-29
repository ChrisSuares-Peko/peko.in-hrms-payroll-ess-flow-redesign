import { Flex, Typography } from 'antd';

import type { ReturnLiabilityData } from '../../types';

const fmt = (n: number) =>
    Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface Props {
    transactions?: ReturnLiabilityData['transactions'];
}

const PendingReturnsSection = ({ transactions }: Props) => {
    const rows = (transactions ?? []).map(t => ({
        name: t.desc || '—',
        period: t.date || '—',
        amount: t.total,
        status: t.type === 'Cr' ? 'Filed' : 'Upcoming',
    }));
    const upcomingCount = rows.filter(r => r.status === 'Upcoming').length;
    return (
        <div className="border border-[#e2e8f0] rounded-[14px] overflow-hidden bg-white">
            <Flex
                align="center"
                justify="space-between"
                className="px-6 py-4 border-b border-[#eaecf0]"
            >
                <Flex vertical gap={2}>
                    <Typography.Text
                        className="font-semibold"
                        style={{ fontSize: 16, color: '#1e293b' }}
                    >
                        Pending Return Liabilities
                    </Typography.Text>
                    <Typography.Text className="text-xs" style={{ color: '#64748b' }}>
                        Upcoming and recently filed returns
                    </Typography.Text>
                </Flex>
                <span
                    style={{
                        backgroundColor: '#fffbeb',
                        color: '#f59e0b',
                        border: '1px solid #fde68a',
                        borderRadius: 60,
                        padding: '2px 12px',
                        fontSize: 12,
                        fontWeight: 500,
                    }}
                >
                    {upcomingCount} Upcoming
                </span>
            </Flex>
            <div
                className="grid bg-[#fafbfb] border-b border-[#eaecf0]"
                style={{ gridTemplateColumns: '2fr 1.5fr 2fr 1.2fr' }}
            >
                {['Return', 'Period', 'Liability Amount (₹)', 'Status'].map((h, i) => (
                    <div
                        key={i}
                        className="px-6 py-3 text-sm font-semibold"
                        style={{ color: '#42526d' }}
                    >
                        {h}
                    </div>
                ))}
            </div>
            {rows.length === 0 ? (
                <div className="px-6 py-6 text-center">
                    <Typography.Text className="text-sm" style={{ color: '#94a3b8' }}>
                        No data for the selected period
                    </Typography.Text>
                </div>
            ) : (
                rows.map((row, i) => (
                    <div
                        key={i}
                        className="grid items-center border-b border-[#eaecf0] last:border-b-0"
                        style={{ gridTemplateColumns: '2fr 1.5fr 2fr 1.2fr', minHeight: 52 }}
                    >
                        <div className="px-6 py-3">
                            <Typography.Text
                                className="text-sm font-medium"
                                style={{ color: '#1e293b' }}
                            >
                                {row.name}
                            </Typography.Text>
                        </div>
                        <div className="px-6 py-3">
                            <Typography.Text className="text-sm" style={{ color: '#475569' }}>
                                {row.period}
                            </Typography.Text>
                        </div>
                        <div className="px-6 py-3">
                            <Typography.Text className="text-sm" style={{ color: '#475569' }}>
                                ₹{fmt(row.amount)}
                            </Typography.Text>
                        </div>
                        <div className="px-6 py-3">
                            <span
                                style={{
                                    backgroundColor: row.status === 'Filed' ? '#ecfdf5' : '#fffbeb',
                                    color: row.status === 'Filed' ? '#16a34a' : '#f59e0b',
                                    borderRadius: 60,
                                    padding: '2px 10px',
                                    fontSize: 12,
                                    fontWeight: 500,
                                }}
                            >
                                {row.status}
                            </span>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default PendingReturnsSection;
