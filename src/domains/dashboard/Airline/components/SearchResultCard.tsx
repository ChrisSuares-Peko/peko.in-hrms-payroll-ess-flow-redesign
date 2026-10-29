import { RightOutlined } from '@ant-design/icons';
import { Button, Card, Col, Flex, Row, Typography } from 'antd';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import FlightDurationBadge from './FlightDurationBadge';
import LayoverTooltip from './LayoverTooltip';
import NonLccTag from './NonLccTag';
import DynamicImageCard from './searchResult/DynamicImageCard';
import { Journey } from '../types/airlineList';
import { Flight } from '../types/Flight';
import { formattedDateOnly, formattedTimeOnly } from '../utils/dateTime';
import '../assets/style.css';
import { calculateDuration, formatStopQuantityWithCities } from '../utils/formatDateCode';

interface FlightDetailProps {
    item: Flight;
    handleClick: (value: Flight) => void;
    setDrawerDetails: (value: Flight) => void;
    setIsDrawerOpen: (value: boolean) => void;
    setSelectedAirlinePrice: (value: number) => void;
}

function SearchResultCard({
    item,
    handleClick,
    setDrawerDetails,
    setIsDrawerOpen,
    setSelectedAirlinePrice,
}: FlightDetailProps) {
    const findLastSegment = (journey: Journey[]) => journey[journey.length - 1];
    return (
        <Col className="mb-5" span={24}>
            <Card
                className="border-0 rounded-[18px] search-result-card"
                styles={{ body: { padding: '4px' } }}
            >
                <Row justify="space-around" className="py-1">
                    <Col className="p-0 m-0" span={20}>
                        <Flex vertical gap={10}>
                        {item.journey.map((ele, i: number) => (
                            <Row justify="space-between" align="middle" key={i}>
                                <Col
                                    sm={8}
                                    md={4}
                                    className="border border-[#E9E7E7] h-36 ms-1 rounded-[18px] flex flex-col items-center justify-center"
                                >
                                    <DynamicImageCard flightSegments={ele} />
                                </Col>

                                <Col sm={24} md={19} className="py-4">
                                    <Row>
                                        <Col
                                            md={8}
                                            lg={8}
                                            className="flex flex-col items-center gap-1"
                                        >
                                            <Typography.Text className="md:text-sm font-normal text-center">
                                                {ele[0].Origin.Airport.CityName}
                                                {/* {retrieveAirport(ele[0].Origin.Airport.AirportCode)} */}
                                            </Typography.Text>

                                            <Typography.Text className="font-medium md:text-xl mt-1">
                                                {formattedTimeOnly(new Date(ele[0].Origin.DepTime))}
                                            </Typography.Text>
                                            <Typography.Text className="md:text-xs font-normal text-center">
                                                {formattedDateOnly(new Date(ele[0].Origin.DepTime))}
                                            </Typography.Text>
                                        </Col>
                                        <Col md={8} lg={8} className="w-full">
                                            <Flex
                                                vertical
                                                className="w-full h-full mt-2"
                                                justify="center"
                                                align="center"
                                            >
                                                <FlightDurationBadge
                                                    duration={calculateDuration(ele)}
                                                />
                                                <LayoverTooltip segments={ele}>
                                                    <Typography.Text className="text-brandColor text-xs mt-3 block w-full truncate text-center">
                                                        {formatStopQuantityWithCities(ele)}
                                                    </Typography.Text>
                                                </LayoverTooltip>
                                            </Flex>
                                        </Col>
                                        <Col
                                            md={8}
                                            lg={8}
                                            className="flex flex-col items-center gap-1"
                                        >
                                            <Typography.Text className="md:text-sm font-normal text-center line-clamp-1">
                                                {
                                                    // {retrieveAirport(
                                                    //     findLastSegment(ele).Destination.Airport
                                                    //         .AirportCode
                                                    // )}
                                                    findLastSegment(ele).Destination.Airport
                                                        .CityName
                                                }
                                            </Typography.Text>
                                            <Typography.Text className="font-medium md:text-xl mt-1">
                                                {formattedTimeOnly(
                                                    new Date(
                                                        findLastSegment(ele).Destination.ArrTime
                                                    )
                                                )}
                                            </Typography.Text>
                                            <Typography.Text className="text-xs font-normal text-center">
                                                {formattedDateOnly(
                                                    new Date(
                                                        findLastSegment(ele).Destination.ArrTime
                                                    )
                                                )}
                                            </Typography.Text>
                                        </Col>
                                    </Row>
                                </Col>
                                {item.journey.length - 1 !== i && (
                                    <Flex className="w-full justify-end">
                                        <div className="w-[80%] border-b" />
                                    </Flex>
                                )}
                            </Row>
                        ))}
                        </Flex>
                    </Col>
                    <Col
                        md={2}
                        lg={4}
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
                                <Typography.Text className="font-semibold sm:text-base md:text-lg whitespace-nowrap">
                                    ₹ {formatNumberWithLocalString(item.price)}
                                </Typography.Text>
                                {/* {item.seatsAvailable !== undefined && item.seatsAvailable <= 9 && (
                                    <Typography.Text className="text-xs text-orange-500 font-medium">
                                        Only {item.seatsAvailable} left!
                                    </Typography.Text>
                                )} */}
                            </Flex>
                            <Button
                                onClick={() => handleClick(item)}
                                danger
                                className="flex justify-center"
                                type="primary"
                            >
                                Book Now
                            </Button>
                            <Typography.Text
                                onClick={() => {
                                    setDrawerDetails(item);
                                    setSelectedAirlinePrice(Number(item.price));
                                    setIsDrawerOpen(true);
                                }}
                                className="text-red-500 cursor-pointer text-[10px] flex justify-center items-center mt-2"
                            >
                                Flight Details <RightOutlined className="ms-1" />
                            </Typography.Text>
                        </Flex>
                    </Col>
                </Row>
            </Card>
        </Col>
    );
}

export default SearchResultCard;
