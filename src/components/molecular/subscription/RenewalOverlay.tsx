import { useEffect, useMemo, useState } from 'react';

import { Button, Flex, Spin, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';

import {
    PaidPlanExpiredRecently,
    PreviousSubscription,
} from '@src/domains/dashboard/IndividualPlan/types';
import useGetEmployeeCount from '@src/domains/dashboard/Payroll/hooks/dashboardHooks/useGetEmployeeCount';
import {
    getLifecycleSettings,
    LifecycleSettingsResponse,
} from '@src/domains/dashboard/settings/api/subscription';
import CancelSubscriptionModal from '@src/domains/dashboard/settings/components/subscription_plans/CancelSubscriptionModal';

import styles from './styles.module.css';

type LifecycleState = 'ACTIVE' | 'GRACE' | 'FROZEN' | 'CLEAR_ELIGIBLE' | 'NONE';
type LifecycleInfo = {
    state: LifecycleState;
    gracePeriodDays: number;
    frozenPeriodDays: number;
    payrollDataClearDays: number;
};

type Props = {
    children: any;
    subscriptionDetails: {
        isPurchased: boolean;
        previousSubscription: PreviousSubscription | null;
        lifecycle?: LifecycleInfo;
    };
    shouldBlockActions?: boolean;
    handleUpgrade: () => void;
    handleCancelSubscriptionPlan?: (subscriptionId: number) => Promise<boolean>;
    isLoading?: boolean;
    paidPlanExpiredRecently?: PaidPlanExpiredRecently | null;
    // Optional extra line in the frozen-state overlay copy. Used by surfaces with
    // service-specific data-loss warnings (e.g. Payroll: "your data will be cleared in N days").
    frozenExtraMessage?: string;
};

const RenewalOverlay = ({
    children,
    subscriptionDetails,
    handleCancelSubscriptionPlan,
    shouldBlockActions = true,
    handleUpgrade,
    isLoading,
    paidPlanExpiredRecently,
    frozenExtraMessage,
}: Props) => {
    const container = document.getElementById('myContainer');
    const breadcrumb = document.getElementById('custom-breadcrumb');
    const [cancelModal, setCancelModal] = useState(false);

    const { isPurchased, previousSubscription, lifecycle } = subscriptionDetails;

    // Banner shows on two signals:
    //  1. `previousSubscription` (legacy) — no active access for this service and a recent expiry exists.
    //  2. `paidPlanExpiredRecently` — a paid GROUP plan expired in the last 30 days, even if Peko Free
    //     is currently active. Lets addon landing pages still surface the renewal banner.
    const expiredSource: (PreviousSubscription | PaidPlanExpiredRecently) | null =
        previousSubscription ?? paidPlanExpiredRecently ?? null;
    const willAutoRenew = (expiredSource as PreviousSubscription | PaidPlanExpiredRecently | null)
        ?.willAutoRenew;
    const isNonRenewing = willAutoRenew === false;
    const isExpired = !!expiredSource && !isNonRenewing;
    // Lifecycle = FROZEN or CLEAR_ELIGIBLE → grace window has fully elapsed. UI is locked
    // behind a full-screen overlay with a "Subscribe" CTA, regardless of `shouldBlockActions`.
    const isFrozen =
        (lifecycle?.state === 'FROZEN' || lifecycle?.state === 'CLEAR_ELIGIBLE') && !isNonRenewing;
    // Pointer-events lock on the underlying content. Frozen state always blocks; grace-period
    // banner only blocks when the caller explicitly asks (legacy behaviour preserved).
    const blockingNow = isFrozen || (isExpired && shouldBlockActions && !isPurchased);

    const { packageName, subscriptionId, packageType } =
        (expiredSource as PreviousSubscription | PaidPlanExpiredRecently | null) ??
        ({} as Partial<PreviousSubscription>);
    const subscriptionEndDate =
        (expiredSource as PaidPlanExpiredRecently | null)?.subscriptionEndDate ?? null;

    const handleCancel = async () => {
        setCancelModal(false);
        if (handleCancelSubscriptionPlan && subscriptionId !== undefined) {
            await handleCancelSubscriptionPlan(subscriptionId);
        }
    };

    // Count is only used by the cancel modal, which is reachable only from the expired-plan banner.
    // Gate the call so corporates without payroll access (e.g. partner white-labels) don't hit
    // payroll on every dashboard load — that returns 004 and the API interceptor redirects to /404.
    const isGroupPlan = packageType === 'GROUP';
    const {
        count: employeeCount,
        hasCount,
        isLoading: isCountLoading,
    } = useGetEmployeeCount(isExpired && !isFrozen && isGroupPlan);

    // undefined = still loading, null = request failed.
    const [lifecycleSettings, setLifecycleSettings] = useState<
        LifecycleSettingsResponse | null | undefined
    >(undefined);
    useEffect(() => {
        let cancelled = false;
        getLifecycleSettings().then(res => {
            if (!cancelled) setLifecycleSettings(res || null);
        });
        return () => {
            cancelled = true;
        };
    }, []);

    // Warn only when the count exceeds the post-downgrade limit (then every employee is reset). When
    // the count or limit couldn't be resolved, still warn (never understate) but without a number.
    const freeEmployeeLimit = lifecycleSettings?.payrollFreeEmployeeLimit ?? null;
    const isCheckingPayroll = isGroupPlan && (isCountLoading || lifecycleSettings === undefined);
    const showPayrollWarning =
        isGroupPlan &&
        !isCheckingPayroll &&
        (!hasCount || freeEmployeeLimit === null || employeeCount > freeEmployeeLimit);

    const dataDeletionDate = useMemo(() => {
        if (!subscriptionEndDate || !lifecycleSettings) return null;
        const end = new Date(subscriptionEndDate);
        const totalDays =
            (lifecycleSettings.gracePeriodDays ?? 0) +
            (lifecycleSettings.frozenPeriodDays ?? 0) +
            (lifecycleSettings.payrollDataClearDays ?? 0);
        end.setDate(end.getDate() + totalDays);
        return end;
    }, [subscriptionEndDate, lifecycleSettings]);

    useEffect(() => {
        if (!container) return () => {};

        if (isExpired) {
            container.classList.remove('sm:pt-8');
            container.classList.add('relative', 'xs:pt-32', 'sm:pt-16');

            // if (shouldBlockActions) {
            //     container.classList.remove('bg-white');
            //     container.classList.add('bg-[#f2f2f2]');
            // }
            // footerContainer.style.backgroundColor = '#f2f2f2';
            // if (breadcrumb) {
            //     breadcrumb.style.backgroundColor = '#f2f2f2';
            // }
        }
        return () => {
            if (isExpired) {
                container.classList.remove('relative', 'xs:pt-32', 'sm:pt-16', 'bg-[#f2f2f2]');
                container.classList.add('sm:pt-8', 'bg-white');
                container.classList.add('sm:pt-8', 'bg-white');

                // footerContainer.style.removeProperty('background-color');
                // if (breadcrumb) {
                //     breadcrumb.style.removeProperty('background-color');
                // }
            }
        };
    }, [isExpired, container, breadcrumb, shouldBlockActions]);

    function capitalizeFirstLetter(str: string) {
        if (!str) return str;
        str = str.toLowerCase();
        if (str === 'esign') return 'eSign';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    return (
        <>
            {/* Frozen-state full-page overlay. Sits above the page content with a backdrop;
                only the Subscribe CTA is clickable. Activated when grace period has fully elapsed. */}
            {isFrozen && (
                <Flex
                    vertical
                    align="center"
                    justify="center"
                    gap={16}
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm px-6"
                    role="dialog"
                    aria-modal="true"
                >
                    <Flex
                        vertical
                        align="center"
                        gap={12}
                        className="bg-white rounded-2xl p-8 max-w-md text-center"
                    >
                        <Typography.Title level={4} className="!mb-0">
                            Your subscription has ended
                        </Typography.Title>
                        <Typography.Text>
                            {packageName
                                ? `Your ${capitalizeFirstLetter(packageName)} subscription is no longer active and the grace period has ended.`
                                : 'Your subscription is no longer active and the grace period has ended.'}{' '}
                            Subscribe again to restore access to your dashboard.
                        </Typography.Text>
                        {frozenExtraMessage && (
                            <Typography.Text type="danger" className="text-sm font-medium">
                                {frozenExtraMessage}
                            </Typography.Text>
                        )}
                        <Button type="primary" danger size="large" onClick={handleUpgrade} block>
                            Subscribe Now
                        </Button>
                    </Flex>
                </Flex>
            )}

            {/* Grace-period banner — non-blocking by default (caller can still interact with
                the page). Hidden once we move into FROZEN state, since the full-screen overlay
                above takes precedence. */}
            {isExpired && !isFrozen && (
                <Flex className="bg-[#DB372C] px-5 py-2 gap-5 sm:items-center mb-5 flex-col sm:flex-row absolute left-0 top-0 w-full">
                    <Typography.Text className="text-xs text-white">
                        {willAutoRenew ? (
                            <>
                                Your auto-renewal payment could not be processed after multiple
                                attempts. Please complete your payment by clicking &#39;Pay Now&#39;
                                to restore full access to the{' '}
                                {capitalizeFirstLetter(packageName ?? '')} service.
                            </>
                        ) : (
                            <>
                                Your {capitalizeFirstLetter(packageName ?? '')} subscription has
                                expired. Please upgrade to continue accessing premium features.
                            </>
                        )}
                    </Typography.Text>

                    <Flex className="gap-6">
                        <Button
                            size="small"
                            className={`text-white bg-inherit border-white rounded-[4px] hover:bg-none ${styles.removeHoverBg}`}
                            onClick={() => {
                                handleUpgrade();
                            }}
                        >
                            Pay Now
                        </Button>
                        {packageType === 'GROUP' && handleCancelSubscriptionPlan && (
                            <Button
                                size="small"
                                className={`text-white border-white w-1/2 bg-inherit rounded-[4px] hover:bg-none ${styles.removeHoverBg}`}
                                onClick={() => {
                                    setCancelModal(true);
                                }}
                            >
                                Cancel
                            </Button>
                        )}
                    </Flex>
                </Flex>
            )}
            <Content className={`${blockingNow ? 'pointer-events-none' : ''}`}>
                {isLoading && (
                    <Flex className="absolute inset-0 z-10 items-center justify-center bg-white bg-opacity-50">
                        <Spin />
                    </Flex>
                )}
                {children}
            </Content>
            {cancelModal && (
                <CancelSubscriptionModal
                    isOpen={cancelModal}
                    handleCancel={() => setCancelModal(false)}
                    handleSubmit={handleCancel}
                    isLoading={!!isLoading}
                    packageName={capitalizeFirstLetter(packageName ?? '') || 'this'}
                    employeeCount={hasCount ? employeeCount : null}
                    dataDeletionDate={dataDeletionDate}
                    showPayrollWarning={showPayrollWarning}
                    isCheckingPayroll={isCheckingPayroll}
                    freeEmployeeLimit={freeEmployeeLimit}
                />
            )}
        </>
    );
};

export default RenewalOverlay;
