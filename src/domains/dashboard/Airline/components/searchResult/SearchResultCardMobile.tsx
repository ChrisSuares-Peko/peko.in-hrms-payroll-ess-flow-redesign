import React, { useEffect, useState } from 'react';

import { DownOutlined, InfoCircleOutlined, RightOutlined } from '@ant-design/icons';
import { Button, Card, Col, Divider, Flex, Pagination, Row, Typography } from 'antd';
import dayjs from 'dayjs';
import Lottie from 'react-lottie';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch } from '@src/hooks/store';
import useScrollUpOnPageChange from '@src/hooks/useScrollTopOnPageChange';
import { paths } from '@src/routes/paths';
import { formatNumberWithLocalStringWithoutDecimalPoint } from '@utils/priceFormat';

import DynamicImageCard from './DynamicImageCard';
import { setSelectedAirline } from '../../slices/airlineSlice';
import { Flight } from '../../types/Flight';
import { formattedTimeOnly } from '../../utils/dateTime';
import {
    calculateDuration,
    formatDurationToHourMinute,
    formatStopQuantityWithCities,
} from '../../utils/formatDateCode';
import { noFlightResults } from '../../utils/lottie';
import FlightInfoDrawer from '../FlightInfoDrawer';
import LayoverTooltip from '../LayoverTooltip';
import NonLccTag from '../NonLccTag';

interface FlightDetailProps {
    flights: Flight[] | undefined;
}

const { Text } = Typography;

function SearchResultCardMobile({ flights }: FlightDetailProps) {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [drawerDetails, setDrawerDetails] = useState<Flight>();
    const [selectedAirlinePrice, setSelectedAirlinePrice] = useState<number>();
    const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

    // Pagination states
    const [currentPage, setCurrentPage] = useState<number>(1);
    const itemsPerPage = 5; // Number of items per page

    const handleClick = (item: Flight) => {
        dispatch(setSelectedAirline(item));
        navigate(
            `${paths.dashboard.corporateTravel}/${paths.airline.index}/${paths.airline.results}/${paths.airline.details}`
        );
    };

    // Paginate flights
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedFlights = flights?.slice(startIndex, endIndex) || [];
    useEffect(() => {
        setCurrentPage(1);
    }, [flights]);
    useScrollUpOnPageChange(currentPage);

    const findLastSegment = (journey: any) => journey[journey.length - 1];
    return (
        <>
            <Row gutter={16}>
                {flights?.length === 0 ? (
                    <Flex className="w-full h-full" vertical justify="center" align="center">
                        <Lottie options={noFlightResults} height={250} width={350} />
                        <Typography.Text className="text-base text-center">
                            Apologies, no flights found. Kindly consider refining your search or
                            exploring alternative destinations.
                        </Typography.Text>
                    </Flex>
                ) : (
                    paginatedFlights.map((item, index) => (
                        <Col key={index} span={24} className="mb-3">
                            <Card
                                className="rounded-xl border border-gray-200 shadow-sm"
                                styles={{ body: { padding: 12 } }}
                            >
                                {item.journey.map((ele, i) => (
                                    <div
                                        key={i}
                                        className={
                                            i > 0
                                                ? 'mt-3 pt-3 border-t border-dashed border-gray-200'
                                                : ''
                                        }
                                    >
                                        <Flex
                                            justify="space-between"
                                            align="flex-start"
                                            gap={8}
                                            className="mb-3"
                                        >
                                            <DynamicImageCard flightSegments={ele} horizontal />
                                            {i === 0 && (
                                                <Flex vertical align="end" className="shrink-0">
                                                    <NonLccTag lcc={item.lcc} className="mb-1" />
                                                    <Text className="font-bold text-base leading-none">
                                                        ₹
                                                        {formatNumberWithLocalStringWithoutDecimalPoint(
                                                            item.price
                                                        )}
                                                    </Text>
                                                    <Text className="text-[0.6rem] text-gray-500 mt-1">
                                                        Includes taxes and charges
                                                    </Text>
                                                </Flex>
                                            )}
                                        </Flex>

                                        <Row align="middle" justify="space-between">
                                            <Col span={7} className="flex flex-col items-start">
                                                <Text className="font-bold text-sm xs375:text-base">
                                                    {formattedTimeOnly(
                                                        new Date(ele[0].Origin.DepTime)
                                                    )}
                                                </Text>
                                                <Text className="text-xs text-gray-600 mt-0.5">
                                                    {ele[0].Origin.Airport.AirportCode}
                                                </Text>
                                                <Text className="text-[0.70rem] text-gray-500">
                                                    {dayjs(ele[0].Origin.DepTime).format('MMM D')}
                                                </Text>
                                            </Col>
                                            <Col
                                                span={10}
                                                className="flex flex-col items-center px-1"
                                            >
                                                <Text className="text-[0.7rem] text-gray-500">
                                                    {formatDurationToHourMinute(
                                                        calculateDuration(ele)
                                                    )}
                                                </Text>
                                                <Flex
                                                    align="center"
                                                    justify="center"
                                                    gap={4}
                                                    className="w-full my-1"
                                                >
                                                    <span className="flex-1 border-t border-gray-300" />
                                                    <svg
                                                        viewBox="0 0 24 24"
                                                        width="13"
                                                        height="13"
                                                        fill="currentColor"
                                                        className="text-gray-400 shrink-0"
                                                        style={{ transform: 'rotate(90deg)' }}
                                                    >
                                                        <path d="M22 16v-2l-8.5-5V3.5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5V9L2 14v2l8.5-2.5V19L8 20.5V22l4-1 4 1v-1.5L13.5 19v-4.5L22 16z" />
                                                    </svg>
                                                    <span className="flex-1 border-t border-gray-300" />
                                                </Flex>
                                                <LayoverTooltip segments={ele}>
                                                    <Text className="text-[0.7rem] text-gray-500 block w-full truncate text-center">
                                                        {formatStopQuantityWithCities(ele)}
                                                    </Text>
                                                </LayoverTooltip>
                                            </Col>
                                            <Col span={7} className="flex flex-col items-end">
                                                <Text className="font-bold text-sm xs375:text-base">
                                                    {formattedTimeOnly(
                                                        new Date(
                                                            findLastSegment(ele).Destination.ArrTime
                                                        )
                                                    )}
                                                </Text>
                                                <Text className="text-xs text-gray-600 mt-0.5">
                                                    {
                                                        findLastSegment(ele).Destination.Airport
                                                            .AirportCode
                                                    }
                                                </Text>
                                                <Text className="text-[0.70rem] text-gray-500">
                                                    {dayjs(
                                                        findLastSegment(ele).Destination.ArrTime
                                                    ).format('MMM D')}
                                                </Text>
                                            </Col>
                                        </Row>
                                    </div>
                                ))}

                                {item.isGSTMandatory && (
                                    <Flex align="center" gap={6} className="mt-2">
                                        <InfoCircleOutlined
                                            style={{ fontSize: 12 }}
                                            className="text-gray-400"
                                        />
                                        <Text className="text-[11px] text-gray-400">
                                            GST details required at booking
                                        </Text>
                                    </Flex>
                                )}

                                <Divider className="my-3" />

                                <Flex justify="space-between" align="center">
                                    <Flex
                                        align="center"
                                        gap={4}
                                        className="cursor-pointer"
                                        onClick={() => {
                                            setDrawerDetails(item);
                                            setSelectedAirlinePrice(Number(item.price));
                                            setIsDrawerOpen(true);
                                        }}
                                    >
                                        <Text className="text-blue-600 text-xs font-medium">
                                            Flight Details
                                        </Text>
                                        <DownOutlined className="text-blue-600 text-[10px]" />
                                    </Flex>
                                    <Button
                                        type="primary"
                                        danger
                                        className="rounded-md flex items-center"
                                        onClick={() => handleClick(item)}
                                    >
                                        Book Now <RightOutlined className="text-xs" />
                                    </Button>
                                </Flex>
                            </Card>
                        </Col>
                    ))
                )}
                <Col span={24} className="flex justify-center mt-4">
                    {flights && flights.length > itemsPerPage && (
                        <Pagination
                            simple
                            current={currentPage}
                            pageSize={itemsPerPage}
                            total={flights.length}
                            onChange={page => setCurrentPage(page)}
                        />
                    )}
                </Col>
            </Row>
            {isDrawerOpen && drawerDetails && (
                <FlightInfoDrawer
                    handleClose={() => setIsDrawerOpen(!isDrawerOpen)}
                    flightDetails={drawerDetails}
                    price={selectedAirlinePrice}
                    isDrawerOpen={isDrawerOpen}
                    handleSubmit={handleClick}
                />
            )}
        </>
    );
}

export default SearchResultCardMobile;
