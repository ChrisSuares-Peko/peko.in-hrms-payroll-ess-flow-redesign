import { Col, Divider, Flex, Grid, Row } from 'antd';
// import useHideWidgetOnDrawer from '@components/molecular/freshChat/hooks/useHideWidgetOnDrawer';
import { Content } from 'antd/es/layout/layout';

import ServiceNotPurchasedPage from '@domains/dashboard/IndividualPlan/pages/ServiceNotPurchased';
import assetsLock from '@domains/dashboard/PekoCloud/assets/icons/assetsLock.svg';
import documents from '@domains/dashboard/PekoCloud/assets/icons/documents.svg';
import SettingsIcon from '@domains/dashboard/PekoCloud/assets/icons/settings-red.svg';
import subscriptions from '@domains/dashboard/PekoCloud/assets/icons/subscriptions.svg';
import wallet from '@domains/dashboard/PekoCloud/assets/icons/wallet.svg';
import { useAppSelector } from '@src/hooks/store';
import { useScrollToTop } from '@src/hooks/useScrollToTop';
import useServiceAccess from '@src/hooks/useSubscriptionCheck';
import { paths } from '@src/routes/paths';
import { accessKeys } from '@utils/accessKeys';
import { packageAccessKeys } from '@utils/packageAccessKeys';

import FeatureCardMob from '../../IndividualPlan/components/FeatureCardMob';
import { useGetDetailsSubscription } from '../../IndividualPlan/hooks/useGetDetailsSubscription';
import AdaptiveCommonLandingPage from '../../IndividualPlan/pages/AdaptiveCommonLandingPage';
import NewIndividualLandingPage from '../../IndividualPlan/pages/NewIndividualLandingPage';
// import CommonIndividualLandingPage from '../../IndividualPlan/pages/CommonIndividualLandingPage';
import LandingPageIcon from '../assets/images/workbench.png';
import DashboardHeader from '../components/Dashboard/DashboardHeader';
import FeatureCard from '../components/Dashboard/FeatureCard';
import InfoCard from '../components/Dashboard/InfoCard';
import NavigationCards from '../components/Dashboard/NavigationCards';
import Reminder from '../components/Dashboard/Reminder';
import StorageProgress from '../components/Dashboard/StorageProgress';
import TaskToDo from '../components/Dashboard/TaskToDo';
import TaskToDoMobile from '../components/Dashboard/TaskToDoMobile';
import { useGetDashDataApi } from '../hooks/dashboardHooks/useGetDashDataApi';
import { useGetDashToDoApi } from '../hooks/dashboardHooks/useGetDashTaskDataApi';
import { featureData, serviceDetails, subDescription, navMenuDetails } from '../utils/dashDetails';
import { featuresPekoCloud } from '../utils/featuresPekoCloud';

const HomePage = () => {
    const screens = Grid.useBreakpoint();
    const { subscriptionData } = useGetDetailsSubscription(
        packageAccessKeys.Hub,
        accessKeys.pekoCloud
    );
    const serviceName = subscriptionData?.packageDetails[0]?.packageName ?? "Hub";

    // useHideWidgetOnDrawer(true);
    const { pekoCloud } = accessKeys;
    useScrollToTop();
    const { tableDatas, totalAssetsAndFleets, totalDoc, totalSubSpent, totalSubs } =
        useGetDashDataApi();
    const { toDoData, isLoading } = useGetDashToDoApi();
    const slicedToDoData = toDoData.slice(0, 6);
    const isPurchased = useServiceAccess(pekoCloud);

    const dashboardData = [
        {
            title: 'Total Documents',
            value: totalDoc,
            isCurrency: false,
            icon: documents,
            bgColor: 'bg-[#F9F4FF]',
        },
        {
            title: 'Total Subscriptions',
            value: totalSubs,
            isCurrency: false,
            icon: subscriptions,
            bgColor: 'bg-[#FFF6F2]',
        },
        {
            title: 'Total Amount Spent for Subscriptions',
            value: totalSubSpent,
            isCurrency: true,
            icon: wallet,
            bgColor: 'bg-[#FFFBE4]',
        },
        {
            title: 'Total Assets & Fleets',
            value: totalAssetsAndFleets,
            isCurrency: false,
            icon: assetsLock,
            bgColor: 'bg-[#F6FCEB]',
        },
    ];
    const { user } = useAppSelector(state => state.reducer.user);
    if (isPurchased === undefined) return null;
    if (!isPurchased && user?.roleName === 'corporate sub user') {
        return <ServiceNotPurchasedPage />;
    }
    return !isPurchased ? (
        <Content style={{ maxWidth: '1500px', margin: '0 auto', padding: '0 20px' }}>
            {screens.xs ? (
                <AdaptiveCommonLandingPage
                    features={featuresPekoCloud}
                    serviceKey={packageAccessKeys.Hub}
                    svgIcon={LandingPageIcon}
                    title="Centralize and organize all your essential | company  information in a single, secure | platform"
                    serviceName={serviceName}
                    serviceDetails={serviceDetails}
                    subDescription={subDescription}
                >
                    <Row gutter={[15, 15]}>
                        {featureData.map((feature, index) => (
                            <Col xs={12} key={index}>
                                <FeatureCardMob
                                    icon={feature.iconMob}
                                    title={feature.title}
                                    description={feature.description}
                                />
                            </Col>
                        ))}
                    </Row>
                </AdaptiveCommonLandingPage>
            ) : (
                <NewIndividualLandingPage
                    features={featuresPekoCloud}
                    serviceKey={packageAccessKeys.Hub}
                    svgIcon={LandingPageIcon}
                    title="Centralize and organize all your essential company | information in a single, secure platform"
                    serviceName={serviceName}
                    serviceDetails={serviceDetails}
                    subDescription={subDescription}
                    packageDetails={subscriptionData?.packageDetails[0]}
                >
                    <Flex justify="center" align="center">
                        <div className="feature-cards-container">
                            {featureData.map((feature, index) => (
                                <div className="feature-card " key={index}>
                                    <FeatureCard icon={feature.icon} />
                                </div>
                            ))}
                        </div>
                    </Flex>
                </NewIndividualLandingPage>
            )}
        </Content>
    ) : (
        // <CommonIndividualLandingPage
        //     features={featuresPekoCloud}
        //     serviceKey={packageAccessKeys['Peko Cloud']}
        //     svgIcon={LandingPageIcon}
        //     title="Peko Cloud"
        //     serviceName="Cloud"
        //     description="Take advantage of our cutting-edge cloud solutions to streamline operations and enhance efficiency. Enable centralized data management, collaborate in real time, and increase productivity. Scale your capabilities effortlessly and drive growth with Peko Cloud. "
        // />
        <>
            <DashboardHeader />
            <Divider
                className="p-0 m-0 -ml-10 "
                style={{ width: screens.xxl ? '105.8%' : '106.6%' }}
            />
            <Row className="px-[-0.5rem] mx-[-0.5rem]">
                <Col xl={18} className="py-8">
                    <Row gutter={[15, 30]} className="md:pr-8">
                        <Row className={`w-full ${screens.sm && 'hidden'} md:justify-between`}>
                            {dashboardData.map((item, i) => (
                                <Col
                                    key={i}
                                    className="flex justify-center p-1 min-h-14 xs:w-1/2 sm:w-1/2 lg:w-1/2 xl:w-1/2 xxl:w-1/4 lg:p-3"
                                >
                                    <InfoCard
                                        title={item.title}
                                        value={item.value}
                                        icon={item.icon}
                                        isCurrency={item.isCurrency}
                                        bgColor={item.bgColor}
                                    />
                                </Col>
                            ))}
                        </Row>
                        <Row className={`w-full ${!screens.sm && 'hidden'} md:justify-between`}>
                            {dashboardData.map((item, i) => (
                                <Col
                                    key={i}
                                    className="flex justify-center p-1 min-h-14 xs:w-1/2 sm:w-1/2 lg:w-1/2 xl:w-1/2 xxl:w-1/4 lg:p-3"
                                >
                                    <InfoCard
                                        title={item.title}
                                        value={item.value}
                                        icon={item.icon}
                                        isCurrency={item.isCurrency}
                                        bgColor={item.bgColor}
                                    />
                                </Col>
                            ))}
                        </Row>
                        <Row className="w-full md:justify-between" justify="center">
                            {navMenuDetails.map((item, i) => (
                                <Col key={i} className="flex justify-center p-1 lg:p-3">
                                    <NavigationCards
                                        icon={item.icon}
                                        title={item.title}
                                        isActive={item.isActive}
                                        link={item.link}
                                    />
                                </Col>
                            ))}
                            {!screens.sm && (
                                <Col key={7} className="flex justify-center p-1 lg:p-3">
                                    <NavigationCards
                                        icon={SettingsIcon}
                                        title="Settings"
                                        isActive
                                        link={paths.pekoCloud.settings}
                                    />
                                </Col>
                            )}
                        </Row>
                        <StorageProgress />
                        <Reminder tableDatas={tableDatas} />
                    </Row>
                </Col>

                <Col className="border-1 min-h-40" xl={6} xs={0}>
                    <TaskToDo
                        isLoading={isLoading}
                        slicedToDoData={slicedToDoData}
                        toDoData={toDoData}
                    />
                </Col>
                <Col className="w-full xs:block xl:hidden">
                    <TaskToDoMobile slicedToDoData={slicedToDoData} />
                </Col>
            </Row>
        </>
    );
};

export default HomePage;
