import React from 'react';

import { ArrowRightOutlined, CloseOutlined } from '@ant-design/icons';
import { Badge, Button, Card, Col, Drawer, Flex, Image, Row, Typography } from 'antd';
import moment from 'moment';

import useHideWidgetOnDrawer from '@components/molecular/freshChat/hooks/useHideWidgetOnDrawer';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { Flight } from '../../types/Flight';
import { SelectedAirline } from '../../types/slices';
import { retrieveAirlineName, retrieveAirport, retrieveAirportName } from '../../utils/airlineData';
import { formattedTimeOnly } from '../../utils/dateTime';
import {
    calculateDuration,
    findCabilClass,
    formatDurationToHourMinute,
} from '../../utils/formatDateCode';
import { findLastSegment } from '../../utils/getFlightClass';
import LayoverDivider from '../LayoverDivider';
import FlightDurationBadge from '../summary/summaryWeb/FlightDurationBadge';

const { Text } = Typography;

type Props = {
    flightDetails: SelectedAirline;
    selectedInbountAirline?: SelectedAirline;
    isDrawerOpen: boolean;
    price?: number | undefined;
    hideBookNow?: boolean;
    handleClose: () => void;
    handleSubmit?: (item: Flight) => void;
};

type FormattedDateFn = (datetime: Date) => string;
const formattedDateOnly: FormattedDateFn = datetime =>
    datetime.toLocaleString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

const FlightInfoDrawer = ({
    flightDetails,
    selectedInbountAirline,
    isDrawerOpen,
    price,
    hideBookNow,
    handleClose,
    handleSubmit,
}: Props) => {
    function capitalizeFirstLetter(string: string) {
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }

    function formatWeight(weight: string) {
        if (!weight) return 'NA';
        return weight.replace('Kilograms', ' kg').replace('KG', ' kg');
    }

    let { journey } = flightDetails;
    if (selectedInbountAirline && selectedInbountAirline.journey) {
        journey = [...journey, ...selectedInbountAirline.journey];
    }

    useHideWidgetOnDrawer(isDrawerOpen);
    return (
        <Drawer
            title="Flight Details"
            width={1200}
            onClose={() => handleClose()}
            closeIcon={null}
            extra={
                <CloseOutlined onClick={handleClose} style={{ fontSize: '16px', color: '#000' }} />
            }
            open={isDrawerOpen}
            footer={
                price && [
                    <Flex
                        className="w-full h-full px-6"
                        align="center"
                        justify="space-between"
                        gap={10}
                        key=""
                    >
                        <Flex vertical>
                            <Text className="text-base text-gray-400">Price</Text>
                            <Text className="text-lg font-medium">
                                ₹ {formatNumberWithLocalString(price ?? 0)}
                            </Text>
                        </Flex>
                        {!hideBookNow && (
                            <Button
                                key="submit"
                                type="primary"
                                danger
                                onClick={() => {
                                    // @ts-ignore
                                    handleSubmit(flightDetails && flightDetails);
                                }}
                                className=""
                            >
                                Book Now
                            </Button>
                        )}
                    </Flex>,
                ]
            }
        >
            {/* {flightDetails?.fareInclusions && flightDetails.fareInclusions.length > 0 && (
                <Flex gap={4} wrap="wrap" className="mb-5">
                    {flightDetails.fareInclusions.map((inc: string, i: number) => (
                        <Tag key={i} color="default" className="text-xs">
                            {inc}
                        </Tag>
                    ))}
                </Flex>
            )} */}
            {flightDetails &&
                journey.map((item, i) => (
                    <React.Fragment key={i}>
                        <Flex className="mb-5" gap={5} vertical>
                            <Text className="text-2xl font-medium">
                                {retrieveAirport(item[0].Origin.Airport.AirportCode) ||
                                    item[0].Origin.Airport.CityName}{' '}
                                <ArrowRightOutlined className="text-xl font-light" />{' '}
                                {retrieveAirport(
                                    findLastSegment(item).Destination.Airport.AirportCode
                                ) || findLastSegment(item).Destination.Airport.CityName}
                            </Text>
                            <Text className="text-sm">
                                {moment(item[0].Origin.DepTime).format('ddd, DD MMM')}
                                <Badge dot color="#111" className="mx-1" />
                                {item.length === 1 ? 'Non stop' : `${item.length - 1} stop`}

                                <Badge dot color="#111" className="mx-1" />
                                {formatDurationToHourMinute(calculateDuration(item))}
                                {/* {flightDetails.lcc && (
                                        <>
                                            <Badge dot color="#111" className="mx-1" />
                                            LCC
                                        </>
                                    )} */}
                            </Text>
                        </Flex>
                        <Card className="my-6 rounded-[18px]" size="small">
                            {item.map((ele, index) => {
                                const nextSegment = item?.[index + 1];
                                return (
                                    <Col key={i} className="mb-5" span={24}>
                                        <Card
                                            className="border-0 rounded-[18px] "
                                            styles={{
                                                body: { padding: 15 },
                                            }}
                                        >
                                            <Row justify="space-between">
                                                <Col
                                                    span={24}
                                                    md={4}
                                                    className="border-0 rounded-2xl flex flex-col items-center justify-center bg-red_50 p-1"
                                                >
                                                    <Image
                                                        preview={false}
                                                        width={120}
                                                        alt={ele.Airline.AirlineCode}
                    // src={`https://storage.googleapis.com/peko-storage.appspot.com/image/${ele.Airline.AirlineCode}.gif`}
                    src={`https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fairline_logos%2F${ele.Airline.AirlineCode}.gif?alt=media`}
                                                    />
                                                    <Text className="capitalize text-center mt-2 font-medium">
                                                        {capitalizeFirstLetter(
                                                            retrieveAirlineName(
                                                                ele.Airline.AirlineCode
                                                            )
                                                        )}
                                                    </Text>
                                                    <Text className="capitalize text-center md:text-xs">
                                                        {ele.Airline.AirlineCode}-
                                                        {ele.Airline.FlightNumber}
                                                    </Text>
                                                </Col>

                                                <Col span={6} md={4} className="flex flex-col  ">
                                                    <Flex
                                                        className="w-full h-full "
                                                        justify="center"
                                                        align="start"
                                                        vertical
                                                    >
                                                        <Text className="text-gray-400 text-sm font-normal">
                                                            {formattedDateOnly(
                                                                new Date(ele.Origin.DepTime)
                                                            )}
                                                        </Text>
                                                        <Text className="font-bold text-xl mt-2">
                                                            {formattedTimeOnly(
                                                                new Date(ele.Origin.DepTime)
                                                            )}
                                                        </Text>
                                                        <Text className="text-gray-400 text-xs mt-2 font-normal">
                                                            {ele.Origin.Airport.AirportCode}
                                                            {' - '}
                                                            {retrieveAirport(
                                                                ele.Origin.Airport.AirportCode
                                                            ) || ele.Origin.Airport.CityName}
                                                        </Text>
                                                        <Text className="text-gray-400 text-xs mt-2 font-normal">
                                                            {retrieveAirportName(
                                                                ele.Origin.Airport.AirportCode
                                                            ) || ele.Origin.Airport.AirportName}
                                                        </Text>
                                                        <Text className="text-gray-400 sm:block xs:text-xs md:text-sm">
                                                            Terminal{' '}
                                                            {ele.Origin.Airport.Terminal || 'N/A'}
                                                        </Text>
                                                    </Flex>
                                                </Col>

                                                <Col
                                                    span={12}
                                                    md={6}
                                                    className="flex flex-col items-center justify-center"
                                                >
                                                    <FlightDurationBadge duration={ele.Duration} />
                                                </Col>

                                                <Col span={6} md={4} className="flex flex-col ">
                                                    <Flex
                                                        className="w-full h-full "
                                                        justify="center"
                                                        align="end"
                                                        vertical
                                                    >
                                                        <Text className="text-gray-400 text-right text-sm font-normal">
                                                            {formattedDateOnly(
                                                                new Date(ele.Destination.ArrTime)
                                                            )}
                                                        </Text>
                                                        <Text className="font-bold text-xl mt-2">
                                                            {formattedTimeOnly(
                                                                new Date(ele.Destination.ArrTime)
                                                            )}
                                                        </Text>
                                                        <Text className="text-gray-400 text-xs mt-2 font-normal text-end">
                                                            {ele.Destination.Airport.AirportCode}{' '}
                                                            {' - '}
                                                            {retrieveAirport(
                                                                ele.Destination.Airport.AirportCode
                                                            ) || ele.Destination.Airport.CityName}
                                                        </Text>
                                                        <Text className="text-gray-400 text-xs mt-2 font-normal text-end">
                                                            {retrieveAirportName(
                                                                ele.Destination.Airport.AirportCode
                                                            ) || ele.Destination.Airport.AirportName}
                                                        </Text>
                                                        <Text className="text-gray-400 sm:block xs:text-xs md:text-sm">
                                                            Terminal{' '}
                                                            {ele.Destination.Airport.Terminal ||
                                                                'N/A'}
                                                        </Text>
                                                    </Flex>
                                                </Col>
                                            </Row>
                                            <Flex align="end" justify="space-between">
                                                <Flex align="end" gap={10}>
                                                    {ele.Baggage && (
                                                        <Flex gap={5}>
                                                            <Text className="text-gray-400 text-xs font-normal">
                                                                Cabin Baggage
                                                            </Text>
                                                            <Text className="font-medium text-xs  capitalize">
                                                                {formatWeight(ele.CabinBaggage)}
                                                            </Text>
                                                        </Flex>
                                                    )}
                                                    {ele.CabinBaggage && (
                                                        <Flex gap={5}>
                                                            <Text className="text-gray-400 text-xs font-normal whitespace-nowrap">
                                                                Check-In Baggage
                                                            </Text>
                                                            <Text className="font-medium text-xs  capitalize">
                                                                {formatWeight(ele.Baggage)}
                                                            </Text>
                                                        </Flex>
                                                    )}
                                                </Flex>
                                                <Flex align="end" gap={10}>
                                                    <Flex gap={5}>
                                                        <Text className="text-gray-400 text-xs font-normal">
                                                            Cabin Class
                                                        </Text>

                                                        <Text className="capitalize text-xs font-medium">
                                                            {findCabilClass(
                                                                flightDetails.flightClass
                                                            )}
                                                        </Text>
                                                    </Flex>
                                                    <Flex align="end" justify="end" >
                                                        <Text className="text-gray-400 text-xs font-normal">
                                                            Marketed by
                                                        </Text>
                                                        <Flex vertical align="center" className='' gap={5}>
                                                            <Image
                                                                preview={false}
                                                                height={25}
                                                                width={50}
                                                                className="object-contain"
                                                                alt={ele.Airline.AirlineCode}
                                                                src={`https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fairline_logos%2F${ele.Airline.AirlineCode}.gif?alt=media`}
                                                            />
                                                            <Text className="capitalize text-xs font-medium ml-1">
                                                                {capitalizeFirstLetter(
                                                                    retrieveAirlineName(
                                                                        ele.Airline.AirlineCode
                                                                    )
                                                                )}
                                                            </Text>
                                                        </Flex>
                                                    </Flex>
                                                </Flex>
                                            </Flex>
                                        </Card>
                                        <LayoverDivider nextSegment={nextSegment} prevSegment={ele} />
                                    </Col>
                                );
                            })}
                        </Card>
                    </React.Fragment>
                ))}
        </Drawer>
    );
};

export default FlightInfoDrawer;
