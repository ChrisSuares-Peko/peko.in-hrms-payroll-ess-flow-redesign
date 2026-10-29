import { ReactNode } from 'react';

import { CalendarOutlined, ReloadOutlined } from '@ant-design/icons';
import { Alert, Button, Col, Flex, Row, Skeleton, Tooltip, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import ordersIcon from '../assets/icons/quick-actions/orders.svg';
import productsIcon from '../assets/icons/quick-actions/products.svg';
import revenueIcon from '../assets/icons/quick-actions/revenue.svg';
import storeAdminIcon from '../assets/icons/quick-actions/store-admin.svg';
import QuickAccessCard from '../components/dashboard/QuickAccessCard';
import RestaurantSetupSidebar, { SetupStep } from '../components/dashboard/RestaurantSetupSidebar';
import StatsCard from '../components/dashboard/StatsCard';
import StatusBadge from '../components/dashboard/StatusBadge';
import useRestaurant from '../hooks/useRestaurant';
import { RestaurantInfo } from '../types';

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

const SectionCard = ({
    title,
    extra,
    children,
    footer,
}: {
    title: string;
    extra?: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
}) => (
    <div className="bg-white rounded-3xl shadow-[0_2px_13px_0_rgba(0,0,0,0.06)] overflow-hidden">
        <Flex
            justify="space-between"
            align="center"
            gap={12}
            className="px-6 py-5 border-b border-stone-200"
        >
            <Typography.Text className="text-xl font-medium text-black">{title}</Typography.Text>
            {extra}
        </Flex>
        <div className="p-6">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-stone-200">{footer}</div>}
    </div>
);

const formatDate = (raw?: string | null) => (raw ? moment(raw).format('DD MMM YYYY') : '—');
const formatNumber = (n: number | undefined | null) =>
    typeof n === 'number' ? new Intl.NumberFormat('en-IN').format(n) : '—';
const titleCase = (raw?: string | null) =>
    raw ? raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase() : '—';

const formatAddress = (address: RestaurantInfo['address']) => {
    if (!address) return null;
    if (typeof address === 'string') return address.trim() || null;
    const parts = Object.values(address).filter(Boolean);
    return parts.length ? parts.join(', ') : null;
};

const daysUntil = (raw?: string | null) => {
    if (!raw) return null;
    const diff = moment(raw).endOf('day').diff(moment().startOf('day'), 'days');
    return Number.isFinite(diff) ? Math.max(diff, 0) : null;
};

const PosDashboard = () => {
    const navigate = useNavigate();
    const { roleName } = useAppSelector(state => state.reducer.auth);
    const { restaurant, subscription, ssoUrl, vendorError, isProvisioning, isLoading, refetch } =
        useRestaurant();

    const isSubUser = roleName === 'corporate sub user';
    const isActive = restaurant?.status === 'active';
    const canOpenAdmin = isActive && Boolean(ssoUrl);
    const isBlocked = restaurant?.status === 'suspended' || restaurant?.status === 'rejected';

    const daysLeft = daysUntil(subscription?.subscriptionEndDate);
    const billingSuffix =
        (subscription?.billingType || '').toUpperCase() === 'ANNUALLY' ? '/year' : '/month';
    const planLine = subscription?.subscriptionAmountPaid
        ? `(₹${formatNumber(subscription.subscriptionAmountPaid)}${billingSuffix})`
        : '';

    const setupSteps: SetupStep[] = [
        {
            label: 'Plan purchased',
            sublabel: subscription?.packageName || undefined,
            done: Boolean(subscription?.packageName),
        },
        { label: 'Restaurant created', done: Boolean(restaurant) },
        { label: 'Approved by POS partner', done: isActive },
        { label: 'Store admin ready', done: canOpenAdmin },
    ];

    if (isLoading) {
        return (
            <Content className="mx-auto max-w-[1500px] px-4 py-6">
                <Skeleton active paragraph={{ rows: 12 }} />
            </Content>
        );
    }

    const heading = (() => {
        if (isBlocked) return 'Your Restaurant Needs Attention';
        if (isProvisioning) return 'Your Restaurant Is Being Set Up';
        return 'Your Peko POS Is Ready';
    })();

    const statusBadge = (() => {
        if (!restaurant) return { text: 'Setting up', tone: 'neutral' as const };
        if (restaurant.isAwaitingApproval)
            return { text: 'Awaiting approval', tone: 'warning' as const };
        if (isBlocked) return { text: 'Action needed', tone: 'warning' as const };
        return { text: 'Live', tone: 'success' as const };
    })();

    const validityBadge =
        daysLeft == null
            ? { text: '— days left', tone: 'neutral' as const }
            : {
                  text: `${formatNumber(daysLeft)} ${daysLeft === 1 ? 'day' : 'days'} left`,
                  tone: daysLeft <= 14 ? ('warning' as const) : ('success' as const),
              };

    return (
        <Content className="mx-auto max-w-[1500px] px-4">
            <Flex vertical gap={28}>
                <Flex vertical gap={4}>
                    <Typography.Title level={2} className="!mb-0 !text-gray-900 !font-semibold">
                        {heading}
                    </Typography.Title>
                    <Typography.Text className="text-lg text-gray-500">
                        Manage your subscription and open your store admin from here
                    </Typography.Text>
                </Flex>

                {restaurant?.isAwaitingApproval && (
                    <Alert
                        type="warning"
                        showIcon
                        className="rounded-2xl"
                        message="Awaiting approval from our POS partner"
                        description="This usually takes up to 48 hours. We will email you the moment your restaurant is live — the store admin unlocks automatically."
                        action={
                            <Button size="small" icon={<ReloadOutlined />} onClick={refetch}>
                                Refresh
                            </Button>
                        }
                    />
                )}

                {isBlocked && (
                    <Alert
                        type="error"
                        showIcon
                        className="rounded-2xl"
                        message="Your restaurant is not currently active"
                        description="Please contact support so we can look into it for you."
                    />
                )}

                {vendorError && (
                    <Alert
                        type="warning"
                        showIcon
                        className="rounded-2xl"
                        message="We could not load your restaurant details right now"
                        description="Your subscription details below are up to date. Please try again in a moment."
                        action={
                            <Button size="small" icon={<ReloadOutlined />} onClick={refetch}>
                                Retry
                            </Button>
                        }
                    />
                )}

                <Row gutter={[20, 20]}>
                    <Col xs={24} sm={12} xl={6}>
                        <StatsCard
                            bgClass="bg-orange-50"
                            icon={<img src={productsIcon} alt="Restaurant" />}
                            value={restaurant?.name || '—'}
                            label="Restaurant"
                            badge={statusBadge}
                        />
                    </Col>
                    <Col xs={24} sm={12} xl={6}>
                        <StatsCard
                            bgClass="bg-indigo-50"
                            icon={<img src={ordersIcon} alt="Plan" />}
                            value={subscription?.packageName || '—'}
                            label="Current Plan"
                            badge={{
                                text: subscription?.billingType
                                    ? titleCase(subscription.billingType)
                                    : '—',
                                tone: 'neutral',
                            }}
                        />
                    </Col>
                    <Col xs={24} sm={12} xl={6}>
                        <StatsCard
                            bgClass="bg-emerald-50"
                            icon={<CalendarOutlined />}
                            value={formatDate(subscription?.subscriptionEndDate)}
                            label="Valid Until"
                            badge={validityBadge}
                        />
                    </Col>
                    <Col xs={24} sm={12} xl={6}>
                        <StatsCard
                            bgClass="bg-pink-100"
                            icon={<img src={revenueIcon} alt="Amount paid" />}
                            value={
                                subscription?.subscriptionAmountPaid != null
                                    ? `₹${formatNumber(subscription.subscriptionAmountPaid)}`
                                    : '—'
                            }
                            label="Amount Paid"
                            badge={{ text: 'One-time', tone: 'neutral' }}
                        />
                    </Col>
                </Row>

                <Row gutter={[24, 24]}>
                    <Col xs={24} xl={16}>
                        <Flex vertical gap={24}>
                            {!isSubUser && (
                                <Flex vertical gap={20}>
                                    <Typography.Text className="text-2xl font-semibold text-black">
                                        Quick Access
                                    </Typography.Text>
                                    <Flex gap={20} className="flex-wrap">
                                        <Tooltip
                                            title={
                                                canOpenAdmin
                                                    ? ''
                                                    : 'Available once your restaurant is approved by our POS partner'
                                            }
                                        >
                                            <span className="flex flex-1 min-w-[280px]">
                                                <QuickAccessCard
                                                    icon={
                                                        <img
                                                            src={storeAdminIcon}
                                                            alt="Store Admin"
                                                        />
                                                    }
                                                    title="Open store admin"
                                                    description="Manage menu, orders, tables and staff"
                                                    highlighted={canOpenAdmin}
                                                    disabled={!canOpenAdmin}
                                                    onClick={() => {
                                                        if (!ssoUrl) return;
                                                        window.open(
                                                            ssoUrl,
                                                            '_blank',
                                                            'noopener,noreferrer'
                                                        );
                                                    }}
                                                />
                                            </span>
                                        </Tooltip>
                                    </Flex>
                                </Flex>
                            )}

                            <SectionCard
                                title="Restaurant details"
                                extra={<StatusBadge status={restaurant?.status} />}
                            >
                                <Flex vertical gap={16}>
                                    <Flex gap={16} className="flex-wrap">
                                        <InfoField
                                            label="Restaurant Name"
                                            value={restaurant?.name || '—'}
                                        />
                                        <InfoField
                                            label="POS Plan"
                                            value={restaurant?.plan?.name || '—'}
                                        />
                                    </Flex>
                                    <Flex gap={16} className="flex-wrap">
                                        <InfoField
                                            label="Store URL"
                                            value={
                                                restaurant?.slug ? (
                                                    <span className="break-all">
                                                        {restaurant.slug}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )
                                            }
                                        />
                                        <InfoField
                                            label="Restaurant ID"
                                            value={
                                                restaurant?.id ? (
                                                    <span className="break-all">
                                                        {restaurant.id}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )
                                            }
                                        />
                                    </Flex>
                                    <Flex gap={16} className="flex-wrap">
                                        <InfoField label="Email" value={restaurant?.email || '—'} />
                                        <InfoField label="Phone" value={restaurant?.phone || '—'} />
                                    </Flex>
                                    <Flex gap={16} className="flex-wrap">
                                        <InfoField
                                            label="Address"
                                            value={
                                                formatAddress(restaurant?.address) || (
                                                    <span className="text-gray-400">
                                                        Not added yet — set this in your store admin
                                                    </span>
                                                )
                                            }
                                        />
                                    </Flex>
                                </Flex>
                            </SectionCard>

                            <SectionCard
                                title="Subscription & Billing"
                                footer={
                                    <Flex justify="end">
                                        <Button
                                            type="primary"
                                            danger
                                            className="!font-medium"
                                            onClick={() =>
                                                navigate(
                                                    `${paths.dashboard.pekoPos}/${paths.pekoPos.plan}`
                                                )
                                            }
                                        >
                                            Change Plan
                                        </Button>
                                    </Flex>
                                }
                            >
                                <Row gutter={[16, 32]}>
                                    <Col xs={24} sm={8}>
                                        <SubscriptionField label="Plan">
                                            <Flex vertical>
                                                <span>{subscription?.packageName || '—'}</span>
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
                                            {subscription?.status ? (
                                                <StatusBadge
                                                    label={titleCase(subscription.status)}
                                                    tone={
                                                        subscription.status === 'ACTIVE'
                                                            ? 'success'
                                                            : 'neutral'
                                                    }
                                                />
                                            ) : (
                                                '—'
                                            )}
                                        </SubscriptionField>
                                    </Col>
                                    <Col xs={24} sm={8}>
                                        <SubscriptionField label="Billing Cycle">
                                            {titleCase(subscription?.billingType)}
                                        </SubscriptionField>
                                    </Col>
                                    <Col xs={24} sm={8}>
                                        <SubscriptionField label="Plan Started">
                                            {formatDate(subscription?.subscriptionStartDate)}
                                        </SubscriptionField>
                                    </Col>
                                    <Col xs={24} sm={8}>
                                        <SubscriptionField label="Valid Until">
                                            {formatDate(subscription?.subscriptionEndDate)}
                                        </SubscriptionField>
                                    </Col>
                                    <Col xs={24} sm={8}>
                                        <SubscriptionField label="Renewal">
                                            <span className="text-neutral-600">
                                                Manual — no auto-renewal
                                            </span>
                                        </SubscriptionField>
                                    </Col>
                                </Row>
                            </SectionCard>
                        </Flex>
                    </Col>

                    <Col xs={24} xl={8}>
                        <RestaurantSetupSidebar steps={setupSteps} />
                    </Col>
                </Row>
            </Flex>
        </Content>
    );
};

export default PosDashboard;
