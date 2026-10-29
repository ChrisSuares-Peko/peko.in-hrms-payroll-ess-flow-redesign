import React from 'react';

import { ArrowRightOutlined } from '@ant-design/icons';
import { Badge, Button, Card, Col, Divider, Drawer, Flex, Row, Typography } from 'antd';
import moment from 'moment';

import useHideWidgetOnDrawer from '@components/molecular/freshChat/hooks/useHideWidgetOnDrawer';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import DurationBadgeSm from './DurationBadgeSm';
import FlightHeader from './FlightHeader';
import { Flight } from '../../types/Flight';
import { SelectedAirline } from '../../types/slices';
import { retrieveAirport } from '../../utils/airlineData';
import { formattedTimeOnly, shortDateFormat } from '../../utils/dateTime';
import { calculateDuration, formatDurationToHourMinute } from '../../utils/formatDateCode';
import { findLastSegment } from '../../utils/getFlightClass';

const { Text } = Typography;

type Props = {
    flightDetails: SelectedAirline;
    selectedInbountAirline?: SelectedAirline;
    isDrawerOpen: boolean;
    price?: number | undefined;
    handleClose: () => void;
    handleSubmit?: (item: Flight) => void;
};

const FlightInfoDrawer = ({
    flightDetails,
    selectedInbountAirline,
    isDrawerOpen,
    handleClose,
    price,
    handleSubmit,
}: Props) => {
    useHideWidgetOnDrawer(isDrawerOpen);

    let { journey } = flightDetails;
    if (selectedInbountAirline && selectedInbountAirline.journey) {
        journey = [...journey, ...selectedInbountAirline.journey];
    }

    function formatWeight(weight: string) {
        if (!weight) return 'NA';
        return weight.replace('Kilograms', ' Kg').replace('KG', ' Kg');
    }
    return (
        <Drawer
            title="Flight Details"
            width={1200}
            onClose={() => handleClose()}
            open={isDrawerOpen}
            styles={{
                body: { padding: 15 },
                header: { padding: 15 },
            }}
            footer={
                price ? (
                    <Flex
                        className="w-full h-full md:px-6"
                        align="center"
                        justify="space-between"
                        gap={10}
                    >
                        <Flex vertical>
                            <Text className="text-base text-gray-400">Price</Text>
                            <Text className="text-lg font-medium">
                                ₹ {formatNumberWithLocalString(price)}
                            </Text>
                        </Flex>
                        <Button
                            type="primary"
                            danger
                            onClick={() => {
                                // @ts-ignore
                                handleSubmit(flightDetails && flightDetails);
                            }}
                            className=" rounded-sm"
                        >
                            Book Now
                        </Button>
                    </Flex>
                ) : null
            }
        >
            <Card className="mx-0 mb-4 border-0" bodyStyle={{ padding: '0px' }} size="small">
                {flightDetails &&
                    journey.map((item, i) => (
                        <React.Fragment key={`journey-${i}`}>
                            <Flex className="w-full mb-5 p-0" gap={5} vertical>
                                <Text className="text-lg md:text-2xl font-medium">
                                    {item[0].Origin.Airport.AirportName}
                                    <ArrowRightOutlined className="text-xl font-light" />{' '}
                                    {findLastSegment(item).Destination.Airport.AirportName}
                                </Text>
                                <Text className="text-sm">
                                    {moment(item[0].Origin.DepTime).format('ddd, DD MMM')}
                                    <Badge dot color="#111" className="mx-1" />
                                    {item.length === 0 ? 'Non stop' : `${item.length - 1} stop`}
                                    <Badge dot color="#111" className="mx-1" />
                                    {formatDurationToHourMinute(calculateDuration(item))}
                                    {/* <Text className="text-sm ml-1">
                                        {findCabilClass(flightDetails.flightClass)}
                                    </Text> */}
                                </Text>
                            </Flex>
                            {item?.map((ele, index) => (
                                <Col
                                    className="mx-0 mb-4 pb-5 shadow-lg border border-gray-300 rounded-md"
                                    span={24}
                                    key={`segment-${i}-${index}`}
                                >
                                    <Row className="flex flex-col border-0 h-18  py-1  w-full ">
                                        <FlightHeader journey={ele} />
                                    </Row>
                                    <Divider className="w-full m-0 p-0 block" />
                                    <Row
                                        className="pt-2 px-0.5 w-full "
                                        justify="space-between"
                                        align="middle"
                                    >
                                        <Col span={6} className="flex flex-col   md:items-center">
                                            <Text className="text-[#86898B]  text-[0.60rem]  xxl:text-base font-[500]  line-clamb-1 whitespace-nowrap ">
                                                {retrieveAirport(ele.Origin.Airport.AirportCode) ||
                                                    ele.Origin.Airport.CityName}
                                            </Text>
                                            <Text className=" text-[1.40rem] font-semibold ">
                                                {ele.Origin.Airport.AirportCode}
                                            </Text>
                                            <Flex className=" items-center ">
                                                <Text className="font-medium text-[0.6rem]  whitespace-nowrap">
                                                    {formattedTimeOnly(
                                                        new Date(ele.Origin.DepTime)
                                                    )}
                                                </Text>
                                                <Text className="font-medium text-[0.6rem]  whitespace-nowrap">
                                                    ,{' '}
                                                    {shortDateFormat(new Date(ele.Origin.DepTime))}
                                                </Text>
                                            </Flex>

                                            <Text className="text-[#86898B] text-[0.60rem] font-[500] line-clamb-1 whitespace-nowrap ">
                                                {ele.Origin.Airport.AirportName}
                                            </Text>
                                            <Typography.Text className="text-gray-400 sm:block xs:text-xs md:text-sm">
                                                Terminal {ele.Origin.Airport.Terminal || 'N/A'}
                                            </Typography.Text>
                                        </Col>

                                        <Col
                                            span={6}
                                            md={5}
                                            className="flex flex-col items-center justify-center"
                                        >
                                            <Flex
                                                vertical
                                                className="w-full h-full mb-12"
                                                justify="center"
                                                align="center"
                                            >
                                                <DurationBadgeSm duration={ele.Duration} />
                                            </Flex>
                                        </Col>

                                        <Col span={6} className="flex flex-col items-end ">
                                            <Text className="text-[#86898B] text-[0.60rem] font-[500] line-clamb-1 whitespace-nowrap ">
                                                {retrieveAirport(
                                                    ele.Destination.Airport.AirportCode
                                                ) || ele.Destination.Airport.CityName}
                                            </Text>
                                            <Text className=" text-[1.40rem] font-semibold line-clamp-1 whitespace-nowrap">
                                                {ele.Destination.Airport.AirportCode}
                                            </Text>
                                            <Flex className=" items-center">
                                                <Text className="font-medium text-[0.6rem]  whitespace-nowrap">
                                                    {formattedTimeOnly(
                                                        new Date(ele.Destination.ArrTime)
                                                    )}
                                                </Text>
                                                <Text className="font-medium text-[0.6rem]  whitespace-nowrap">
                                                    ,{' '}
                                                    {shortDateFormat(
                                                        new Date(ele.Destination.ArrTime)
                                                    )}
                                                </Text>
                                            </Flex>
                                            <Text className="text-[#86898B] text-[0.60rem] font-[500] line-clamb-1 whitespace-nowrap ">
                                                {ele.Destination.Airport.AirportName}
                                            </Text>
                                            <Typography.Text className="text-gray-400 sm:block xs:text-xs md:text-sm">
                                                Terminal {ele.Destination.Airport.Terminal || 'N/A'}
                                            </Typography.Text>
                                        </Col>
                                    </Row>
                                    <Flex justify="space-between" className="px-0.5">
                                        <Text className="text-[#86898B] font-[500] line-clamb-1 whitespace-nowrap mr-5">
                                            <Text className="text-[#434343] text-[0.65rem] font-[400] line-clamb-1 whitespace-nowrap">
                                                Cabin Baggage :
                                            </Text>
                                            <Text className="text-[#434343] text-[0.65rem] font-[500] line-clamb-1 whitespace-nowrap">
                                                {formatWeight(ele.CabinBaggage)}
                                            </Text>
                                        </Text>
                                        <Text className="text-[#86898B] font-[500] line-clamb-1 whitespace-nowrap ">
                                            <Text className="text-[#434343] text-[0.65rem] font-[400] line-clamb-1 whitespace-nowrap">
                                                Check-In Baggage :
                                            </Text>
                                            <Text className="text-[#434343] text-[0.65rem] font-[500] line-clamb-1 whitespace-nowrap">
                                                {formatWeight(ele.Baggage)}
                                            </Text>
                                        </Text>
                                    </Flex>
                                </Col>
                            ))}
                        </React.Fragment>
                    ))}
            </Card>
        </Drawer>
    );
};

export default FlightInfoDrawer;
