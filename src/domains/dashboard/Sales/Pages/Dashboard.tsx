import { useMemo, useState } from 'react';

import { SettingOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Row, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useNavigate } from 'react-router-dom';

import TypographyText from '@components/atomic/typography/typographyText';
import { paths } from '@routes/paths';

import globalImg from '../assets/icons/global.svg';
import ActionBanner from '../components/dashboard/ActionBanner';
import QuickAccessCard from '../components/dashboard/QuickAccessCard';
import RecentDocumentRow from '../components/dashboard/RecentDocumentRow';
import RecentTransactionsDrawer from '../components/dashboard/RecentTransactionsDrawer';
import SettingsDrawer from '../components/SettingsDrawer';
import CardRowsSkeleton from '../components/shared/CardRowsSkeleton';
import ComingSoonModal from '../components/shared/ComingSoonModal';
import StatCard from '../components/shared/StatCard';
import StatCardsSkeleton from '../components/shared/StatCardsSkeleton';
import { QUICK_ACCESS_CONFIG, STAT_CARDS_CONFIG } from '../constants/dashboard';
import useSalesDashboard from '../hooks/useSalesDashboard';
import { StatCardItem } from '../types';
import { QuickAccessItem } from '../types/dashboard';
import { formatAmount, formatDateAndTime } from '../utils/helperFunctions';

const Dashboard = () => {
    const navigate = useNavigate();
    const {
        data: dashboardData,
        recentTransactions,
        recentTransactionsTotal,
        isLoading,
        isOnboarded,
    } = useSalesDashboard();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isTransactionsDrawerOpen, setIsTransactionsDrawerOpen] = useState(false);
    const [comingSoon, setComingSoon] = useState<{ title: string; description: string } | null>(
        null
    );

    const statCards = useMemo<StatCardItem[]>(
        () => [
            { ...STAT_CARDS_CONFIG[0], value: String(dashboardData?.customersCount ?? 0) },
            { ...STAT_CARDS_CONFIG[1], value: String(dashboardData?.quotationsCount ?? 0) },
            { ...STAT_CARDS_CONFIG[2], value: String(dashboardData?.agreementsCount ?? 0) },
            { ...STAT_CARDS_CONFIG[3], value: String(dashboardData?.salesOrdersCount ?? 0) },
            {
                ...STAT_CARDS_CONFIG[4],
                value: formatAmount(dashboardData?.totalPaymentsAmount ?? 0),
            },
            { ...STAT_CARDS_CONFIG[5], value: String(dashboardData?.invoicesCount ?? 0) },
        ],
        [dashboardData]
    );

    const quickAccessItems = useMemo<QuickAccessItem[]>(
        () => [
            { ...QUICK_ACCESS_CONFIG[0], onClick: () => navigate(paths.sales.customerLeads) },
            { ...QUICK_ACCESS_CONFIG[1], onClick: () => navigate(paths.sales.quotations) },
            { ...QUICK_ACCESS_CONFIG[2], onClick: () => navigate(paths.sales.agreements) },
            { ...QUICK_ACCESS_CONFIG[3], onClick: () => navigate(paths.sales.salesOrders) },
            { ...QUICK_ACCESS_CONFIG[4], onClick: () => navigate(paths.sales.invoices) },
            { ...QUICK_ACCESS_CONFIG[5], onClick: () => navigate(paths.sales.payment) },
        ],
        [navigate]
    );

    return (
        <Content className="px-0">
            {/* Header */}
            <Flex justify="space-between" align="center" className="mt-5 mb-6 flex-wrap gap-3">
                <Flex vertical gap={6}>
                    <TypographyText className="text-2xl font-semibold leading-8">
                        SalesX
                    </TypographyText>
                    <TypographyText className="text-[#6A7282] text-base font-normal leading-6">
                        Manage the complete customer sales lifecycle
                    </TypographyText>
                </Flex>
                <Button
                    icon={<SettingOutlined />}
                    className="h-9 px-5 border-[#FF4F4F] text-[#FF4F4F] font-medium text-sm rounded-lg"
                    onClick={() => setIsSettingsOpen(true)}
                >
                    Settings
                </Button>
            </Flex>

            <Row gutter={[16, 16]}>
                {statCards.map(({ id, ...card }) => (
                    <Col key={id} xs={24} sm={12} md={8} xl={4}>
                        {isLoading ? <StatCardsSkeleton count={1} /> : <StatCard {...card} />}
                    </Col>
                ))}
            </Row>

            <Flex gap={20} align="stretch" className="mt-9 flex-col xl:flex-row">
                {/* LEFT column */}
                <Flex vertical gap={32} className="flex-1 min-w-0">
                    {/* Browse — 1×6 → 2×3 → 3×2 */}
                    <Flex vertical gap={12}>
                        <TypographyText className="text-base font-semibold leading-6">
                            Browse
                        </TypographyText>
                        <Row gutter={[12, 16]}>
                            {quickAccessItems.map(({ id, ...item }) => (
                                <Col key={id} xs={12} sm={8} lg={4}>
                                    <Flex justify="center">
                                        <QuickAccessCard {...item} />
                                    </Flex>
                                </Col>
                            ))}
                        </Row>
                    </Flex>

                    {/* Activate banners */}
                    {/* <ActionBanner
                        icon={zohoImg}
                        label="Sync your bills and accounts with Zoho"
                        buttonLabel="Sync Now"
                        onClick={() =>
                            setComingSoon({
                                title: 'Coming Soon!',
                                description:
                                    "Zoho sync feature is currently under development. We'll notify you when it's ready.",
                            })
                        }
                    /> */}
                    {!isOnboarded && (
                        <ActionBanner
                            icon={globalImg}
                            label="Activate Domestic Payments"
                            buttonLabel="Activate Now"
                            onClick={() => navigate(paths.dashboard.paymentLinks)}
                        />
                    )}
                </Flex>

                {/* RIGHT column — Recent Transactions */}
                <Flex
                    vertical
                    gap={20}
                    className="w-full xl:w-[430px] min-[1750px]:w-[580px] bg-[#F9F9F9] rounded-2xl p-6 xl:flex-shrink-0 xl:self-stretch"
                >
                    <Flex justify="space-between" align="center">
                        <TypographyText className="text-lg font-semibold leading-6">
                            Recent Transactions
                        </TypographyText>
                        {recentTransactionsTotal > 0 && (
                            <Button
                                type="link"
                                className="p-0 h-auto text-sm !text-[#FF4F4F] font-normal"
                                onClick={() => setIsTransactionsDrawerOpen(true)}
                            >
                                View all
                            </Button>
                        )}
                    </Flex>
                    {isLoading ? (
                        <CardRowsSkeleton count={3} />
                    ) : (
                        <Flex vertical gap={12} className="flex-1">
                            {recentTransactions.length > 0 ? (
                                recentTransactions.map(txn => (
                                    <RecentDocumentRow
                                        key={txn.id}
                                        invoiceNumber={txn.invoiceNumber}
                                        documentType={txn.documentType}
                                        name={txn.customerName}
                                        date={formatDateAndTime(txn.createdAt)}
                                        amount={txn.totalAmount}
                                        onClick={() => {
                                            const id = String(txn.id);
                                            const pathMap: Record<string, string> = {
                                                INVOICE: `/${paths.sales.index}/${paths.sales.invoices}/${paths.sales.invoicedetails.replace(':id', id)}`,
                                                QUOTATION: `/${paths.sales.index}/${paths.sales.quotations}/${paths.sales.quotationDetails.replace(':id', id)}`,
                                                SALES_ORDER: `/${paths.sales.index}/${paths.sales.salesOrders}/${paths.sales.salesOrderDetails.replace(':id', id)}`,
                                                AGREEMENT: `/${paths.sales.index}/${paths.sales.agreementDetail.replace(':id', id)}`,
                                            };
                                            const target = pathMap[txn.documentType];
                                            if (target) navigate(target);
                                        }}
                                    />
                                ))
                            ) : (
                                <Flex justify="center" align="center" className="flex-1 h-full">
                                    <Typography.Text className="text-sm text-[#A1A1AA]">
                                        No recent transactions
                                    </Typography.Text>
                                </Flex>
                            )}
                        </Flex>
                    )}
                </Flex>
            </Flex>

            <RecentTransactionsDrawer
                open={isTransactionsDrawerOpen}
                onClose={() => setIsTransactionsDrawerOpen(false)}
            />

            <SettingsDrawer open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

            <ComingSoonModal
                open={!!comingSoon}
                onClose={() => setComingSoon(null)}
                title={comingSoon?.title ?? ''}
                description={comingSoon?.description ?? ''}
            />
        </Content>
    );
};

export default Dashboard;
