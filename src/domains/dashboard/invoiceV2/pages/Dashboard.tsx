import React, { useEffect, useMemo, useRef, useState } from 'react';

import { DownOutlined, SettingOutlined } from '@ant-design/icons';
import { Button, Dropdown, Flex, Grid, MenuProps, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { Link, useNavigate } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import TypographyText from '@components/atomic/typography/typographyText';
import { paths } from '@routes/paths';

import globalImg from '../assets/icons/global.svg';
import CollectPaymentModal from '../components/collectPayment/CollectPaymentModal';
import SelectInvoiceDrawer from '../components/collectPayment/SelectInvoiceDrawer';
import QuickAccessCard from '../components/dashboard/QuickAccessCard';
import RecentInvoiceRow from '../components/dashboard/RecentInvoiceRow';
import StatCard from '../components/dashboard/StatCard';
// import InternationalRemittanceModal from '../components/internationalRemittance/InternationalRemittanceModal';
import ManageBankAccountsModal from '../components/manageBankAccounts/ManageBankAccountsModal';
import SettingsDrawer from '../components/SettingsDrawer';
import CardRowsSkeleton from '../components/shared/CardRowsSkeleton';
import StatCardsSkeleton from '../components/shared/StatCardsSkeleton';
import { QUICK_ACCESS_CONFIG, STAT_CARDS_CONFIG } from '../constants/dashboard';
import useSelectableInvoices from '../hooks/collectPayment/useSelectableInvoices';
import useDashboardData from '../hooks/useDashboardData';
import useOnboarding from '../hooks/useOnboarding';
import { StatCardItem } from '../types';
import { CollectPaymentStep } from '../types/CollectPayment';
import { QuickAccessItem } from '../types/dashboard';
import { InvoiceRow } from '../types/invoice';
import { VirtualAccount, VirtualAccountResponse } from '../types/ManageBankAccounts';
import { formatAmount, formatDateAndTime } from '../utils/helperFunctions';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const {
        stats,
        recentInvoices,
        isStatsLoading,
        isRecentInvoicesLoading,
        refreshStats,
        refreshRecentInvoices,
    } = useDashboardData();
    const { checkOnboardingStatus } = useOnboarding();
    const onboardingStatusPromiseRef = useRef<Promise<{
        isOnboarded: boolean;
        bankDetails: VirtualAccount | null;
        record: VirtualAccountResponse | null;
    }> | null>(null);
    const [isActivated, setIsActivated] = useState<boolean | null>(null);
    const [bankDetails, setBankDetails] = useState<VirtualAccount | null>(null);
    const [isOnboardingStatusLoading, setIsOnboardingStatusLoading] = useState(true);
    const [onboardingRecord, setOnboardingRecord] = useState<VirtualAccountResponse | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isBankAccountsOpen, setIsBankAccountsOpen] = useState(false);
    const [isSelectInvoiceOpen, setIsSelectInvoiceOpen] = useState(false);
    const [isCollectPaymentOpen, setIsCollectPaymentOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRow | null>(null);
    const [collectPaymentStep, setCollectPaymentStep] = useState<CollectPaymentStep>('options');
    const {
        invoices: selectableInvoices,
        isLoading: isSelectableLoading,
        totalRecords: selectableTotalRecords,
        page: selectablePage,
        setPage: setSelectablePage,
        itemsPerPage: selectableItemsPerPage,
    } = useSelectableInvoices(isSelectInvoiceOpen);

    useEffect(() => {
        let isMounted = true;
        const request = checkOnboardingStatus();
        onboardingStatusPromiseRef.current = request;
        setIsOnboardingStatusLoading(true);

        request.finally(() => {
            if (isMounted) {
                onboardingStatusPromiseRef.current = null;
                setIsOnboardingStatusLoading(false);
            }
        });

        request.then(result => {
            if (!isMounted) return;
            setIsActivated(result.isOnboarded);
            setBankDetails(result.bankDetails);
            setOnboardingRecord(result.isOnboarded ? null : result.record);
        });

        return () => {
            isMounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const resolveDashboardOnboardingStatus = async () => {
        if (onboardingStatusPromiseRef.current) {
            return onboardingStatusPromiseRef.current;
        }

        return {
            isOnboarded: !!isActivated,
            bankDetails,
            record: onboardingRecord,
        };
    };

    const statCards = useMemo<StatCardItem[]>(
        () => [
            {
                ...STAT_CARDS_CONFIG[0],
                value: formatAmount(stats?.totalSales || 0),
                growthPercent: stats?.salesVsLastMonthPercent,
            },
            {
                ...STAT_CARDS_CONFIG[1],
                value: formatAmount(stats?.totalReceived || 0),
                growthPercent: stats?.receivedVsLastMonthPercent,
            },
            {
                ...STAT_CARDS_CONFIG[2],
                value: formatAmount(stats?.outstandingAmount || 0),
            },
        ],
        [stats]
    );

    const quickAccessItems = useMemo<QuickAccessItem[]>(
        () => [
            {
                ...QUICK_ACCESS_CONFIG[1],
                onClick: () => navigate(`/${paths.invoice.index}/${paths.invoice.quotations}`),
            },
            {
                ...QUICK_ACCESS_CONFIG[0],
                onClick: () => navigate(`/${paths.invoice.index}/${paths.invoice.allInvoice}`),
            },
            { ...QUICK_ACCESS_CONFIG[2], onClick: () => navigate(paths.invoice.creditNotes) },
            { ...QUICK_ACCESS_CONFIG[3], onClick: () => navigate(paths.invoice.eInvoicingSignIn) },
            { ...QUICK_ACCESS_CONFIG[4], onClick: () => navigate(paths.invoice.customers) },
            { ...QUICK_ACCESS_CONFIG[5], onClick: () => navigate(paths.invoice.catalog) },
            { ...QUICK_ACCESS_CONFIG[6], onClick: () => setIsBankAccountsOpen(true) },
            { ...QUICK_ACCESS_CONFIG[7], onClick: () => setIsSelectInvoiceOpen(true) },
            {
                ...QUICK_ACCESS_CONFIG[8],
                onClick: () => navigate(`/${paths.invoice.index}/${paths.invoice.agingAnalysis}`),
            },
            {
                ...QUICK_ACCESS_CONFIG[9],
                onClick: () => navigate(`/${paths.invoice.index}/${paths.invoice.reminders}`),
            },
            { ...QUICK_ACCESS_CONFIG[11], onClick: () => navigate(paths.invoice.receipts) },
        ],
        [navigate]
    );
    let recentInvoicesContent = (
        <Flex justify="center" align="center" className="flex-1 h-full">
            <Typography.Text className="text-sm text-[#A1A1AA]">No recent invoices</Typography.Text>
        </Flex>
    );

    if (isRecentInvoicesLoading) {
        recentInvoicesContent = <CardRowsSkeleton count={5} />;
    } else if (recentInvoices.length > 0) {
        recentInvoicesContent = (
            <>
                {recentInvoices.map(inv => (
                    <RecentInvoiceRow
                        key={inv.id}
                        name={inv.name || (inv.cashSale ? 'Cash Sale' : 'N/A')}
                        date={formatDateAndTime(inv.createdAt)}
                        amount={Number(inv.totalAmount)}
                        isCredit={false}
                    />
                ))}
            </>
        );
    }

    return (
        <Content className="px-0">
            {/* Header */}
            <Flex
                align="flex-end"
                justify="space-between"
                wrap="wrap"
                gap={12}
                className="mt-4 mb-5 md:mt-5 md:mb-6"
            >
                <Flex vertical gap={6}>
                    <TypographyText className="text-[#101828] text-xl md:text-2xl font-semibold leading-8">
                        Invoicing
                    </TypographyText>
                    <TypographyText className="text-[#6A7282] text-sm md:text-base font-normal leading-6">
                        Manage your invoices and track payments
                    </TypographyText>
                </Flex>
                <Flex gap={8} wrap="wrap">
                    <Button icon={<SettingOutlined />} onClick={() => setIsSettingsOpen(true)}>
                        Settings
                    </Button>
                    <Button
                        onClick={() =>
                            navigate(`/${paths.invoice.index}/${paths.invoice.templates}`)
                        }
                    >
                        Invoice Templates
                    </Button>
                    <Dropdown
                        menu={{
                            items: [
                                {
                                    key: 'invoice',
                                    label: 'Tax Invoice',
                                    onClick: () =>
                                        navigate(`/${paths.invoice.index}/${paths.invoice.create}`),
                                },
                                {
                                    key: 'quotation',
                                    label: 'Quotation',
                                    onClick: () =>
                                        navigate(
                                            `/${paths.invoice.index}/${paths.invoice.quotationCreate}`
                                        ),
                                },
                            ] satisfies MenuProps['items'],
                        }}
                        trigger={['click']}
                    >
                        <Button type="primary" danger>
                            New invoice <DownOutlined />
                        </Button>
                    </Dropdown>
                </Flex>
            </Flex>

            {/* Stats row — full width */}
            {isStatsLoading ? (
                <StatCardsSkeleton count={3} verticalOnMobile={isMobile} />
            ) : (
                <Flex vertical={isMobile} gap={16} className="mb-5">
                    {statCards.map(({ id, ...card }) => (
                        <StatCard key={id} {...card} />
                    ))}
                </Flex>
            )}

            {/* Body: Quick Access (left) + Recent Invoices (right) */}
            <Flex vertical={isMobile} gap={20} align="stretch">
                {/* LEFT — Quick Access */}
                <Flex vertical gap={16} className="flex-1 min-w-0">
                    <Flex vertical gap={12}>
                        <TypographyText className="text-base font-semibold leading-6">
                            Quick Access
                        </TypographyText>
                        <div className="grid grid-cols-2 min-[420px]:grid-cols-5 gap-x-2 gap-y-6">
                            {quickAccessItems.map(({ id, ...item }) => (
                                <QuickAccessCard key={id} {...item} />
                            ))}
                        </div>
                    </Flex>

                    {/* Activate Domestic Payments banner */}
                    {isActivated === false && (
                        <Flex
                            vertical={isMobile}
                            justify="space-between"
                            align={isMobile ? 'flex-start' : 'center'}
                            gap={isMobile ? 16 : 0}
                            className="bg-[#F8FAFC] rounded-2xl px-4 py-4 md:px-6"
                        >
                            <Flex align="center" gap={16}>
                                <ReactSVG src={globalImg} />
                                <TypographyText className="text-[#101828] text-base font-semibold leading-6">
                                    Activate Domestic Payments
                                </TypographyText>
                            </Flex>
                            <Button
                                block={isMobile}
                                className="h-9 px-5 border-[#FF4F4F] text-[#FF4F4F] font-medium text-sm rounded-lg hover:bg-transparent md:w-auto"
                                onClick={() => navigate(paths.dashboard.paymentLinks)}
                            >
                                Activate Now
                            </Button>
                        </Flex>
                    )}
                </Flex>

                {/* RIGHT — Recent Invoices */}
                <Flex
                    vertical
                    gap={16}
                    className="w-full md:w-[380px] bg-[#F9F9F9] rounded-2xl p-4 md:p-6 flex-shrink-0"
                >
                    <Flex justify="space-between" align="flex-start">
                        <Flex vertical gap={2}>
                            <TypographyText className="text-[#101828] text-base font-semibold leading-6">
                                Recent Invoices
                            </TypographyText>
                            <TypographyText className="text-[#6A7282] text-sm font-normal">
                                Here&apos;s a snapshot of your invoicing activity today.
                            </TypographyText>
                        </Flex>
                        <Link
                            to={paths.invoice.allInvoice}
                            className="text-[#FF4F4F] text-sm font-normal no-underline hover:text-[#FF4F4F] shrink-0"
                        >
                            View all
                        </Link>
                    </Flex>
                    <Flex vertical gap={12} className="flex-1">
                        {recentInvoicesContent}
                    </Flex>
                </Flex>
            </Flex>

            <SettingsDrawer open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
            {/* <InternationalRemittanceModal
                open={isRemittanceOpen}
                onClose={() => setIsRemittanceOpen(false)}
            /> */}
            <ManageBankAccountsModal
                open={isBankAccountsOpen}
                onClose={() => setIsBankAccountsOpen(false)}
                virtualAccounts={bankDetails ? [bankDetails] : []}
                isVirtualAccountsLoading={isOnboardingStatusLoading}
            />
            <SelectInvoiceDrawer
                open={isSelectInvoiceOpen}
                onClose={() => setIsSelectInvoiceOpen(false)}
                onSelectInvoice={inv => {
                    setSelectedInvoice(inv);
                    setIsSelectInvoiceOpen(false);
                    setCollectPaymentStep('options');
                    setIsCollectPaymentOpen(true);
                }}
                invoices={selectableInvoices}
                isLoading={isSelectableLoading}
                totalRecords={selectableTotalRecords}
                page={selectablePage}
                itemsPerPage={selectableItemsPerPage}
                onPageChange={setSelectablePage}
            />
            <CollectPaymentModal
                open={isCollectPaymentOpen}
                onClose={() => {
                    setIsCollectPaymentOpen(false);
                    setCollectPaymentStep('options');
                }}
                invoice={selectedInvoice}
                step={collectPaymentStep}
                onStepChange={setCollectPaymentStep}
                onPaymentSuccess={() => {
                    refreshStats();
                    refreshRecentInvoices();
                }}
                resolveOnboardingStatus={resolveDashboardOnboardingStatus}
            />
        </Content>
    );
};

export default Dashboard;
