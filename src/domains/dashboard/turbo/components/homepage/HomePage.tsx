/* eslint-disable no-nested-ternary */

import { useEffect } from 'react';

import { Card, Col, Flex, Image, Row, Spin, Typography } from 'antd';

import ChartEmpty from '@assets/svg/chartEmpty.svg';

import CardComponent from './AlertCards';
import Chart from './Chart';
import DocInfoCard from './DocInfoCard';
import HeaderBanner from './HeaderBanner';
import HomePageHeader from './HomePageHeader';
import TurboIconCard from './TurboIconCard';
import compliance from '../../assets/icons/compliances.svg';
import dl from '../../assets/icons/dl.svg';
import doc from '../../assets/icons/docExpiry.svg';
import fastag from '../../assets/icons/fastagTopup.svg';
import fleet from '../../assets/icons/fleet.svg';
import useDashboard from '../../hooks/useDashboard';
import useGetAllLogsApi from '../../hooks/useGetAllLogsApi';
import { filterState } from '../../types';
import { iconcardData } from '../../utils/data';

const HomePage = () => {
    const isRefresh = true;
    const { data, isLoading } = useDashboard(isRefresh);
    const initialValues = {
        searchText: '',
        page: 1,
        itemsPerPage: 5,
        from: '',
        to: '',
    };

    const filter: filterState = initialValues;

    useEffect(() => {
        if (typeof Moengage?.track_event === 'function') {
            Moengage.track_event('service_viewed', { service_name: 'turbo' });
        }
    }, []);

    // You can handle API fetching here if needed for additional side effects
    const { logs } = useGetAllLogsApi(filter);

    const latestUpdatedAt: any = logs
        ?.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        ?.at(0)?.updatedAt;


    const dashboardCard = [
        {
            title: 'Total Documents',
            value: 'Fleet Summary',
            isPercentage: false,
            icon: fleet,
            bgColor: 'bg-[#FCF9FF]',
            subText1: 'Verified',
            subText2: 'Unverified',
            verified: data?.fleets?.verified,
            unverified: data?.fleets?.unverified,
            buttonText: 'Add Vehicle',
        },
        {
            title: 'Active Documents',
            value: 'Driver License Summary',
            isPercentage: false,
            icon: dl,
            bgColor: 'bg-[#F1FFF6]',
            verified: data?.drivers?.totalDrivers,
            unverified: data?.drivers?.dlExpiringSoon,
            subText1: 'Total Drivers',
            subText2: 'DLs expiring soon',
            buttonText: 'Add Driver',
        },
    ];

    return (
        <>
            <HomePageHeader latestUpdatedAt={latestUpdatedAt} />
            <HeaderBanner />
            <Row gutter={[20, 20]}>
                <Col xs={24} xl={16} className="py-4">
                    <Row gutter={[20, 20]} className="">
                        {dashboardCard.map((item, i) => (
                            <Col xs={24} md={12} key={i} className="flex justify-center min-h-10">
                                <DocInfoCard
                                    title={item.title}
                                    value={item.value}
                                    icon={item.icon}
                                    isPercentage={item.isPercentage}
                                    key={i}
                                    bgColor={item.bgColor}
                                    verified={item.verified}
                                    unverified={item.unverified}
                                    subText1={item.subText1}
                                    subText2={item.subText2}
                                    buttonText={item.buttonText}
                                />
                            </Col>
                        ))}
                    </Row>
                    {/* TurboIconCard must stay fluid or these columns overflow. */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-x-3 gap-y-5 mt-5 place-items-center">
                        {iconcardData.map((item, i) => (
                            <TurboIconCard
                                key={i}
                                title={item.title}
                                icon={item.icon}
                                url={item.url}
                            />
                        ))}
                    </div>
                </Col>

                <Col xs={24} xl={8} className="py-4">
                    <Card variant="borderless" className="w-full rounded-2xl !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)]">
                        {/* <Chart chartData={data?.ageDistributionData} /> */}
                        {isLoading ? (
                            <Flex justify="center" align="center" className="py-20 my-16">
                                <Spin size="large" />
                            </Flex>
                        ) : data?.ageDistributionData && data?.ageDistributionData.length > 0 ? (
                            <Chart chartData={data?.ageDistributionData} />
                        ) : (
                            <Flex vertical align="center" className="pb-8">
                                <Image
                                    src={ChartEmpty}
                                    loading="lazy"
                                    preview={false}
                                    width="20%"
                                    className="p-1 my-5"
                                />
                                <Typography.Text className="pb-8 text-base font-normal text-gray-400">
                                    No data to display on the graph
                                </Typography.Text>
                            </Flex>
                        )}
                    </Card>
                </Col>
            </Row>
            <Row className="mt-4" gutter={[20, 20]}>
                <Col xs={24} xl={8}>
                    <CardComponent
                        title="Document Expiry Alerts"
                        data={data?.documents}
                        icon={doc}
                        type="expiry"
                    />
                </Col>
                <Col xs={24} xl={8}>
                    <CardComponent
                        title="Compliance Tasks"
                        data={data?.tasks}
                        type="tasks"
                        icon={compliance}
                    />
                </Col>
                <Col xs={24} xl={8}>
                    <CardComponent
                        title="Recent FASTag Top-ups"
                        data={data?.recentTopups}
                        icon={fastag}
                        type="fastag"
                    />
                </Col>
            </Row>
        </>
    );
};

export default HomePage;
