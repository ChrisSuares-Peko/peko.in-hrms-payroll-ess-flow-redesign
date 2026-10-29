import { useMemo, useState } from 'react';

import { Col, Flex, Grid, Row, Skeleton } from 'antd';

import DueThisWeekDrawer from './DueThisWeekDrawer';
import RevenueCollectionHealth from './overview/RevenueCollectionHealth';
import moneySendImg from '../../assets/icons/payment/dollar-circle.svg';
import moneyChangeImg from '../../assets/icons/payment/money-change.svg';
import moneyReciveImg from '../../assets/icons/payment/money-recive.svg';
import moneyTimeImg from '../../assets/icons/payment/money-time.svg';
import usePaymentDashboard from '../../hooks/payments/usePaymentDashboard';
import { StatCardItem } from '../../types';
import { formatAmount } from '../../utils/helperFunctions';
import RankingPanel from '../shared/RankingPanel';
import StatCard from '../shared/StatCard';
import StatCardsSkeleton from '../shared/StatCardsSkeleton';

const { useBreakpoint } = Grid;

const OverviewTab = () => {
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    const {
        overView,
        isOverViewLoading,
        dueData,
        isDueLoading,
        topCustomers,
        isTopCustomersLoading,
        recentActivity,
        isRecentActivityLoading,
        recentActivityPage,
        recentActivityTotal,
        recentActivityItemsPerPage,
        onRecentActivityPageChange,
    } = usePaymentDashboard();

    const [isDueDrawerOpen, setIsDueDrawerOpen] = useState(false);

    const statCards = useMemo<StatCardItem[]>(
        () => [
            {
                id: 'received',
                value: overView ? formatAmount(overView.totalReceived) : '—',
                label: 'Total Received',
                bgColor: '#FDF6F0',
                icon: moneyReciveImg,
                badge: 'growth',
            },
            {
                id: 'outstanding',
                value: overView ? formatAmount(overView.outstanding) : '—',
                label: 'Outstanding',
                bgColor: '#ECF0FC',
                icon: moneyChangeImg,
                badge: 'text',
                badgeValue: overView ? `${overView.outstandingCount} invoices pending` : undefined,
            },
            {
                id: 'overdue',
                value: overView ? formatAmount(overView.overdue) : '—',
                label: 'Overdue',
                bgColor: '#EBF6F1',
                icon: moneyTimeImg,
                badge: 'text',
                badgeValue: overView
                    ? `${overView.overdueCount} invoices past due date`
                    : undefined,
            },
            {
                id: 'month',
                value: overView ? formatAmount(overView.thisMonth) : '—',
                label: 'Received This Month',
                bgColor: '#FCF9FF',
                icon: moneySendImg,
                badge: 'growth',
                badgeValue: overView?.vsLastMonthReceived
                    ? String(overView.vsLastMonthReceived)
                    : undefined,
            },
        ],
        [overView]
    );

    const revenueSegments = useMemo(() => {
        const ch = overView?.collectionHealth;
        return [
            {
                label: 'Collected',
                color: '#43B75D',
                pct: ch?.collectedPercent ?? 0,
                amount: overView?.totalReceived ?? 0,
            },
            {
                label: 'Outstanding',
                color: '#F59E0B',
                pct: ch?.outstandingPercent ?? 0,
                amount: overView?.outstanding ?? 0,
            },
            {
                label: 'Overdue',
                color: '#EF4444',
                pct: ch?.overduePercent ?? 0,
                amount: overView?.overdue ?? 0,
            },
        ];
    }, [overView]);

    return (
        <Flex vertical gap={24}>
            {/* Stat cards: 1 col on xs, 4x1 on lg */}

            <Row gutter={[16, 16]}>
                {statCards.map(s => (
                    <Col key={s.id} xs={24} sm={12} xl={6}>
                        {isOverViewLoading ? <StatCardsSkeleton count={1} /> : <StatCard {...s} />}
                    </Col>
                ))}
            </Row>

            {/* Revenue health */}
            {isOverViewLoading ? (
                <Flex vertical gap={12} className="bg-[#F9F9F9] rounded-2xl p-6">
                    <Skeleton active paragraph={{ rows: 2 }} />
                </Flex>
            ) : (
                <RevenueCollectionHealth
                    revenueSegments={revenueSegments}
                    totalInvoiced={overView?.collectionHealth?.total ?? 0}
                />
            )}

            {/* Rankings: side by side on md+, stacked on mobile */}
            <Flex vertical={isMobile} gap={24}>
                <RankingPanel
                    title="Payments Due This Week"
                    data={dueData}
                    variant="due"
                    isLoading={isDueLoading}
                    onViewAll={() => setIsDueDrawerOpen(true)}
                />
                <RankingPanel
                    title="Top Paying Customers"
                    data={topCustomers}
                    variant="paying"
                    isLoading={isTopCustomersLoading}
                />
            </Flex>

            <RankingPanel
                title="Recent Payment Activity"
                data={recentActivity}
                variant="activity"
                isLoading={isRecentActivityLoading}
                pagination={{
                    current: recentActivityPage,
                    total: recentActivityTotal,
                    pageSize: recentActivityItemsPerPage,
                    onChange: onRecentActivityPageChange,
                }}
            />

            <DueThisWeekDrawer open={isDueDrawerOpen} onClose={() => setIsDueDrawerOpen(false)} />
        </Flex>
    );
};

export default OverviewTab;
