import { ReactNode } from 'react';

import { ExclamationCircleOutlined, LinkOutlined } from '@ant-design/icons';
import { Button, Col, Flex, message, Modal, Row, Skeleton, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';

import { PARTNER_ID } from '@src/config-global';
import { paths } from '@src/routes/paths';

import ordersIcon from '../assets/icons/quick-actions/orders.svg';
import productsIcon from '../assets/icons/quick-actions/products.svg';
import publicStoreIcon from '../assets/icons/quick-actions/public-store.svg';
import revenueIcon from '../assets/icons/quick-actions/revenue.svg';
import storeAdminIcon from '../assets/icons/quick-actions/store-admin.svg';
import visitorsIcon from '../assets/icons/quick-actions/visitors.svg';
import QuickAccessCard from '../components/dashboard/QuickAccessCard';
import StatsCard from '../components/dashboard/StatsCard';
import StoreSetupModal from '../components/dashboard/StoreSetupModal';
import StoreSetupSidebar, { SetupStep } from '../components/dashboard/StoreSetupSidebar';
import { useCancelSubscription } from '../hooks/useCancelSubscription';
import { useTenantStats } from '../hooks/useTenantStats';

type LandingPageProps = {
    subscriptionData: {
        id: number;
        isPurchased: boolean;
        isCancelled: boolean;
        status: string;
        subscriptionEndDate: string;
        subscriptionStartDate: string;
        packageName: string;
        billingType: string;
        subscriptionAmountPaid: number;
    };
    onSubscriptionChange?: () => void;
};

const ActiveBadge = ({ label = 'Active' }: { label?: string }) => (
    <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-500 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <Typography.Text className="text-xs font-medium text-emerald-700 leading-none">
            {label}
        </Typography.Text>
    </div>
);

const InfoField = ({ label, value }: { label: string; value: ReactNode }) => (
    <Flex vertical gap={6} className="flex-1 bg-neutral-50 rounded-2xl px-4 py-3.5 min-h-[72px]">
        <Typography.Text className="text-sm text-gray-400">{label}</Typography.Text>
        <div className="text-base text-gray-900 font-medium">{value}</div>
    </Flex>
);

const SubscriptionField = ({ label, children }: { label: string; children: ReactNode }) => (
    <Flex vertical gap={10} className="min-w-[120px]">
        <Typography.Text className="text-sm text-neutral-400 tracking-wide">
            {label}
        </Typography.Text>
        <div className="text-base text-zinc-900 font-medium">{children}</div>
    </Flex>
);

const formatDate = (raw: string) => (raw ? moment(raw).format('DD MMM YYYY') : '—');
const formatNumber = (n: number | undefined | null) =>
    typeof n === 'number' ? new Intl.NumberFormat('en-IN').format(n) : '—';
const moneyAmount = (m: { amount?: string | number } | undefined | null) =>
    m?.amount != null ? Number(m.amount) : 0;
const moneyCurrency = (m: { currency?: string } | undefined | null) => m?.currency || 'INR';
const formatDelta = (a: number, b: number, prefix = '') => {
    const diff = (Number.isFinite(a) ? a : 0) - (Number.isFinite(b) ? b : 0);
    const sign = diff >= 0 ? '+' : '−';
    return `${sign}${prefix}${formatNumber(Math.abs(diff))}`;
};

const MoneyValue = ({
    money,
}: {
    money?: { amount?: string | number; currency?: string } | null;
}) => {
    const amount = formatNumber(moneyAmount(money));
    return moneyCurrency(money) === 'INR' ? (
        <span className="inline-flex items-center gap-1">₹{amount}</span>
    ) : (
        <span>
            {moneyCurrency(money)} {amount}
        </span>
    );
};

const LandingPage = ({ subscriptionData, onSubscriptionChange }: LandingPageProps) => {
    const navigate = useNavigate();
    const { cancelSubscription, isLoading: cancelLoading } = useCancelSubscription();
    const {
        tenant,
        orders,
        products,
        customers,
        isLoading: statsLoading,
        refetch: refetchStats,
    } = useTenantStats();
    const revenueCurrency = moneyCurrency(orders?.thisMonth.revenue);

    const storeSetupOpen = !statsLoading && tenant != null && !tenant.isSetupCompleted;

    const handleStoreSetupSuccess = () => {
        refetchStats();
    };

    const handleCancel = () => {
        if (!subscriptionData.id) return;
        Modal.confirm({
            title: 'Cancel subscription?',
            icon: <ExclamationCircleOutlined className="text-lightRed" />,
            content: (
                <Typography.Text className="text-sm text-gray-600">
                    Your store stays active until{' '}
                    <strong>{formatDate(subscriptionData.subscriptionEndDate)}</strong>. After that,
                    the plan won&apos;t auto-renew. You can resubscribe anytime.
                </Typography.Text>
            ),
            okText: 'Cancel subscription',
            okButtonProps: { danger: true, loading: cancelLoading },
            cancelText: 'Keep subscription',
            cancelButtonProps: { danger: true },
            onOk: async () => {
                const success = await cancelSubscription(subscriptionData.id);
                if (success) {
                    message.success(
                        'Subscription cancelled. Your plan stays active until the period ends.'
                    );
                    onSubscriptionChange?.();
                } else {
                    message.error('Could not cancel right now. Please try again.');
                }
            },
        });
    };

    const setupSteps: SetupStep[] = [
        { label: 'Store created', done: Boolean(tenant) },
        {
            label: 'Plan selected',
            sublabel: subscriptionData.packageName || undefined,
            done: Boolean(subscriptionData.packageName),
        },
        { label: 'Store URL ready', done: Boolean(tenant?.fullStoreUrl) },
        {
            label: 'Add your first product',
            done: Boolean(products && products.total > 0),
        },
        {
            label: 'Connect a payment gateway',
            done: Boolean(tenant && !tenant.checkoutDisabled),
        },
    ];

    const billingSuffix =
        (subscriptionData.billingType || '').toUpperCase() === 'ANNUALLY' ? '/year' : '/month';
    const planLine = subscriptionData.subscriptionAmountPaid
        ? `(₹${subscriptionData.subscriptionAmountPaid}${billingSuffix})`
        : '';

    if (statsLoading) {
        return (
            <Content className="mx-auto max-w-[1500px] px-4 py-6">
                <Skeleton active paragraph={{ rows: 12 }} />
            </Content>
        );
    }

    return (
        <Content className="mx-auto max-w-[1500px] px-4">
            <StoreSetupModal open={storeSetupOpen} onSuccess={handleStoreSetupSuccess} />
            <Flex vertical gap={28}>
                <Flex vertical gap={4}>
                    <Typography.Title level={2} className="!mb-0 !text-gray-900 !font-semibold">
                        Your Online Store is Ready to Set Up
                    </Typography.Title>
                    <Typography.Text className="text-lg text-gray-500">
                        Manage your subscription and access your store admin portal from here
                    </Typography.Text>
                </Flex>

                <Row gutter={[20, 20]}>
                    <Col xs={24} sm={12} xl={6}>
                        <StatsCard
                            bgClass="bg-orange-50"
                            icon={<img src={ordersIcon} alt="Orders" />}
                            value={formatNumber(orders?.total)}
                            label="Total Orders"
                            badge={{
                                text: orders
                                    ? `${formatNumber(orders.thisMonth.count)} this month`
                                    : '— this month',
                                tone: 'success',
                            }}
                        />
                    </Col>
                    <Col xs={24} sm={12} xl={6}>
                        <StatsCard
                            bgClass="bg-indigo-50"
                            icon={<img src={revenueIcon} alt="Revenue" />}
                            value={<MoneyValue money={orders?.thisMonth.revenue} />}
                            label="Revenue This Month"
                            badge={{
                                text: orders
                                    ? `${formatDelta(
                                          moneyAmount(orders.thisMonth.revenue),
                                          moneyAmount(orders.previousMonth.revenue),
                                          revenueCurrency === 'INR' ? '₹' : `${revenueCurrency} `
                                      )} vs last month`
                                    : '— vs last month',
                                tone: 'success',
                            }}
                        />
                    </Col>
                    <Col xs={24} sm={12} xl={6}>
                        <StatsCard
                            bgClass="bg-pink-100"
                            icon={<img src={productsIcon} alt="Products" />}
                            value={formatNumber(products?.active)}
                            label="Active Products"
                            badge={{
                                text: products
                                    ? `${formatNumber(products.outOfStock)} out of stock`
                                    : '— out of stock',
                                tone: 'warning',
                            }}
                        />
                    </Col>
                    <Col xs={24} sm={12} xl={6}>
                        <StatsCard
                            bgClass="bg-emerald-50"
                            icon={<img src={visitorsIcon} alt="Visitors" />}
                            value={formatNumber(customers?.total)}
                            label="Store Visitors"
                            badge={{ text: 'This month', tone: 'success' }}
                        />
                    </Col>
                </Row>

                <Row gutter={[24, 24]}>
                    <Col xs={24} xl={16}>
                        <Flex vertical gap={24}>
                            <Flex vertical gap={20}>
                                <Typography.Text className="text-2xl font-semibold text-black">
                                    Quick Access
                                </Typography.Text>
                                <Flex gap={20} className="flex-wrap">
                                    <QuickAccessCard
                                        icon={<img src={storeAdminIcon} alt="Store Admin" />}
                                        title="Open store admin"
                                        description="Manage product, orders and settings"
                                        onClick={() => {
                                            if (tenant?.tenantAdminLoginUrl) {
                                                const adminUrl = new URL(
                                                    tenant.tenantAdminLoginUrl
                                                );
                                                adminUrl.searchParams.set(
                                                    'registeredBy',
                                                    PARTNER_ID && PARTNER_ID !== 'null'
                                                        ? PARTNER_ID
                                                        : ''
                                                );
                                                window.open(
                                                    adminUrl.toString(),
                                                    '_blank',
                                                    'noopener,noreferrer'
                                                );
                                            }
                                        }}
                                    />
                                    <QuickAccessCard
                                        icon={<img src={publicStoreIcon} alt="Public Store" />}
                                        title="View public store"
                                        description="See how your store looks to customer"
                                        onClick={() => {
                                            if (tenant?.fullStoreUrl) {
                                                window.open(
                                                    tenant.fullStoreUrl,
                                                    '_blank',
                                                    'noopener,noreferrer'
                                                );
                                            }
                                        }}
                                    />
                                </Flex>
                            </Flex>

                            <div className="bg-white rounded-3xl shadow-[0_2px_13px_0_rgba(0,0,0,0.06)] overflow-hidden">
                                <div className="px-6 py-5 border-b border-stone-200">
                                    <Typography.Text className="text-xl font-medium text-black">
                                        Store details
                                    </Typography.Text>
                                </div>
                                <div className="p-6">
                                    <Flex vertical gap={16}>
                                        <Flex gap={16} className="flex-wrap">
                                            <InfoField
                                                label="Store Name"
                                                value={tenant?.storeName || '—'}
                                            />
                                            <InfoField
                                                label="Status"
                                                value={
                                                    <ActiveBadge
                                                        label={
                                                            tenant?.publishingEnabled &&
                                                            !tenant?.checkoutDisabled
                                                                ? 'Active'
                                                                : 'Inactive'
                                                        }
                                                    />
                                                }
                                            />
                                        </Flex>
                                        <Flex gap={16} className="flex-wrap">
                                            <InfoField
                                                label="Store URL"
                                                value={
                                                    tenant?.fullStoreUrl ? (
                                                        <span className="inline-flex items-center gap-2">
                                                            <a
                                                                href={`${tenant.fullStoreUrl}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-gray-900 underline hover:text-black"
                                                            >
                                                                {tenant.fullStoreUrl}
                                                            </a>
                                                            <LinkOutlined className="text-lightRed text-sm" />
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">—</span>
                                                    )
                                                }
                                            />
                                            <InfoField
                                                label="Custom Domain"
                                                value={
                                                    <span className="font-semibold">
                                                        {tenant?.customDomain?.verifiedAt
                                                            ? tenant.customDomain.domain
                                                            : 'Not Connected'}
                                                    </span>
                                                }
                                            />
                                        </Flex>
                                    </Flex>
                                </div>
                            </div>

                            <div className="bg-white rounded-3xl shadow-[0_2px_13px_0_rgba(0,0,0,0.06)] overflow-hidden">
                                <div className="px-6 py-5 border-b border-stone-200">
                                    <Typography.Text className="text-xl font-medium text-black">
                                        Subscription &amp; Billing
                                    </Typography.Text>
                                </div>
                                <div className="px-6 py-6">
                                    <Row gutter={[16, 32]}>
                                        <Col xs={24} sm={8}>
                                            <SubscriptionField label="Plan">
                                                <Flex vertical>
                                                    <span>
                                                        {subscriptionData.packageName || '—'}
                                                    </span>
                                                    {planLine && (
                                                        <span className="text-xs text-neutral-500">
                                                            {planLine}
                                                        </span>
                                                    )}
                                                </Flex>
                                            </SubscriptionField>
                                        </Col>
                                        <Col xs={24} sm={8}>
                                            <SubscriptionField label="Status">
                                                {subscriptionData.status ? (
                                                    <ActiveBadge
                                                        label={
                                                            subscriptionData.status
                                                                .charAt(0)
                                                                .toUpperCase() +
                                                            subscriptionData.status
                                                                .slice(1)
                                                                .toLowerCase()
                                                        }
                                                    />
                                                ) : (
                                                    '—'
                                                )}
                                            </SubscriptionField>
                                        </Col>
                                        <Col xs={24} sm={8}>
                                            <SubscriptionField label="Billing Cycle">
                                                {subscriptionData.billingType
                                                    ? subscriptionData.billingType
                                                          .charAt(0)
                                                          .toUpperCase() +
                                                      subscriptionData.billingType
                                                          .slice(1)
                                                          .toLowerCase()
                                                    : '—'}
                                            </SubscriptionField>
                                        </Col>
                                        <Col xs={24} sm={8}>
                                            <SubscriptionField label="Plan Started">
                                                {formatDate(subscriptionData.subscriptionStartDate)}
                                            </SubscriptionField>
                                        </Col>
                                        <Col xs={24} sm={8}>
                                            <SubscriptionField label="Valid Until">
                                                {formatDate(subscriptionData.subscriptionEndDate)}
                                            </SubscriptionField>
                                        </Col>
                                    </Row>
                                </div>
                                {!!subscriptionData.id && (
                                    <div className="px-6 py-4 border-t border-stone-200">
                                        <Flex justify="end" gap={12}>
                                            <Button
                                                danger
                                                className="!font-medium"
                                                onClick={handleCancel}
                                                loading={cancelLoading}
                                                disabled={subscriptionData.isCancelled}
                                            >
                                                {subscriptionData.isCancelled
                                                    ? 'Cancellation Scheduled'
                                                    : 'Cancel Subscription'}
                                            </Button>
                                            {!subscriptionData.isCancelled && (
                                                <Button
                                                    type="primary"
                                                    danger
                                                    className="!font-medium"
                                                    onClick={() =>
                                                        navigate(
                                                            `${paths.dashboard.ecommerce}/${paths.ecommerce.plan}`
                                                        )
                                                    }
                                                >
                                                    Upgrade Plan
                                                </Button>
                                            )}
                                        </Flex>
                                    </div>
                                )}
                            </div>
                        </Flex>
                    </Col>

                    <Col xs={24} xl={8}>
                        <StoreSetupSidebar steps={setupSteps} />
                    </Col>
                </Row>
            </Flex>
        </Content>
    );
};

export default LandingPage;
