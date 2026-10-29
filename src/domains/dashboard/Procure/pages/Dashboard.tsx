import React from 'react';

import { ArrowUpOutlined } from '@ant-design/icons';
import { Col, Flex, Row, Skeleton, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

import Browse from '../components/Dashboard/Browse';
import CreateSomethingNew from '../components/Dashboard/CreateSomethingNew';
import POStatusBreakdown from '../components/Dashboard/POStatusBreakdown';
import RecentActivity from '../components/Dashboard/RecentActivity';
import RFQsClosingSoon from '../components/Dashboard/RFQsClosingSoon';
import SpendByCategory from '../components/Dashboard/SpendByCategory';
import { useDashboard } from '../hooks/useDashboard';
import { statCards } from '../utils/data';

const { Text } = Typography;

const Dashboard: React.FC = () => {
    const { stats, isLoading, activity, activeRfqs, chartData, isChartLoading } = useDashboard();

    const formatK = (n: number) => n >= 1000 ? `${Math.round(n / 1000).toLocaleString('en-IN')}K` : n.toLocaleString('en-IN');
    const currencySymbol: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', AED: 'AED' };
    const symbol = stats ? (currencySymbol[stats.committedSpend.currency] ?? stats.committedSpend.currency) : '';

    const cardValues = [
        stats?.activePurchaseOrders.count?.toLocaleString('en-IN'),
        stats?.unpaidInvoices.count?.toLocaleString('en-IN'),
        stats?.openRfqs.count?.toLocaleString('en-IN'),
        stats ? `${symbol} ${stats.committedSpend.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : undefined,
    ];

    const cardTrends: Array<{ arrow: boolean; text: string } | null> = [
        stats ? { arrow: true,  text: `${stats.activePurchaseOrders.vsLastMonth.toLocaleString('en-IN')} vs last month` } : null,
        stats ? { arrow: false, text: `${formatK(stats.unpaidInvoices.amount)} Unpaid` }          : null,
        stats ? { arrow: true,  text: `${stats.openRfqs.vsLastMonth.toLocaleString('en-IN')} vs last month` }             : null,
        stats ? { arrow: true,  text: `${stats.committedSpend.vsLastMonth.toLocaleString('en-IN')} vs last month` }       : null,
    ];

    return (
    <Flex vertical gap={16}>
        <Row justify="space-between" align="middle">
            <Col>
                <Text className="text-2xl font-bold">Procure</Text>
            </Col>
        </Row>
        {/* ── Stat Cards ── */}
        <Row gutter={[16, 16]}>
            {statCards.map((card, i) => (
                <Col xs={24} sm={12} lg={6} key={card.label}>
                    <div
                        className="relative rounded-3xl pt-4 sm:pt-5 pb-5 sm:pb-6 pl-5 sm:pl-6 pr-4 min-h-[130px] sm:min-h-[150px] flex flex-col justify-between overflow-hidden"
                        style={{ background: card.bg }}
                    >
                        {/* Trend badge — absolute top-right */}
                        <div
                            className="absolute top-[10px] right-3 flex items-center gap-1 bg-white rounded-full px-2 py-0.5 max-w-[55%] truncate"
                            style={{ color: card.trendColor, fontSize: 11, fontWeight: 400 }}
                        >
                            {cardTrends[i]?.arrow && (
                                <ArrowUpOutlined style={{ fontSize: 10, color: card.trendColor, flexShrink: 0 }} />
                            )}
                            <span className="truncate">{cardTrends[i]?.text ?? card.trend}</span>
                        </div>

                        {/* Icon */}
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                            <ReactSVG src={card.icon} className="w-7 h-7 overflow-hidden [&_svg]:w-full [&_svg]:h-full [&_svg]:block" />
                        </div>

                        {/* Value + Label */}
                        <div className="mt-2 min-w-0">
                            {isLoading
                                ? <Skeleton.Input active size="small" style={{ width: 80, display: 'block', marginBottom: 4 }} />
                                : <Text className="text-lg sm:text-[23px] md:text-[18px] lg:text-[20px]" style={{ fontWeight: 700, color: '#212121', display: 'block', lineHeight: '1.2' }}>{cardValues[i] ?? '—'}</Text>
                            }
                            <Text style={{ fontSize: 14, fontWeight: 400, color: '#000', marginTop: 4, display: 'block' }}>{card.label}</Text>
                        </div>
                    </div>
                </Col>
            ))}
        </Row>

        <Row gutter={[16, 16]} align="stretch">

            <Col xs={24} lg={16}>
                <Flex vertical gap={14} style={{ height: '100%' }}>
                    <Browse />
                    <CreateSomethingNew />

                    <Row gutter={[16, 16]}>
                        <Col xs={24} lg={12}>
                            <SpendByCategory spendByCategory={chartData?.spendByCategory} isLoading={isChartLoading} />
                        </Col>
                        <Col xs={24} lg={12}>
                            <POStatusBreakdown poStatus={chartData?.poStatus} isLoading={isChartLoading} />
                        </Col>
                    </Row>

                    <RFQsClosingSoon rfqs={activeRfqs} isLoading={isLoading} />
                </Flex>
            </Col>

            <Col xs={24} lg={8}>
                <RecentActivity activity={activity} isLoading={isLoading} />
            </Col>

        </Row>
    </Flex>
    );
};

export default Dashboard;
