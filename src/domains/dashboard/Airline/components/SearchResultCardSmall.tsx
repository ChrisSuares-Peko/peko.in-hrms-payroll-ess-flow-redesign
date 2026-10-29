import { RightOutlined } from '@ant-design/icons';
import { Card, Col, Flex, Radio, Row, Typography } from 'antd';

import { useAppSelector } from '@src/hooks/store';

import FlightDurationBadge from './FlightDurationBadge';
import LayoverTooltip from './LayoverTooltip';
import NonLccTag from './NonLccTag';
import DynamicImageCardSmall from './searchResult/DynamicImageCardSmall';
import { Journey } from '../types/airlineList';
import { Flight } from '../types/Flight';
import { formattedDateOnly, formattedTimeOnly } from '../utils/dateTime';
import '../assets/style.css';
import { calculateDuration, formatStopQuantityWithCities } from '../utils/formatDateCode';

interface FlightDetailProps {
    item: Flight;
    isBanner?: boolean;
    isInbount?: boolean;
    handleClick?: (value: Flight) => void;
    setDrawerDetails: (value: Flight) => void;
    setIsDrawerOpen: (value: boolean) => void;
    setSelectedAirlinePrice: (value: number) => void;
}

function SearchResultCardSmall({
    item,
    isBanner,
    isInbount,
    handleClick,
    setDrawerDetails,
    setIsDrawerOpen,
    setSelectedAirlinePrice,
}: FlightDetailProps) {
    const findLastSegment = (journey: Journey[]) => journey[journey.length - 1];

    const { selectedAirline, selectedInbountAirline } = useAppSelector(
        state => state.reducer.airline
    );

    const selectedResultIndex = isInbount
        ? selectedInbountAirline?.ResultIndex
        : selectedAirline?.ResultIndex;
    const ele = item.journey[0];
    return (
        <Col className={`${!isBanner && 'mb-5'} p-0"`} span={24} style={{ paddingInline: 0 }}>
            <Card
                className={`${isBanner ? 'border' : 'border-0'} rounded-lg search-result-card relative`}
                styles={{ body: { paddingInline: '16px', paddingBlock: '8px' } }}
            >
                <Row justify="space-between" align="middle">
                    <Col span={18} className="border-0 ms-1 rounded-md ">
                        <Flex className="justify-between">
                            <DynamicImageCardSmall flightSegments={ele} />
                        </Flex>
                    </Col>
                    <Col span={5}>
                        {handleClick && (
                            <Flex className="justify-center items-end">
                                <Radio
                                    onClick={() => handleClick(item)}
                                    checked={selectedResultIndex === item.ResultIndex}
                                />
                            </Flex>
                        )}
                    </Col>

                    <Col span={24} className="py-4">
                        <Row>
                            <Col md={6} className="flex flex-col items-start gap-0.5">
                                <Typography.Text className="md:text-sm font-normal text-center">
                                    {ele[0].Origin.Airport.AirportCode}
                                </Typography.Text>

                                <Typography.Text className="font-medium md:text-base">
                                    {formattedTimeOnly(new Date(ele[0].Origin.DepTime))}
                                </Typography.Text>
                                <Typography.Text className="md:text-xs font-normal text-center">
                                    {formattedDateOnly(new Date(ele[0].Origin.DepTime))}
                                </Typography.Text>
                            </Col>
                            <Col md={6} className="w-full">
                                <Flex
                                    vertical
                                    className="w-full h-full mt-2"
                                    justify="center"
                                    align="center"
                                >
                                    <FlightDurationBadge duration={calculateDuration(ele)} />
                                    <LayoverTooltip segments={ele}>
                                        <Typography.Text className="text-gray-500 text-xs mt-3 block w-full truncate text-center">
                                            {formatStopQuantityWithCities(ele)}
                                        </Typography.Text>
                                    </LayoverTooltip>
                                </Flex>
                            </Col>
                            <Col md={6} className="flex flex-col items-end gap-0.5">
                                <Typography.Text className="md:text-sm font-normal text-center line-clamp-1">
                                    {findLastSegment(ele).Destination.Airport.AirportCode}
                                </Typography.Text>
                                <Typography.Text className="font-medium md:text-base">
                                    {formattedTimeOnly(
                                        new Date(findLastSegment(ele).Destination.ArrTime)
                                    )}
                                </Typography.Text>
                                <Typography.Text className="text-xs font-normal text-center">
                                    {formattedDateOnly(
                                        new Date(findLastSegment(ele).Destination.ArrTime)
                                    )}
                                </Typography.Text>
                            </Col>
                            <Col span={1} />
                            <Col
                                md={5}
                                className="flex lg:flex-col gap-4 lg:gap-0 align-middle mb-4 lg:mb-0 items-end lg:items-center justify-center md:me-4 lg:me-0"
                            >
                                <Flex gap={10} vertical justify="center" align="center">
                                    <Flex vertical justify="center" align="center" gap={1}>
                                        {/* {item.FareClassification?.Type && (
                                            <Tag
                                                style={{
                                                    backgroundColor:
                                                        item.FareClassification.Color || undefined,
                                                    border: 'none',
                                                }}
                                                className="text-[10px] font-medium"
                                            >
                                                {item.FareClassification.Type}
                                            </Tag>
                                        )} */}
                                        <NonLccTag lcc={item.lcc} className="mb-1" />
                                        <Typography.Text className="text-gray-400 md:text-sm font-normal">
                                            Price
                                        </Typography.Text>
                                        <Typography.Text className="font-semibold text-sm">
                                            ₹ {Number(item.price).toLocaleString()}
                                        </Typography.Text>
                                        {/* {item.seatsAvailable !== undefined &&
                                            item.seatsAvailable <= 9 && (
                                                <Typography.Text className="text-[10px] text-orange-500 font-medium">
                                                    Only {item.seatsAvailable} left!
                                                </Typography.Text>
                                            )} */}
                                    </Flex>
                                    <Typography.Text
                                        onClick={() => {
                                            setDrawerDetails(item);
                                            setSelectedAirlinePrice(Number(item.price));
                                            setIsDrawerOpen(true);
                                        }}
                                        className="text-red-500 cursor-pointer text-[9px] flex justify-center items-center"
                                    >
                                        Flight Details <RightOutlined className="ms-1" />
                                    </Typography.Text>
                                </Flex>
                            </Col>
                        </Row>
                    </Col>
                </Row>
                {/* <Col span={1}>
                        <div className="flex flex-col justify-between items-center h-full">
                            <div className="bg-[#F4F6FA] h-2 w-full rounded-bl-full rounded-br-full" />
                            <div className="flex-1 w-[2px] custom-vertical-dash" />
                            <div className="bg-[#F4F6FA] h-2 w-full rounded-tl-full rounded-tr-full" />
                        </div>
                    </Col> */}
            </Card>
        </Col>
    );
}

export default SearchResultCardSmall;
