import React from 'react';

import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { Col, Row, Skeleton } from 'antd';
import { ReactSVG } from 'react-svg';

import moneySendIcon from '../../assets/icons/money-send2.svg';
import statusUpIcon from '../../assets/icons/status-up.svg';
import statusUp2Icon from '../../assets/icons/status-up2.svg';

interface AgingStatsRowProps {
    totalOutstanding: number;
    outstandingDelta: number;
    totalOverdue: number;
    overdueDelta: number;
    paidThisMonth: number;
    paidDelta: number;
    avgDaysToPay: number;
    isLoading?: boolean;
}

const DeltaBadge = ({ value, positiveIsBad = false }: { value: number; positiveIsBad?: boolean }) => {
    if (value === 0) return null;
    const isUp = value > 0;
    const isBad = positiveIsBad ? isUp : !isUp;
    const color = isBad ? '#EF4444' : '#22C55E';
    const bg = isBad ? '#FEE2E2' : '#DCFCE7';
    return (
        <span
            className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold"
            style={{ color, backgroundColor: bg }}
        >
            {isUp ? <ArrowUpOutlined style={{ fontSize: 10 }} /> : <ArrowDownOutlined style={{ fontSize: 10 }} />}
            {Math.abs(value)}%
        </span>
    );
};

const fmtAmount = (amount: number) =>
    `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface CardProps {
    label: string;
    value: React.ReactNode;
    icon: string;
    bgColor: string;
    extra?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ label, value, icon, bgColor, extra }) => (
    <div
        className="flex-1 rounded-xl px-4 py-4 md:px-5 min-w-0 flex flex-col gap-3"
        style={{ backgroundColor: bgColor }}
    >
        <div className="flex items-center justify-between">
            <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center [&_svg]:w-5 [&_svg]:h-5">
                <ReactSVG src={icon} />
            </div>
            {extra}
        </div>
        <div className="flex flex-col gap-1">
            <span className="text-[#475569] text-sm font-normal leading-5">{label}</span>
            <span className="text-[#1E293B] text-xl font-semibold leading-7">{value}</span>
        </div>
    </div>
);

const AgingStatsRow: React.FC<AgingStatsRowProps> = ({
    totalOutstanding,
    outstandingDelta,
    totalOverdue,
    overdueDelta,
    paidThisMonth,
    paidDelta,
    avgDaysToPay,
    isLoading = false,
}) => (
    <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
            <Card
                label="Total Outstanding"
                icon={statusUp2Icon}
                bgColor="#FDF6F0"
                value={isLoading ? <Skeleton.Input size="small" active /> : fmtAmount(totalOutstanding)}
                extra={
                    outstandingDelta !== 0 ? (
                        <span className="flex items-center gap-1">
                            <DeltaBadge value={outstandingDelta} positiveIsBad />
                            <span className="text-xs text-gray-400">vs last month</span>
                        </span>
                    ) : null
                }
            />
        </Col>
        <Col xs={24} sm={12} xl={6}>
            <Card
                label="Total Overdue"
                icon={moneySendIcon}
                bgColor="#ECF0FC"
                value={isLoading ? <Skeleton.Input size="small" active /> : fmtAmount(totalOverdue)}
                extra={
                    overdueDelta !== 0 ? (
                        <span className="flex items-center gap-1">
                            <DeltaBadge value={overdueDelta} positiveIsBad />
                            <span className="text-xs text-gray-400">vs last month</span>
                        </span>
                    ) : null
                }
            />
        </Col>
        <Col xs={24} sm={12} xl={6}>
            <Card
                label="Paid This Month"
                icon={statusUpIcon}
                bgColor="#EBF6F1"
                value={isLoading ? <Skeleton.Input size="small" active /> : fmtAmount(paidThisMonth)}
                extra={
                    paidDelta !== 0 ? (
                        <span className="flex items-center gap-1">
                            <DeltaBadge value={paidDelta} />
                            <span className="text-xs text-gray-400">vs last month</span>
                        </span>
                    ) : null
                }
            />
        </Col>
        <Col xs={24} sm={12} xl={6}>
            <Card
                label="Avg Days to Pay"
                icon={statusUp2Icon}
                bgColor="#FCF9FF"
                value={(() => {
                    if (isLoading) return <Skeleton.Input size="small" active />;
                    if (avgDaysToPay > 0) return `${avgDaysToPay} days`;
                    return '—';
                })()
                }
            />
        </Col>
    </Row>
);

export default AgingStatsRow;
