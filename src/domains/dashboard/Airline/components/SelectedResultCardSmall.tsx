import { RightOutlined } from '@ant-design/icons';
import { Col, Flex, Row, Typography } from 'antd';

import DynamicImageCardSmall from './searchResult/DynamicImageCardSmall';
import FlightDurationBadgeSmall from './searchResult/FlightDurationBadgeSmall';
import { Journey } from '../types/airlineList';
import { Flight } from '../types/Flight';
import { formattedTimeOnly } from '../utils/dateTime';
import '../assets/style.css';
import { calculateDuration } from '../utils/formatDateCode';

interface FlightDetailProps {
    item: Flight;
    isBanner?: boolean;
    isInbount?: boolean;
    setDrawerDetails: (value: Flight) => void;
    setIsDrawerOpen: (value: boolean) => void;
    setSelectedAirlinePrice: (value: number) => void;
}

function SelectedResultCardSmall({
    item,
    isBanner,
    isInbount,
    setDrawerDetails,
    setIsDrawerOpen,
    setSelectedAirlinePrice,
}: FlightDetailProps) {
    const findLastSegment = (journey: Journey[]) => journey[journey.length - 1];

    const ele = item.journey[0];
    return (
        <Col className={`${!isBanner && 'mb-5'} p-0"`} span={24} style={{ paddingInline: 0 }}>
            <Flex>
                <Row justify="space-between" align="middle">
                    <Col>
                        <Flex className="justify-between">
                            <DynamicImageCardSmall flightSegments={ele} />
                        </Flex>
                    </Col>

                    <Col span={18} className="py-4 justify-between">
                        <Row className="justify-between" align="middle" gutter={[0, 0]}>
                            <Col md={6} className="flex flex-col items-start gap-0.5">
                                <Typography.Text className="md:text-xs font-normal text-center">
                                    {ele[0].Origin.Airport.AirportCode}
                                </Typography.Text>

                                <Typography.Text className="font-medium md:text-sm">
                                    {formattedTimeOnly(new Date(ele[0].Origin.DepTime))}
                                </Typography.Text>
                            </Col>
                            <Col md={6} className="w-full">
                                <Flex
                                    vertical
                                    className="w-full h-full mt-2"
                                    justify="center"
                                    align="center"
                                >
                                    <FlightDurationBadgeSmall duration={calculateDuration(ele)} />
                                    <Typography.Text className="text-gray-500 text-[10px] mt-2">
                                        {ele.length === 1 ? 'Non stop' : `${ele.length - 1} stop`}
                                    </Typography.Text>
                                </Flex>
                            </Col>
                            <Col md={6} className="flex flex-col items-end gap-0.5">
                                <Typography.Text className="md:text-xs font-normal text-center line-clamp-1">
                                    {findLastSegment(ele).Destination.Airport.AirportCode}
                                </Typography.Text>
                                <Typography.Text className="font-medium md:text-sm">
                                    {formattedTimeOnly(
                                        new Date(findLastSegment(ele).Destination.ArrTime)
                                    )}
                                </Typography.Text>
                            </Col>
                            <Col span={1} />
                        </Row>
                    </Col>

                    <Col md={6} className="flex justify-end self-center md:me-4 lg:me-0 -mt-10">
                        <Flex vertical justify="start" align="center" className="gap-2">
                            <Flex vertical justify="center" align="center">
                                <Typography.Text className="text-gray-400 md:text-xs font-normal">
                                    Price
                                </Typography.Text>
                                <Typography.Text className="font-semibold text-sm mt-1">
                                    ₹ {Number(item.price).toLocaleString()}
                                </Typography.Text>
                            </Flex>
                            <Typography.Text
                                onClick={() => {
                                    setDrawerDetails(item);
                                    setSelectedAirlinePrice(Number(item.price));
                                    setIsDrawerOpen(true);
                                }}
                                className="text-red-500 cursor-pointer text-[10px] flex justify-center items-center"
                            >
                                Flight Details <RightOutlined className="ms-1" />
                            </Typography.Text>
                        </Flex>
                    </Col>
                </Row>
            </Flex>
        </Col>
    );
}

export default SelectedResultCardSmall;
