/* eslint-disable react/no-unescaped-entities */
import { lazy, Suspense, useRef, useState } from 'react';

import { Col, Flex, Row, Spin, Tour, Typography } from 'antd';
import { TourProps } from 'antd/lib';
import { useNavigate } from 'react-router-dom';

import MobileNav from '@components/molecular/nav-section/mobile-nav/MobileNav';
import ServiceSearch from '@components/molecular/searchTree/ServiceSearch';
import RenewalOverlay from '@components/molecular/subscription/RenewalOverlay';
import { PLAN_DETAILS_SESSION_KEY } from '@domains/dashboard/plans/utils';
import { useAppSelector } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';
import { paths } from '@src/routes/paths';

import MobileHome from './MobileHome';
import GSTVerifyComponent from './VerifyGstandPan';
import AlertsList from '../components/AlertsList';
import Headers from '../components/headers/Headers';
import PekoCreditsAdaptive from '../components/PekoCreditsAdaptive';
import PekoUpgradePlanAdaptive from '../components/PekoUpgradePlanAdaptive';
import PriceInfoList from '../components/PriceInfoList';
import useChartApi from '../hooks/useChartApi';
import useEnableProductTour from '../hooks/useEnableProductTour';
import useSubscriptionDetails from '../hooks/useSubscriptionDetails';

const DashboardBussinessCardList = lazy(() => import('../components/DashboardBussinessCardLIst'));
const RecentTransactionsList = lazy(() => import('../components/RecentTransactionsList'));
const QuickActionsList = lazy(() => import('../components/QuickActionsList'));
const TotalSpent = lazy(() => import('../components/TotalSpent'));

const { Text } = Typography;

const Home = () => {
    const { data, filters, isLoading } = useChartApi();

    const { roleName } = useAppSelector(state => state.reducer.auth);
    const { xs, md, lg } = useScreenSize();

    const monthlySpends = useRef(null);
    const totalTransactions = useRef(null);
    const totalSpends = useRef(null);
    const alerts = useRef(null);
    const recentTransactions = useRef(null);
    const quickActions = useRef(null);
    const chartRef = useRef(null);
    const { handleUpdateTour } = useEnableProductTour();
    const { user } = useAppSelector(state => state.reducer.user);
    const [open, setOpen] = useState<boolean>(true);
    const navigate = useNavigate();

    const { subscriptionDetails, handleCancelSubscriptionPlan, isLoader } =
        useSubscriptionDetails();
    const [skipVerification, setSkipVerification] = useState(false);

    const handleSkipVerification = () => {
        setSkipVerification(true);
    };
    const { services } = useAppSelector(state => state.reducer.services);
    if (roleName && roleName === 'corporate sub user') {
        const firstRoute = services?.data.find(obj => obj.hasAccess === true);
        navigate(`/${firstRoute!.label.toLowerCase().replace(' ', '-')}`);
        return null;
    }
    const steps: TourProps['steps'] = [
        {
            title: 'Welcome to Peko, Ready to take a spin?',
            placement: 'center',
            description: (
                <Text className="font-light text-white">
                    Dive into Peko with this interactive demo showcasing the platform's key
                    features.You can either follow our guided tour or close the product tour by
                    clicking close button on the top right corner. Click next to continue.
                </Text>
            ),
        },
        {
            title: "Current Month's Spend",
            description: (
                <Text className="font-light text-white">
                    Get a quick look at your current month's spend.
                </Text>
            ),
            target: () => monthlySpends.current,
        },
        {
            title: 'Total Transactions',
            description: (
                <Text className="font-light text-white">
                    Track your total transactions over time.
                </Text>
            ),
            target: () => totalTransactions.current,
        },
        {
            title: 'Total Spend',
            description: (
                <Text className="font-light text-white">
                    Track your total expenditures over here.
                </Text>
            ),
            target: () => totalSpends.current,
        },
        {
            title: 'Important Alerts ',
            description: (
                <Text className="font-light text-white">
                    Stay informed about important notifications.
                </Text>
            ),
            target: () => alerts.current,
        },
        {
            title: 'Recent transactions',
            description: (
                <Text className="font-light text-white">
                    Take a quick look at your most recent transactions here.
                </Text>
            ),
            target: () => recentTransactions.current,
            placement: 'top',
        },
        {
            title: 'Quick Actions',
            description: (
                <Text className="font-light text-white">Access main services with one click.</Text>
            ),
            target: () => quickActions.current,
        },
        {
            title: 'Total Spending',
            description: (
                <Text className="font-light text-white">
                    Get a graphical view of your total spending.
                </Text>
            ),
            target: () => chartRef.current,
            placement: 'top',
        },
    ];
    if ((user?.panVerified === '' || user?.gstVerified === '') && !skipVerification) {
        return <GSTVerifyComponent onSkip={handleSkipVerification} />;
    }

    const items = lg ? steps : steps.filter(item => item.title !== 'Total Spent');

    // The renewal overlay is a RENEWAL of the existing/expired plan, not a new purchase — so send
    // the user straight to the review-order page pre-filled with that plan (ReviewOrder reads this
    // from PLAN_DETAILS_SESSION_KEY) instead of the plans listing. Fall back to the plans page only
    // if the expired plan id isn't available.
    const handleUpgrade = () => {
        const prev = subscriptionDetails?.previousSubscription;
        if (prev?.packageId) {
            sessionStorage.setItem(
                PLAN_DETAILS_SESSION_KEY,
                JSON.stringify({
                    url: window.location.href.split('?')[0],
                    service: prev.packageName,
                    planId: prev.packageId,
                    selectedType: prev.billingType === 'ANNUALLY' ? 'annually' : 'monthly',
                    isAddOns: false,
                })
            );
            navigate(`/${paths.plans.index}/${paths.plans.reviewOrder}`);
            return;
        }
        navigate('/plans');
    };

    return (
        <RenewalOverlay
            subscriptionDetails={subscriptionDetails}
            handleCancelSubscriptionPlan={handleCancelSubscriptionPlan}
            shouldBlockActions={false}
            isLoading={isLoader}
            handleUpgrade={handleUpgrade}
        >
            <Row className={xs ? 'mt-2' : ''}>
                {xs ? (
                    <MobileHome />
                ) : (
                    <>
                        <Flex className="w-full myHomeSearchClass mb-5">
                            <ServiceSearch variant="filled" />
                        </Flex>
                        <Col
                            className="w-full xl:pr-8 gutter-row "
                            xs={24}
                            md={24}
                            lg={24}
                            xl={17}
                            xxl={16}
                        >
                            <Headers />
                            <Flex vertical className="w-full mt-5 lg:hidden">
                                <PekoUpgradePlanAdaptive />
                                <PekoCreditsAdaptive />
                            </Flex>
                            <Flex vertical gap={25} className="w-full ">
                                <PriceInfoList
                                    monthlySpends={monthlySpends}
                                    totalTransactions={totalTransactions}
                                    totalSpends={totalSpends}
                                />
                                <Flex
                                    justify="center"
                                    align="center"
                                    className="w-full xs:flex lg:hidden"
                                >
                                    <MobileNav />
                                </Flex>
                                {xs ? (
                                    <Flex className="xs:hidden md:flex">
                                        <QuickActionsList />
                                    </Flex>
                                ) : (
                                    <QuickActionsList quickAction={quickActions} />
                                )}
                                <Suspense fallback={<Spin size="small" />}>
                                    <TotalSpent
                                        chartRef={chartRef}
                                        chartData={data?.filteredResult}
                                        filters={filters}
                                        isLoading={isLoading}
                                    />
                                </Suspense>
                            </Flex>
                        </Col>
                        <Col
                            xs={24}
                            md={24}
                            lg={24}
                            xl={7}
                            xxl={8}
                            className="w-full px-8 py-6 bg-gray-50 rounded-2xl xxl:px-12 gutter-row xs:mt-4 xl:mt-0 "
                        >
                            <Flex vertical gap={15} className="min-h-full">
                                <AlertsList alertsREF={alerts} />
                                <Flex
                                    vertical
                                    justify="space-between"
                                    className="flex-0 xxl:flex-1"
                                >
                                    <RecentTransactionsList
                                        recentTransactions={recentTransactions}
                                        recentData={data?.recentTransaction}
                                        isLoading={isLoading}
                                    />
                                    <DashboardBussinessCardList />
                                </Flex>
                            </Flex>
                        </Col>
                    </>
                )}

                {user && user?.productTour?.dashboard && md && (
                    <Tour
                        // @ts-ignore
                        className="border rounded-md border-highLightBlue"
                        open={user?.productTour.dashboard && open}
                        disabledInteraction
                        onFinish={() => {
                            if (!open) {
                                setOpen(false);
                                handleUpdateTour('dashboard');
                            }
                        }}
                        onClose={() => {
                            setOpen(false);
                            handleUpdateTour('dashboard');
                        }}
                        steps={items}
                        arrow
                        animated
                        type="primary"
                        placement="bottom"
                        scrollIntoViewOptions
                        // indicatorsRender={(current, total) => <></>}
                    />
                )}
            </Row>
        </RenewalOverlay>
    );
};

export default Home;
