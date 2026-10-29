import { lazy, Suspense, useCallback } from 'react';

import { Flex, Typography, Image, Row, Col, Button, Skeleton, Spin } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';

import resultImage from '@src/domains/dashboard/carbonFootprint/assets/images/resultcalc.png';
import useScreenSize from '@src/hooks/useScreenSize';
import { paths } from '@src/routes/paths';

import useGetCarbonResultData from '../hooks/useGetCarbonResultData';

const ResultCard = lazy(() => import('../components/dashboard/CarbonForm/ResultCard'));
const Chart = lazy(() => import('../components/dashboard/CarbonForm/Chart'));

const CalculatorResult = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const screens = useScreenSize();
    const justify = screens.md ? 30 : 20;

    const { Text } = Typography;
    const { advancedCal, totalCo2Usage, groupedByCategory, isLoading } =
        useGetCarbonResultData(state);
    const handleNeutralize = useCallback(() => {
        navigate(
            `${paths.dashboard.moreServices}/${paths.zeroCarbon.index}/${paths.zeroCarbon.projectListing}`
        );
    }, [navigate]);

    const handleAdvCalculator = useCallback(
        (advanced: boolean) => {
            navigate(
                `${paths.dashboard.moreServices}/${paths.zeroCarbon.index}/${paths.zeroCarbon.carbonCalculator}`,
                {
                    state: {
                        advanced,
                    },
                }
            );
        },
        [navigate]
    );
    return (
        <Flex vertical align="center" className="">
            <Text className="md:text-3xl font-medium text-xl text-center">
                Corporate Carbon Calculator Result
            </Text>
            <Text className="mt-6 text-lg">Start taking actions</Text>

            <Image
                loading="lazy"
                width={340}
                className=" object-contain my-2"
                style={{ paddingTop: '3rem' }}
                src={resultImage}
                preview={false}
            />

            {!isLoading ? (
                <Row gutter={[justify, 20]} className="pt-10 xl:px-28 lg:px-0 ">
                    <Col xl={10} lg={24} md={12} sm={24} className="w-full">
                        <Suspense fallback={<Spin />}>
                            <ResultCard
                                value={parseFloat(totalCo2Usage).toFixed(2)}
                                onNeutralize={handleNeutralize}
                            />
                        </Suspense>
                    </Col>
                    <Col xl={14} lg={24} md={12} sm={24} className="mt-10 md:mt-0">
                        <Suspense fallback={<Spin />}>
                            <Chart chartData={groupedByCategory} />
                        </Suspense>
                    </Col>
                    <Col xs={24}>
                        <Flex justify="end">
                            <Button
                                type="default"
                                className=" px-6"
                                danger
                                onClick={() => handleAdvCalculator(advancedCal)}
                            >
                                {advancedCal ? 'Advance' : 'Basic'} Calculator
                            </Button>
                        </Flex>
                    </Col>
                </Row>
            ) : (
                <Skeleton className="mt-10" />
            )}
        </Flex>
    );
};

export default CalculatorResult;
