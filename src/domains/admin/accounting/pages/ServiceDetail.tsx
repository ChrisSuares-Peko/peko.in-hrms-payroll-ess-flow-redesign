import { useCallback, useMemo } from 'react';

import {
    AppstoreOutlined,
    GiftOutlined,
    PercentageOutlined,
    ShopOutlined,
    WalletOutlined,
} from '@ant-design/icons';
import { Breadcrumb, Button, Card, Skeleton, Typography } from 'antd';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import CashbacksTab from '../components/serviceDetail/CashbacksTab';
import CommissionTab from '../components/serviceDetail/CommissionTab';
import PlansTab from '../components/serviceDetail/PlansTab';
import PlatformFeeTab from '../components/serviceDetail/PlatformFeeTab';
import VendorTab from '../components/serviceDetail/VendorTab';
import {
    ACCOUNTING_SERVICE_TABS,
    AccountingServiceTab,
    SERVICE_LEAF_BY_KIND,
    accountingLeafPath,
    accountingServicePath,
} from '../config/servicePaths';
import { DrillPanel, DrillTab, useAccountingDrillPanel } from '../context/AccountingShellContext';
import useAccountingService from '../hooks/useAccountingService';
import { AccountingPlanType } from '../types/services';
import { serviceConfigurationStatus } from '../utils/commission';

const SHARED_TABS: DrillTab[] = [
    { key: ACCOUNTING_SERVICE_TABS.platformFee, label: 'Platform Fee', icon: <WalletOutlined /> },
    { key: ACCOUNTING_SERVICE_TABS.cashbacks, label: 'Cashbacks', icon: <GiftOutlined /> },
    { key: ACCOUNTING_SERVICE_TABS.vendor, label: 'Vendor', icon: <ShopOutlined /> },
];

export const SERVICE_DETAIL_TABS: Record<AccountingPlanType, DrillTab[]> = {
    with_plans: [
        { key: ACCOUNTING_SERVICE_TABS.plans, label: 'Plans', icon: <AppstoreOutlined /> },
        ...SHARED_TABS,
    ],
    without_plans: [
        {
            key: ACCOUNTING_SERVICE_TABS.commission,
            label: 'Commission',
            icon: <PercentageOutlined />,
        },
        ...SHARED_TABS,
    ],
};

const ServiceDetail = ({ kind }: { kind: AccountingPlanType }) => {
    const { accessKey = '', tab } = useParams();
    const navigate = useNavigate();
    const leaf = SERVICE_LEAF_BY_KIND[kind];
    const leafLabel = leaf.displayLabel ?? leaf.label;
    const listPath = accountingLeafPath(leaf.slug);
    const tabs = SERVICE_DETAIL_TABS[kind];
    const activeTab = tabs.find(item => item.key === tab)?.key as AccountingServiceTab | undefined;

    const {
        isLoading,
        service,
        notFound,
        updateCommission,
        updateVendor,
        toggleCommissionConfigured,
        refetch,
    } = useAccountingService(accessKey);

    const onTabChange = useCallback(
        (key: string) =>
            navigate(accountingServicePath(kind, accessKey, key as AccountingServiceTab)),
        [navigate, kind, accessKey]
    );

    const panel = useMemo<DrillPanel | null>(() => {
        if (!service || !activeTab) return null;
        const { label, tone } = serviceConfigurationStatus(service);
        return {
            backTo: listPath,
            backLabel: 'All services',
            title: service.serviceProvider,
            subtitle: service.vendor?.vendorName ?? 'No vendor linked',
            status: { label, tone },
            tabs,
            activeKey: activeTab,
            onTabChange,
        };
    }, [service, activeTab, listPath, tabs, onTabChange]);

    useAccountingDrillPanel(panel);

    if (!activeTab) {
        return <Navigate to={accountingServicePath(kind, accessKey)} replace />;
    }

    // Only the true first load has no service yet — a refetch after saving (which briefly
    // flips isLoading again) must not unmount the tab tree, or local UI state like PlansTab's
    // active sub-tab resets to its default.
    if (isLoading && !service) {
        return <Skeleton active paragraph={{ rows: 8 }} />;
    }

    if (notFound || !service) {
        return (
            <Card className="rounded-xl border border-borderCard shadow-none text-center">
                <Typography.Title level={5} className="!text-textHeadings">
                    Service not found
                </Typography.Title>
                <Typography.Text className="block mb-4 text-textBody">
                    This service is not classified as {leafLabel.toLowerCase()} or no longer exists.
                </Typography.Text>
                <Button type="primary" onClick={() => navigate(listPath)}>
                    Back to {leafLabel}
                </Button>
            </Card>
        );
    }

    const body = {
        [ACCOUNTING_SERVICE_TABS.plans]: (
            <PlansTab
                service={service}
                onSaveCommission={updateCommission}
                onToggleCommissionConfigured={toggleCommissionConfigured}
                onConfigurationChange={refetch}
            />
        ),
        [ACCOUNTING_SERVICE_TABS.commission]: (
            <CommissionTab
                service={service}
                onSave={updateCommission}
                onToggleConfigured={toggleCommissionConfigured}
            />
        ),
        [ACCOUNTING_SERVICE_TABS.platformFee]: (
            <PlatformFeeTab service={service} onConfigurationChange={refetch} />
        ),
        [ACCOUNTING_SERVICE_TABS.cashbacks]: (
            <CashbacksTab service={service} onConfigurationChange={refetch} />
        ),
        [ACCOUNTING_SERVICE_TABS.vendor]: <VendorTab service={service} onSave={updateVendor} />,
    }[activeTab];

    return (
        <div>
            <Breadcrumb
                className="mb-5 text-sm"
                items={[
                    { title: <Link to={paths.systemUser.accounting}>Accounting</Link> },
                    { title: <Link to={listPath}>{leafLabel}</Link> },
                    { title: <span className="text-brandColor">{service.serviceProvider}</span> },
                ]}
            />
            {body}
        </div>
    );
};

export default ServiceDetail;
