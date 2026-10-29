import { memo, Suspense, useCallback, useEffect, useMemo, useState } from 'react';

import { CloseCircleOutlined } from '@ant-design/icons';
import { Button, Empty, Flex, Image, Row, Skeleton, Typography } from 'antd';
import { capitalize } from 'lodash';
import { Link, useNavigate } from 'react-router-dom';

import Logo from '@assets/mainLogo/Peko.png';
import useGetEmployeeCount from '@src/domains/dashboard/Payroll/hooks/dashboardHooks/useGetEmployeeCount';
import { PLAN_DETAILS_SESSION_KEY } from '@src/domains/dashboard/plans/utils';
import useUserInfo from '@src/hooks/useUserInfo';
import { paths } from '@src/routes/paths';
import { formattedDateWithDefault } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import TextCard from './billing_saved_cards/TextCard';
import CancelSubscriptionModal from './subscription_plans/CancelSubscriptionModal';
import ExpiredSubscriptionCard from './subscription_plans/ExpiredSubscriptionCard';
import {
    getIndividualPackagesPricing,
    getLifecycleSettings,
    IndividualPackagePricing,
    LifecycleSettingsResponse,
} from '../api/subscription';
import useCurrentSubscription from '../hooks/subscriptions/useCurrentSubscription';
import { ActiveSubscription, PackageStatus } from '../types/subscription';

const { Text } = Typography;

const SERVICE_MANAGEMENT_ROUTES: Record<string, string> = {
    ecommerce_store: paths.dashboard.ecommerce,
};

const SubscriptionPlans = () => {
    const initialValues = {
        page: 1,
        itemsPerPage: 1000,
        status: PackageStatus.Active,
    };
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);

    const [selectedPackage, setSelectedPackage] = useState<null | ActiveSubscription>(null);
    // const [pricingMap, setPricingMap] = useState<Record<number, IndividualPackagePricing>>({});
    // const [expandedPricingId, setExpandedPricingId] = useState<number | null>(null);
    const { isLoading, data, individualPackages, handleCancelSubscription } =
        useCurrentSubscription(initialValues);

    const navigate = useNavigate();
    const { getUserServicesData } = useUserInfo();

    useEffect(() => {
        let active = true;
        (async () => {
            const list = await getIndividualPackagesPricing();
            if (active) {
                const map: Record<number, IndividualPackagePricing> = {};
                list.forEach(pkg => {
                    map[pkg.id] = pkg;
                });
                // setPricingMap(map);
            }
        })();
        return () => {
            active = false;
        };
    }, []);

    const activeIndividualPackages = useMemo(
        () => individualPackages?.filter(pkg => pkg.status !== PackageStatus.Expired) || [],
        [individualPackages]
    );

    // A renewal creates a fresh ACTIVE cycle and marks the previous cycle EXPIRED, so a renewed
    // plan arrives as both rows. Surface the expired "renew" card only for lines that have genuinely
    // lapsed (no active cycle); when an active cycle exists for the same line the expired row is just
    // the prior cycle and must not show as a second, stale card. Key by package + isCustom — a
    // WhatsApp base plan and its add-on share a package id and differ only by isCustom — and keep
    // just the latest expired cycle per lapsed line.
    const expiredIndividualPackages = useMemo(() => {
        const lineKey = (pkg: ActiveSubscription) => `${pkg.package.id}-${pkg.isCustom ? 1 : 0}`;
        const activeLineKeys = new Set(activeIndividualPackages.map(lineKey));
        const latestExpiredByLine = new Map<string, ActiveSubscription>();
        (individualPackages || []).forEach(pkg => {
            if (pkg.status !== PackageStatus.Expired) return;
            const key = lineKey(pkg);
            if (activeLineKeys.has(key)) return;
            const existing = latestExpiredByLine.get(key);
            if (
                !existing ||
                new Date(pkg.subscriptionEndDate) > new Date(existing.subscriptionEndDate)
            ) {
                latestExpiredByLine.set(key, pkg);
            }
        });
        return Array.from(latestExpiredByLine.values());
    }, [individualPackages, activeIndividualPackages]);

    const handleCancelModal = () => {
        setOpenConfirmationModal(false);
        setSelectedPackage(null);
    };
    const handleOpenCancelModal = useCallback(
        (selected: ActiveSubscription) => {
            const managementRoute = SERVICE_MANAGEMENT_ROUTES[selected.package.accessCode || ''];
            if (managementRoute) {
                navigate(managementRoute);
                return;
            }
            setSelectedPackage(selected);
            setOpenConfirmationModal(true);
        },
        [navigate]
    );

    const handleConfirmation = useCallback(() => {
        handleCancelSubscription(selectedPackage?.id!).then(success => {
            setOpenConfirmationModal(false);
            getUserServicesData();
        });
    }, [selectedPackage, handleCancelSubscription, getUserServicesData]);

    // Payroll data-loss warning on cancel:
    // when cancelling a GROUP plan, any employees beyond the Peko Free limit will lose
    // payroll access at expiry. Surface this in the confirmation modal so the user
    // knows to buy addons instead of cancelling.
    // Only fetch once a GROUP plan's cancel modal is open — calling payroll for corporates
    // without payroll access returns 004 and the API interceptor hard-redirects to /404.
    const isCancellingGroupPlan =
        openConfirmationModal && selectedPackage?.package?.packageType === 'GROUP';
    const {
        count: employeeCount,
        hasCount,
        isLoading: isCountLoading,
    } = useGetEmployeeCount(isCancellingGroupPlan);

    // Lifecycle settings drive when payroll data is actually wiped. Backend formula is
    // subscriptionEndDate + gracePeriodDays + frozenPeriodDays + payrollDataClearDays.
    // Fetched once on mount. undefined = still loading, null = request failed.
    const [lifecycle, setLifecycle] = useState<LifecycleSettingsResponse | null | undefined>(
        undefined
    );
    useEffect(() => {
        let cancelled = false;
        getLifecycleSettings().then(res => {
            if (!cancelled) setLifecycle(res || null);
        });
        return () => {
            cancelled = true;
        };
    }, []);

    // Warn only when the count exceeds the post-downgrade limit (then every employee is reset). When
    // the count or limit couldn't be resolved, still warn (never understate) but without a number.
    const freeEmployeeLimit = lifecycle?.payrollFreeEmployeeLimit ?? null;
    const isCheckingPayroll = isCancellingGroupPlan && (isCountLoading || lifecycle === undefined);
    const showPayrollWarning =
        isCancellingGroupPlan &&
        !isCheckingPayroll &&
        (!hasCount || freeEmployeeLimit === null || employeeCount > freeEmployeeLimit);

    const dataDeletionDate = useMemo(() => {
        if (!selectedPackage?.subscriptionEndDate || !lifecycle) return null;
        const end = new Date(selectedPackage.subscriptionEndDate);
        const totalDays =
            (lifecycle.gracePeriodDays ?? 0) +
            (lifecycle.frozenPeriodDays ?? 0) +
            (lifecycle.payrollDataClearDays ?? 0);
        end.setDate(end.getDate() + totalDays);
        return end;
    }, [selectedPackage, lifecycle]);

    // const featuresArray = useMemo(() => data?.package.description?.split('\n') || [], [data]);

    if (isLoading) {
        return (
            <Row
                className="h-full mt-8 rounded-md"
                justify="center"
                align="middle"
                gutter={[0, 20]}
            >
                <Skeleton active />
            </Row>
        );
    }
    if (!data && (!individualPackages || individualPackages.length === 0)) {
        return (
            <Row
                className="h-full mt-8 rounded-md "
                justify="center"
                align="middle"
                gutter={[0, 20]}
            >
                <Empty description="No Plans Available" />
            </Row>
        );
    }
    return (
        <>
            <Row
                className="h-full rounded-md sm:mt-4 "
                justify="center"
                align="middle"
                gutter={[0, 20]}
            >
                {data && (
                    <>
                        <Flex
                            className="flex-col w-full h-full p-8 border border-gray-200 border-solid md:flex-row rounded-2xl xs:bg-bgLightGray md:bg-white"
                            justify="space-between"
                            align="start"
                            gap={60}
                        >
                            <Flex>
                                <Image
                                    src={data?.package?.packageLogo || Logo}
                                    preview={false}
                                    width={130}
                                />
                            </Flex>
                            <Flex className="flex flex-1">
                                <Row gutter={[10, 20]} className="w-full">
                                    <Row>
                                        <Text className="text-xl font-medium">
                                            {data?.package?.packageName} (
                                            {capitalize(data?.billingType)})
                                        </Text>
                                    </Row>
                                    <Row
                                        justify="start"
                                        className="w-full gap-16 xl:gap-32"
                                        gutter={[0, 30]}
                                    >
                                        <TextCard
                                            label="Total Amount (incl. GST)"
                                            value={`₹ ${formatNumberWithLocalString(data.subscriptionAmountPaid)}`}
                                        />
                                        <TextCard label="Status" value={capitalize(data.status)} />
                                        <TextCard
                                            label="Plan Started"
                                            value={formattedDateWithDefault(
                                                new Date(data.subscriptionStartDate)
                                            )}
                                        />
                                        <TextCard
                                            label="Valid Until"
                                            value={formattedDateWithDefault(
                                                new Date(data.subscriptionEndDate)
                                            )}
                                        />
                                        {/* {!data.isCancelled && (
                                            <TextCard label="Payment Mode" value="Auto" />
                                        )} */}
                                    </Row>
                                </Row>
                            </Flex>
                            <Flex justify="end" vertical gap={20} align="center">
                                {!data.isTopMostPlan && (
                                    <Link to={`/${paths.plans.index}`}>
                                        <Button danger className="text-xs font-medium">
                                            Upgrade Plan
                                        </Button>
                                    </Link>
                                )}

                                {/* Upgrade to Annual — group base plan on monthly billing; mirrors
                                    the individual-plan button below (28295). */}
                                {data.billingType === 'MONTHLY' && !data.isCancelled && (
                                    <Button
                                        danger
                                        className="text-xs font-medium"
                                        onClick={() => {
                                            sessionStorage.setItem(
                                                PLAN_DETAILS_SESSION_KEY,
                                                JSON.stringify({
                                                    url: window.location.href,
                                                    service: data.package.packageName,
                                                    planId: data.package.id,
                                                    selectedType: 'annually',
                                                    isAddOns: false,
                                                })
                                            );
                                            navigate(
                                                `/${paths.plans.index}/${paths.plans.reviewOrder}`,
                                                { state: { isSettingsPage: true } }
                                            );
                                        }}
                                    >
                                        Upgrade to Annually
                                    </Button>
                                )}

                                <Flex vertical gap={12} align="center">
                                    <Link to={`/${paths.plans.index}`}>
                                        <Button
                                            danger
                                            size="small"
                                            className="!h-10 rounded-lg font-normal"
                                        >
                                            View Plans
                                        </Button>
                                    </Link>
                                    {data.isCancelled ? (
                                        <Text className="text-red-700 cursor-default">
                                            Cancellation effective on{' '}
                                            {formattedDateWithDefault(
                                                new Date(data.subscriptionEndDate)
                                            )}
                                        </Text>
                                    ) : (
                                        <Text
                                            onClick={() => handleOpenCancelModal(data)}
                                            className="text-red-700 cursor-pointer"
                                        >
                                            <CloseCircleOutlined className="pe-2" />
                                            Cancel my plan
                                        </Text>
                                    )}
                                </Flex>
                            </Flex>
                        </Flex>
                        {/* <ListPoints //26478
                            title="Services"
                            items={servicesArray}
                            showTicks
                            itemsPerColumn={4}
                        /> */}

                        {/* <ListPoints //26657
                            title="Features"
                            items={featuresArray}
                            showTicks={false}
                            itemsPerColumn={featuresArray.length}
                        /> */}
                    </>
                )}
                {activeIndividualPackages &&
                    activeIndividualPackages.length > 0 &&
                    activeIndividualPackages.map(individualPlan => (
                        <Flex
                            key={individualPlan.id}
                            className="flex-col w-full h-full p-8 px-10 border border-gray-200 border-solid md:flex-row rounded-2xl xs:bg-bgLightGray md:bg-white"
                            justify="space-between"
                            align="center"
                            gap={60}
                        >
                            <Flex className="flex flex-1">
                                <Row gutter={[10, 20]} className="w-full">
                                    <Row>
                                        <Text className="text-xl font-medium">
                                            {individualPlan.isCustom
                                                ? `${individualPlan.package.packageName} - Add on `
                                                : individualPlan.package.packageName}{' '}
                                            ({capitalize(individualPlan.billingType)})
                                        </Text>
                                    </Row>
                                    <Row className="w-full">
                                        <Flex
                                            // wrap="wrap"
                                            justify="start"
                                            className="flex-wrap w-full gap-10 xl:gap-24 xxl:flex-nowrap"
                                        >
                                            <TextCard
                                                label="Total Amount (incl. GST)"
                                                value={`₹ ${formatNumberWithLocalString(individualPlan.subscriptionAmountPaid)}`}
                                            />
                                            <TextCard
                                                label="Status"
                                                value={capitalize(individualPlan.status)}
                                            />
                                            <Flex className="w-32">
                                                <TextCard
                                                    label="Plan Started"
                                                    value={formattedDateWithDefault(
                                                        new Date(
                                                            individualPlan.subscriptionStartDate
                                                        )
                                                    )}
                                                />
                                            </Flex>
                                            <Flex className="w-32">
                                                <TextCard
                                                    label="Valid Until"
                                                    value={formattedDateWithDefault(
                                                        new Date(individualPlan.subscriptionEndDate)
                                                    )}
                                                />
                                            </Flex>
                                            {!individualPlan.isCancelled && (
                                                <TextCard label="Payment Mode" value="Auto" />
                                            )}
                                        </Flex>
                                    </Row>
                                    {/* <Row className="w-full">
                                        <Flex vertical gap={8} className="w-full">
                                            <Text
                                                onClick={() =>
                                                    setExpandedPricingId(prev =>
                                                        prev === individualPlan.id
                                                            ? null
                                                            : individualPlan.id
                                                    )
                                                }
                                                className="text-lightRed cursor-pointer text-sm font-medium w-fit"
                                            >
                                                {expandedPricingId === individualPlan.id
                                                    ? 'Hide unit price & base limit'
                                                    : 'View unit price & base limit'}
                                            </Text>
                                            {expandedPricingId === individualPlan.id && (
                                                <Flex gap={40} className="flex-wrap">
                                                    <TextCard
                                                        label="Base Limit"
                                                        value={
                                                            pricingMap[individualPlan.package.id]
                                                                ?.baseLimit != null
                                                                ? `${pricingMap[individualPlan.package.id]?.baseLimit} units`
                                                                : 'N/A'
                                                        }
                                                    />
                                                    <TextCard
                                                        label="Unit Price"
                                                        value={
                                                            pricingMap[individualPlan.package.id]
                                                                ?.unitPrice != null
                                                                ? `₹ ${formatNumberWithLocalString(
                                                                      pricingMap[
                                                                          individualPlan.package.id
                                                                      ]?.unitPrice as string
                                                                  )}`
                                                                : 'N/A'
                                                        }
                                                    />
                                                </Flex>
                                            )}
                                        </Flex>
                                    </Row> */}
                                </Row>
                            </Flex>
                            <Flex
                                justify="end"
                                vertical
                                gap={20}
                                align="center"
                                className="min-w-40"
                            >
                                {/* Upgrade to Annual — individual à-la-carte base plans on monthly billing.
                                    A different billing cycle isn't a duplicate, so the create-order flow
                                    allows it; the review-order back button returns here (isSettingsPage). */}
                                {individualPlan.billingType === 'MONTHLY' &&
                                    !individualPlan.isCustom &&
                                    individualPlan.tableName === 'subscription' &&
                                    !individualPlan.isCancelled && (
                                        <Button
                                            danger
                                            className="text-xs font-medium"
                                            onClick={() => {
                                                sessionStorage.setItem(
                                                    PLAN_DETAILS_SESSION_KEY,
                                                    JSON.stringify({
                                                        url: window.location.href,
                                                        service: individualPlan.package.packageName,
                                                        planId: individualPlan.package.id,
                                                        selectedType: 'annually',
                                                        isAddOns: false,
                                                    })
                                                );
                                                navigate(
                                                    `/${paths.plans.index}/${paths.plans.reviewOrder}`,
                                                    { state: { isSettingsPage: true } }
                                                );
                                            }}
                                        >
                                            Upgrade to Annually
                                        </Button>
                                    )}
                                {individualPlan.isCancelled ? (
                                    <Text className="text-red-700 cursor-default">
                                        Cancellation effective on{' '}
                                        {formattedDateWithDefault(
                                            new Date(individualPlan.subscriptionEndDate)
                                        )}
                                    </Text>
                                ) : (
                                    <Text
                                        onClick={() => handleOpenCancelModal(individualPlan)}
                                        className="text-red-700 cursor-pointer"
                                    >
                                        <CloseCircleOutlined className="pe-2" />
                                        Cancel my plan
                                    </Text>
                                )}
                            </Flex>
                        </Flex>
                    ))}

                {expiredIndividualPackages.map(individualPlan => (
                    <ExpiredSubscriptionCard
                        key={individualPlan.id}
                        plan={individualPlan}
                        onCancel={handleOpenCancelModal}
                    />
                ))}
            </Row>
            {openConfirmationModal && (
                <Suspense fallback={<Skeleton />}>
                    <CancelSubscriptionModal
                        isOpen={openConfirmationModal}
                        handleCancel={handleCancelModal}
                        handleSubmit={handleConfirmation}
                        isLoading={isLoading!}
                        packageName={selectedPackage?.package?.packageName ?? 'this'}
                        employeeCount={hasCount ? employeeCount : null}
                        dataDeletionDate={dataDeletionDate}
                        accessEndDate={
                            selectedPackage?.subscriptionEndDate
                                ? new Date(selectedPackage.subscriptionEndDate)
                                : null
                        }
                        showPayrollWarning={showPayrollWarning}
                        isCheckingPayroll={isCheckingPayroll}
                        freeEmployeeLimit={freeEmployeeLimit}
                    />
                </Suspense>
            )}
        </>
    );
};

export default memo(SubscriptionPlans);
