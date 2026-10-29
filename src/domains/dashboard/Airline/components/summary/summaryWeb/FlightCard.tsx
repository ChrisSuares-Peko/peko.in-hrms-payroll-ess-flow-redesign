import { useState } from 'react';

import { RightOutlined } from '@ant-design/icons';
import { Button, Card, Col, Divider, Flex, Row, Typography } from 'antd';

import DynamicImageCard from './DynamicImageCard';
import FlightDurationBadge from './FlightDurationBadge';
// import { Journey } from '../../../types/airlineList';
import { retrieveAirport, retrieveAirportName } from '../../../utils/airlineData';
import { formattedDateOnly, formattedTimeOnly } from '../../../utils/dateTime';
import { calculateDuration } from '../../../utils/formatDateCode';
import { findLastSegment } from '../../../utils/getFlightClass';
import FlightInfoDrawer from '../../FlightInfoDrawer';
// import FlightCardDetailsDrawer from '../FlightCardDetailsDrawer';

const FlightCard = ({
    selectedAirline,
    selectedInbountAirline,
}: {
    selectedAirline: any;
    selectedInbountAirline?: any;
}) => {
    const [openDrawer, setOpenDrawer] = useState(false);
    let { journey } = selectedAirline;
    if (selectedInbountAirline && selectedInbountAirline.journey) {
        journey = [...journey, ...selectedInbountAirline.journey];
    }

    const findDuration = (item: any) => calculateDuration(item);

    return (
        <Card bodyStyle={{ padding: 0 }} className="rounded-md">
            {journey.map((item: any, index: any) => (
                <Row
                    className="mb-3 px-4 pt-3 w-full "
                    justify="space-between"
                    align="middle"
                    key={index}
                >
                    <Col
                        span={12}
                        md={4}
                        className="flex flex-col  border-0 h-36 ms-1 rounded-md items-center justify-center bg-[#FFF7F6]"
                    >
                        <DynamicImageCard item={item} />
                    </Col>
                    <Col span={12} md={5} className="flex flex-col items-end  md:items-center">
                        <Typography.Text className="text-gray-400 md:text-sm xxl:text-base font-normal">
                            Departure
                        </Typography.Text>
                        <Typography.Text className="font-bold text-xl mt-1">
                            {formattedTimeOnly(new Date(item[0].Origin.DepTime))}
                        </Typography.Text>
                        <Typography.Text className="md:text-sm xxl:text-sm font-normal">
                            {formattedDateOnly(new Date(item[0].Origin.DepTime))}
                        </Typography.Text>
                        <Typography.Text className="md:text-lg xxl:text-xl font-semibold">
                            {item[0].Origin.Airport.AirportCode}
                        </Typography.Text>
                        <Typography.Text className="text-gray-400 md:text-sm xxl:text-base font-normal">
                            {retrieveAirportName(item[0].Origin.Airport.AirportCode)}
                        </Typography.Text>
                        <Typography.Text className="text-gray-400 md:text-sm xxl:text-base font-normal line-clamp-1">
                            {retrieveAirport(item[0].Origin.Airport.AirportCode)}
                        </Typography.Text>
                        <Typography.Text className="text-gray-400 md:text-sm xxl:text-base font-normal line-clamp-1">
                            Terminal {item[0].Origin.Airport.Terminal}
                        </Typography.Text>
                    </Col>
                    <Col span={24} md={5} className="flex flex-col items-center justify-center">
                        <Flex
                            vertical
                            className="w-full h-full mt-2"
                            justify="center"
                            align="center"
                        >
                            <FlightDurationBadge duration={findDuration(item)} />
                            <Typography.Text className="mt-3 text-xs text-gray-500">
                                {item.length === 1 ? 'Non stop' : `${item.length - 1} stop`}
                            </Typography.Text>
                        </Flex>
                    </Col>
                    <Col span={12} md={5} className="flex flex-col items-start  md:items-center">
                        <Typography.Text className="text-gray-400 md:text-sm xxl:text-base font-normal">
                            Arrival
                        </Typography.Text>
                        <Typography.Text className="font-bold text-xl mt-1">
                            {formattedTimeOnly(new Date(findLastSegment(item).Destination.ArrTime))}
                        </Typography.Text>
                        <Typography.Text className="md:text-sm xxl:text-sm font-normal">
                            {formattedDateOnly(new Date(findLastSegment(item).Destination.ArrTime))}
                        </Typography.Text>
                        <Typography.Text className="md:text-lg xxl:text-xl font-semibold">
                            {findLastSegment(item).Destination.Airport.AirportCode}
                        </Typography.Text>
                        <Typography.Text className="text-gray-400 md:text-sm xxl:text-base font-normal text-center">
                            {retrieveAirportName(
                                findLastSegment(item).Destination.Airport.AirportCode
                            )}
                        </Typography.Text>
                        <Typography.Text className="text-gray-400 md:text-sm xxl:text-base font-normal line-clamp-1">
                            {retrieveAirport(findLastSegment(item).Destination.Airport.AirportCode)}
                        </Typography.Text>
                        <Typography.Text className="text-gray-400 md:text-sm xxl:text-base font-normal line-clamp-1">
                            Terminal {findLastSegment(item).Destination.Airport.Terminal}
                        </Typography.Text>
                    </Col>
                    {/* <Col span={12} md={4} className="flex flex-col items-end">
                        <Typography.Text className="font-medium md:text-lg xxl:text-xl">
                            {retrieveAirportName(item.Destination.Airport.AirportCode)}
                        </Typography.Text>
                        <Typography.Text className="md:text-sm xxl:text-base font-normal line-clamp-1">
                            {retrieveAirport(item.Destination.Airport.AirportCode)}
                        </Typography.Text>
                    </Col> */}
                </Row>
            ))}
            <Divider className="border-t-1 rounded-full" />

            <Flex className="justify-end pe-2 pb-2">
                <Button danger onClick={() => setOpenDrawer(true)}>
                    <Flex align="center" gap={4}>
                        <Typography.Text className="text-inherit">Flight Details</Typography.Text>
                        <RightOutlined className="ms-1" />
                    </Flex>
                </Button>
            </Flex>

            {openDrawer && (
                <FlightInfoDrawer
                    flightDetails={selectedAirline}
                    selectedInbountAirline={selectedInbountAirline}
                    isDrawerOpen={openDrawer}
                    handleClose={() => setOpenDrawer(false)}
                />
            )}
        </Card>
    );
};

export default FlightCard;
