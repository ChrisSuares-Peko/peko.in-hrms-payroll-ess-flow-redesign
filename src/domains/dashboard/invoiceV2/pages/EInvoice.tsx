import React, { useMemo } from 'react';

import { ArrowRightOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Row } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useNavigate } from 'react-router-dom';

import GenericTable from '@components/atomic/GenericTable';
import TypographyText from '@components/atomic/typography/typographyText';
import { paths } from '@routes/paths';

import EInvoiceLimitCard from '../components/eInvoice/EInvoiceLimitCard';
import EInvoiceQuickActionCard from '../components/eInvoice/EInvoiceQuickActionCard';
import EInvoiceStatCard from '../components/eInvoice/EInvoiceStatCard';
import SessionManagementCard from '../components/eInvoice/SessionManagementCard';
import StatCardsSkeleton from '../components/shared/StatCardsSkeleton';
import {
    E_INVOICE_QUICK_ACTIONS,
    E_INVOICE_STAT_CONFIG,
    E_INVOICE_STAT_SUBLABELS,
} from '../constants/eInvoice';
import { useEInvoiceAuth } from '../hooks/eInvoiceAuth/useEInvoiceAuth';
import { useEInvoiceGuard } from '../hooks/eInvoiceAuth/useEInvoiceGuard';
import { useEInvoiceLogout } from '../hooks/eInvoiceAuth/useEInvoiceLogout';
import useEInvoiceDashboard from '../hooks/eInvoiceDashboard/useEInvoiceDashboard';
import useEInvoiceUsage from '../hooks/eInvoiceDashboard/useEInvoiceUsage';
import useRecentEInvoices from '../hooks/eInvoiceDashboard/useRecentEInvoices';
import { EInvoiceStatItem } from '../types/eInvoice';
import recentEInvoicesColumns, {
    TABLE_HEADER_STYLE,
} from '../utils/table_column/recentEInvoicesColumns';

const EInvoice: React.FC = () => {
    const navigate = useNavigate();
    const { sessionInfo } = useEInvoiceAuth();
    const { logout } = useEInvoiceLogout();
    const { isChecking } = useEInvoiceGuard();

    const { stats, isLoading: isStatsLoading } = useEInvoiceDashboard();
    const { rows: recentInvoices, isLoading: isTableLoading } = useRecentEInvoices();
    const { usage, isLoading: isUsageLoading } = useEInvoiceUsage();

    const statItems = useMemo<EInvoiceStatItem[]>(
        () =>
            E_INVOICE_STAT_CONFIG.map(config => {
                const valueByKey: Record<string, number> = {
                    total: stats.totalIrns,
                    active: stats.activeIrns,
                    cancelled: stats.cancelled,
                    waybill: stats.eWaybills,
                };
                const subLabel =
                    config.iconKey === 'active'
                        ? stats.activeValueLabel
                        : (E_INVOICE_STAT_SUBLABELS[config.iconKey] ?? '');
                return { ...config, value: String(valueByKey[config.iconKey] ?? 0), subLabel };
            }),
        [stats]
    );

    const quickActions = useMemo(
        () =>
            E_INVOICE_QUICK_ACTIONS.map(action => {
                let onClick: (() => void) | undefined;
                if (action.id === 'generate-irn') {
                    onClick = () =>
                        navigate(`/${paths.invoice.index}/${paths.invoice.convertToEInvoice}`);
                } else if (action.id === 'all-invoices') {
                    onClick = () =>
                        navigate(`/${paths.invoice.index}/${paths.invoice.eInvoicingAll}`);
                } else if (action.id === 'e-waybill') {
                    onClick = () =>
                        navigate(`/${paths.invoice.index}/${paths.invoice.eInvoicingWaybill}`);
                } else if (action.id === 'gstin-lookup') {
                    onClick = () =>
                        navigate(`/${paths.invoice.index}/${paths.invoice.eInvoicingGstinLookup}`);
                }
                return { ...action, onClick };
            }),
        [navigate]
    );

    if (isChecking) return null;

    return (
        <Content className="px-0">
            {/* Header */}
            <Flex
                justify="space-between"
                align="flex-start"
                gap={12}
                className="flex-col xs375:flex-row items-center"
            >
                <Flex vertical gap={6} className="mt-4 mb-5 md:mt-5 md:mb-6">
                    <TypographyText className="text-xl md:text-2xl font-semibold leading-8">
                        E-Invoice Dashboard
                    </TypographyText>
                    <TypographyText className="text-[#6A7282] text-sm md:text-base font-normal leading-6">
                        {sessionInfo.gstin} · FY {new Date().getFullYear()}–
                        {String(new Date().getFullYear() + 1).slice(-2)}
                    </TypographyText>
                </Flex>
                <Flex
                    align="center"
                    gap={6}
                    className="h-9 px-4 py-2 bg-[#ECFDF5] border border-[#A7F3D0] rounded-full"
                >
                    <ClockCircleOutlined style={{ color: '#16A34A', fontSize: 15 }} />
                    <TypographyText className="text-[#16A34A] text-sm font-medium leading-4">
                        {sessionInfo.timeLeft}
                    </TypographyText>
                </Flex>
            </Flex>

            {/* Stats */}
            <Row gutter={[16, 16]}>
                {statItems.map(({ id, ...card }) => (
                    <Col key={id} xs={24} sm={12} lg={6}>
                        {isStatsLoading ? (
                            <StatCardsSkeleton count={1} />
                        ) : (
                            <EInvoiceStatCard {...card} />
                        )}
                    </Col>
                ))}
            </Row>

            {/* Quick Actions */}
            <Flex vertical gap={14} className="my-8">
                <TypographyText className="text-base md:text-lg font-semibold leading-6">
                    Quick Actions
                </TypographyText>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {quickActions.map(({ id, ...action }) => (
                        <EInvoiceQuickActionCard key={id} {...action} />
                    ))}
                </div>
            </Flex>

            {/* Body: Table + Session */}
            <Flex gap={20} className="flex-col xl:flex-row xl:items-start">
                <Flex vertical gap={20} className="flex-1 min-w-0">
                    <Flex justify="space-between" align="center" wrap="wrap" gap={10}>
                        <TypographyText className="text-base md:text-lg font-semibold leading-6">
                            Recent E-Invoices
                        </TypographyText>
                        <Button
                            className="h-9 px-4 border-[#E4E4E7] text-sm font-medium rounded-lg"
                            onClick={() =>
                                navigate(`/${paths.invoice.index}/${paths.invoice.eInvoicingAll}`)
                            }
                        >
                            View All <ArrowRightOutlined />
                        </Button>
                    </Flex>
                    <Flex
                        vertical
                        className="rounded-2xl overflow-hidden outline outline-1 outline-[#EFF1F4] [&>div:first-child]:hidden"
                    >
                        <GenericTable
                            dataSource={recentInvoices}
                            columns={recentEInvoicesColumns}
                            rowKey="id"
                            pagination={false}
                            loading={isTableLoading}
                            onRow={record => ({
                                onClick: () =>
                                    navigate(
                                        `/${paths.invoice.index}/e-invoicing/e-invoice-details/${record.id}`
                                    ),
                                style: { cursor: 'pointer' },
                            })}
                            components={{
                                header: {
                                    cell: ({
                                        style,
                                        ...rest
                                    }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
                                        <th {...rest} style={{ ...style, ...TABLE_HEADER_STYLE }} />
                                    ),
                                },
                            }}
                        />
                    </Flex>
                </Flex>
                <Flex
                    vertical
                    gap={16}
                    className="w-full xl:w-[340px] min-[1700px]:w-[440px] xl:flex-shrink-0"
                >
                    <EInvoiceLimitCard
                        used={usage.used}
                        max={usage.maxLimit}
                        isLoading={isUsageLoading}
                        onUpgrade={() =>
                            navigate(
                                `/${paths.invoice.index}/${paths.invoice.eInvoicingManageSubscription}`
                            )
                        }
                    />
                    <SessionManagementCard session={sessionInfo} onLogout={logout} />
                </Flex>
            </Flex>
        </Content>
    );
};

export default EInvoice;
