import React, { useEffect, useState } from 'react';

import { Button, Card, Col, Divider, Flex, Image, Pagination, Row, Typography } from 'antd';
import dayjs from 'dayjs';
import Lottie from 'react-lottie';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import useScrollUpOnPageChange from '@src/hooks/useScrollTopOnPageChange';
import { paths } from '@src/routes/paths';

import { setSelectedAirline, setSelectedInbountAirline } from '../../slices/airlineSlice';
import { Flight } from '../../types/Flight';
import { formattedTimeWithMeridian } from '../../utils/dateTime';
import { noFlightResults } from '../../utils/lottie';
import FlightInfoDrawer from '../FlightInfoDrawer';
import NonLccTag from '../NonLccTag';

interface FlightDetailProps {
    flights: Flight[] | undefined;
    inbountFlights: Flight[];
}

const { Text } = Typography;

function SearchResultCardMobile({ flights, inbountFlights }: FlightDetailProps) {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [drawerDetails, setDrawerDetails] = useState<Flight>();
    const [selectedAirlinePrice, setSelectedAirlinePrice] = useState<number>();
    const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
    const { searchData: airlineSearchData } = useAppSelector(state => state.reducer.airline);
    const { selectedAirline, selectedInbountAirline } = useAppSelector(
        state => state.reducer.airline
    );
    const [isDomesticRoundTrip, setIsDomesticRoundTrip] = useState(false);

    const price = (selectedAirline?.price || 0) + (selectedInbountAirline?.price || 0);

    useEffect(() => {
        if (airlineSearchData.destinationCountryCode && airlineSearchData.originCountryCode) {
            const isDRT =
                airlineSearchData.destinationCountryCode === airlineSearchData.originCountryCode &&
                airlineSearchData.originCountryCode === 'IN' &&
                airlineSearchData.tripType === 2;
            setIsDomesticRoundTrip(isDRT);
        }
    }, [airlineSearchData]);

    // Pagination states
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [currentInbountPage, setCurrentInbountPage] = useState<number>(1);
    const itemsPerPage = 5; // Number of items per page

    const selectedInbountResultIndex = selectedInbountAirline?.ResultIndex;

    const selectedResultIndex = selectedAirline?.ResultIndex;

    const handleClickIsbount = (item: Flight) => {
        const data = item;

        dispatch(setSelectedInbountAirline(data));

        if (!isDomesticRoundTrip) {
            navigate(
                `${paths.dashboard.corporateTravel}/${paths.airline.index}/${paths.airline.results}/${paths.airline.details}`
            );
        }
    };
    const handleClick = (item: Flight) => {
        const data = item;

        dispatch(setSelectedAirline(data));

        if (!isDomesticRoundTrip) {
            navigate(
                `${paths.dashboard.corporateTravel}/${paths.airline.index}/${paths.airline.results}/${paths.airline.details}`
            );
        }
    };
    const handleBookNow = () => {
        navigate(
            `${paths.dashboard.corporateTravel}/${paths.airline.index}/${paths.airline.results}/${paths.airline.details}`
        );
    };
    const formatDuration = (minutes: number): string => {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;

        if (hours > 0 && remainingMinutes > 0) {
            return `${hours}h ${remainingMinutes}m`;
        }
        if (hours > 0) {
            return `${hours}h`;
        }
        return `${remainingMinutes}m`;
    };

    // Paginate flights
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedFlights = flights?.slice(startIndex, endIndex) || [];

    // Paginate inbountFlights
    const startInbountIndex = (currentInbountPage - 1) * itemsPerPage;
    const endInbountIndex = startInbountIndex + itemsPerPage;
    const paginatedInbountFlights = inbountFlights?.slice(startInbountIndex, endInbountIndex) || [];
    const [expandedColumn, setExpandedColumn] = useState('left'); // 'left' or 'right'

    useEffect(() => {
        setCurrentPage(1);
        setCurrentInbountPage(1);
    }, [flights]);
    useScrollUpOnPageChange(currentPage);
    useScrollUpOnPageChange(currentInbountPage);

    const handleRightColumnClick = () => {
        setExpandedColumn('right');
    };

    const handleLeftColumnClick = () => {
        setExpandedColumn('left');
    };

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
                    <Flex className="w-full">
                        <Flex justify="space-between" className="mb-4 w-full">
                            {/* Left Column – TRV ⇌ HYD */}
                            <Col
                                xs={expandedColumn === 'left' ? 15 : 9} // 75% when expanded, 25% when not
                                sm={12} // 75% when expanded, 25% when not
                                md={12}
                                onClick={handleLeftColumnClick}
                                style={{ cursor: 'pointer' }}
                                className="w-full"
                            >
                                <Card
                                    className="rounded-md bg-gray-200 p-0"
                                    bodyStyle={{ padding: '8px' }}
                                >
                                    <Flex vertical align="start" gap={4} className="w-full">
                                        <Text strong className="text-[9px] xs375:text-[12px]">
                                            {paginatedFlights[0].onPoint} ⇌ {'  '}
                                            {paginatedFlights[0].offPoint}
                                        </Text>
                                        <Text className="xs375:text-[12px] text-[9px]">
                                            {dayjs(
                                                paginatedFlights[0].arrive.datetime,
                                                'YYYY-MM-DD'
                                            ).format('ddd, MMM D')}
                                        </Text>
                                    </Flex>
                                </Card>

                                {paginatedFlights.map((flight, index) => {
                                    const segments = flight.journey[0];
                                    const first = segments[0];
                                    const last = segments[segments.length - 1];

                                    return expandedColumn === 'left' ? (
                                        <Card
                                            key={index}
                                            className={`mt-2 h-[125px] xs375:h-[142px] w-full rounded-md border p-0 cursor-pointer hover:shadow-md ${
                                                selectedResultIndex === flight.ResultIndex
                                                    ? 'border-[#ff4d4f]'
                                                    : 'border-gray-300'
                                            }`}
                                            bodyStyle={{ padding: '12px' }}
                                            onClick={() => {
                                                handleClick(flight);
                                                setSelectedAirlinePrice(flight.price);
                                            }}
                                        >
                                            <Flex justify="space-between" align="start">
                                                <Flex vertical flex={1}>
                                                    {/* Airline name */}
                                                    <Flex align="center" className="mb-1">
                                                        <Image
                                                            src={flight.logo}
                                                            alt="Airline Logo"
                                                            preview={false}
                                                            width={24}
                                                            height={24}
                                                            style={{ objectFit: 'contain' }}
                                                            className="mr-2"
                                                        />
                                                        <Text
                                                            strong
                                                            className="xs375:text-[12px] text-[9px]"
                                                        >
                                                            {first.Airline.AirlineName}
                                                        </Text>
                                                    </Flex>
                                                    {/* Flight times */}
                                                    <Flex
                                                        justify="space-between"
                                                        align="center"
                                                        className="mb-1"
                                                    >
                                                        <Flex vertical align="start">
                                                            <Text className="font-semibold xs375:text-[12px] text-[9px]">
                                                                {formattedTimeWithMeridian(
                                                                    new Date(first.Origin.DepTime)
                                                                )}
                                                            </Text>
                                                            <Text className="block xs375:text-[12px] text-[9px] text-gray-500">
                                                                {first.Origin.Airport.AirportCode} •{' '}
                                                                {dayjs(first.Origin.DepTime).format(
                                                                    'MMM D'
                                                                )}
                                                            </Text>
                                                        </Flex>

                                                        <Flex vertical align="center">
                                                            <Text className="text-[8px] xs375:text-[10px] text-gray-500">
                                                                {formatDuration(
                                                                    flight.flightDuration
                                                                )}
                                                            </Text>
                                                            <Divider className="my-1" />
                                                        </Flex>

                                                        <Flex vertical align="end">
                                                            <Text className="font-semibold xs375:text-[12px] text-[9px]">
                                                                {formattedTimeWithMeridian(
                                                                    new Date(
                                                                        last.Destination.ArrTime
                                                                    )
                                                                )}
                                                            </Text>
                                                            <Text className="block text-[9px] xs375:text-[12px] text-gray-500">
                                                                {
                                                                    last.Destination.Airport
                                                                        .AirportCode
                                                                }{' '}
                                                                •{' '}
                                                                {dayjs(
                                                                    last.Destination.ArrTime
                                                                ).format('MMM D')}
                                                            </Text>
                                                        </Flex>
                                                    </Flex>

                                                    <Flex
                                                        justify="space-between"
                                                        className="mb-1 w-full"
                                                    >
                                                        <Text className="text-[9px] xs375:text-[12px] font-bold">
                                                            ₹ {flight.price.toFixed(2)}
                                                        </Text>
                                                        <NonLccTag lcc={flight.lcc} />
                                                    </Flex>

                                                    <Flex
                                                        justify="space-between"
                                                        className="w-full"
                                                    >
                                                        <Button
                                                            type="link"
                                                            className={` text-[9px] xs375:text-[12px] p-0 h-auto text-bgOrange2`}
                                                            onClick={() => {
                                                                setDrawerDetails(flight);
                                                                setIsDrawerOpen(true);
                                                            }}
                                                        >
                                                            Flight Details
                                                        </Button>
                                                    </Flex>
                                                </Flex>
                                            </Flex>
                                        </Card>
                                    ) : (
                                        <Card
                                            key={index}
                                            className={`mt-2 h-[125px] xs375:h-[142px] w-full rounded-md border p-0 cursor-pointer hover:shadow-md ${
                                                selectedResultIndex === flight.ResultIndex
                                                    ? 'border-[#ff4d4f]'
                                                    : 'border-gray-300'
                                            }`}
                                            bodyStyle={{ padding: '12px' }}
                                            onClick={() => {
                                                handleClickIsbount(flight);
                                                setSelectedAirlinePrice(flight.price);
                                            }}
                                        >
                                            <Flex justify="space-between" align="start">
                                                <Flex vertical flex={1}>
                                                    {/* Airline name */}
                                                    <Flex align="center" className="mb-1">
                                                        <Image
                                                            src={flight.logo}
                                                            alt="Airline Logo"
                                                            preview={false}
                                                            width={24}
                                                            height={24}
                                                            style={{ objectFit: 'contain' }}
                                                            className="mr-2"
                                                        />
                                                        <Text
                                                            strong
                                                            className="text-[9px] xs375:text-[11px]"
                                                        >
                                                            {first.Airline.AirlineName}
                                                        </Text>
                                                    </Flex>
                                                    {/* Flight times */}
                                                    <Flex
                                                        vertical
                                                        justify="space-between"
                                                        align="start"
                                                        className="mb-1"
                                                    >
                                                        <Flex vertical align="start">
                                                            <Text className="font-semibold text-[9px] xs375:text-[10px]">
                                                                {formattedTimeWithMeridian(
                                                                    new Date(first.Origin.DepTime)
                                                                )}
                                                            </Text>
                                                            <Text className="block text-[9px] xs375:text-[9px] text-gray-500">
                                                                {first.Origin.Airport.AirportCode} •{' '}
                                                                {dayjs(first.Origin.DepTime).format(
                                                                    'MMM D'
                                                                )}
                                                            </Text>
                                                        </Flex>

                                                        <Flex vertical align="start">
                                                            <Text className="font-semibold text-[9px] xs375:text-[10px]">
                                                                {formattedTimeWithMeridian(
                                                                    new Date(
                                                                        last.Destination.ArrTime
                                                                    )
                                                                )}
                                                            </Text>
                                                            <Text className="block text-[9px] xs375:text-[9px] text-gray-500">
                                                                {
                                                                    last.Destination.Airport
                                                                        .AirportCode
                                                                }{' '}
                                                                •{' '}
                                                                {dayjs(
                                                                    last.Destination.ArrTime
                                                                ).format('MMM D')}
                                                            </Text>
                                                        </Flex>
                                                    </Flex>

                                                    <Flex
                                                        justify="space-between"
                                                        className="mb-1 w-full"
                                                    >
                                                        <Text className="text-[9px] xs375:text-[11px] font-bold">
                                                            ₹ {flight.price.toFixed(2)}
                                                        </Text>
                                                        <NonLccTag lcc={flight.lcc} />
                                                    </Flex>
                                                </Flex>
                                            </Flex>
                                        </Card>
                                    );
                                })}
                                <Col span={24} className="flex justify-center mt-4">
                                    {flights && flights.length > 0 && (
                                        <Pagination
                                            size="small"
                                            current={currentPage}
                                            pageSize={itemsPerPage}
                                            total={flights.length}
                                            onChange={page => setCurrentPage(page)}
                                            className="mt-4"
                                            showLessItems
                                            itemRender={(page, type, originalElement) => {
                                                if (type === 'prev' || type === 'next') {
                                                    return originalElement;
                                                }
                                                return null; // hide page numbers
                                            }}
                                        />
                                    )}
                                </Col>
                            </Col>

                            {/* Right Column – HYD ⇌ TRV */}
                            <Col
                                // xs={12} md={12}
                                xs={expandedColumn === 'right' ? 15 : 9} // 75% when expanded, 25% when not
                                sm={12} // 75% when expanded, 25% when not
                                md={12}
                                onClick={handleRightColumnClick}
                                style={{ cursor: 'pointer' }}
                            >
                                <Card
                                    className="rounded-md bg-gray-200 p-0"
                                    bodyStyle={{ padding: '8px' }}
                                >
                                    <Flex vertical align="start" gap={4} className="w-full">
                                        <Text strong className="text-[9px] xs375:text-[12px]">
                                            {inbountFlights[0].onPoint} ⇌ {'  '}
                                            {inbountFlights[0].offPoint}
                                        </Text>
                                        <Text className="xs375:text-[12px] text-[9px]">
                                            {dayjs(
                                                inbountFlights[0].depart.datetime,
                                                'YYYY-MM-DD'
                                            ).format('ddd, MMM D')}
                                        </Text>
                                    </Flex>
                                </Card>

                                {paginatedInbountFlights.map((flight, index) => {
                                    const segments = flight.journey[0];
                                    const first = segments[0];
                                    const last = segments[segments.length - 1];
                                    return (
                                        // right individual card

                                        expandedColumn === 'right' ? (
                                            <Card
                                                key={index}
                                                className={`mt-2 h-[125px] xs375:h-[142px] w-full  rounded-md border p-0 cursor-pointer hover:shadow-md ${
                                                    selectedInbountResultIndex ===
                                                    flight.ResultIndex
                                                        ? 'border-[#ff4d4f]'
                                                        : 'border-gray-300'
                                                }`}
                                                bodyStyle={{ padding: '12px' }}
                                                onClick={() => {
                                                    handleClickIsbount(flight);
                                                    setSelectedAirlinePrice(flight.price);
                                                }}
                                            >
                                                <Flex justify="space-between" align="start">
                                                    <Flex vertical flex={1}>
                                                        {/* Airline name */}
                                                        <Flex align="center" className="mb-1">
                                                            <Image
                                                                src={flight.logo}
                                                                alt="Airline Logo"
                                                                preview={false}
                                                                width={24}
                                                                height={24}
                                                                style={{ objectFit: 'contain' }}
                                                                className="mr-2"
                                                            />
                                                            <Text
                                                                strong
                                                                className="text-[9px] xs375:text-[12px]"
                                                            >
                                                                {first.Airline.AirlineName}
                                                            </Text>
                                                        </Flex>

                                                        {/* Flight times */}
                                                        <Flex
                                                            justify="space-between"
                                                            gap={10}
                                                            align="center"
                                                        >
                                                            <Flex vertical align="start">
                                                                <Text className="font-semibold text-[9px] xs375:text-[12px]">
                                                                    {formattedTimeWithMeridian(
                                                                        new Date(
                                                                            first.Origin.DepTime
                                                                        )
                                                                    )}
                                                                </Text>
                                                                <Text className="block text-[9px] xs375:text-[12px] text-gray-500">
                                                                    {
                                                                        first.Origin.Airport
                                                                            .AirportCode
                                                                    }{' '}
                                                                    •{' '}
                                                                    {dayjs(
                                                                        first.Origin.DepTime
                                                                    ).format('MMM D')}
                                                                </Text>
                                                            </Flex>

                                                            <Flex
                                                                vertical
                                                                align="center"
                                                                className={`${expandedColumn !== 'right' ? 'hidden' : ''}`}
                                                            >
                                                                <Text className="text-[8px] xs375:text-[10px] text-gray-500">
                                                                    {formatDuration(
                                                                        flight.flightDuration
                                                                    )}
                                                                </Text>
                                                                <Divider className="my-1" />
                                                            </Flex>

                                                            <Flex
                                                                vertical
                                                                align="end"
                                                                className={`${expandedColumn !== 'right' ? 'hidden' : ''}`}
                                                            >
                                                                <Text className="font-semibold text-[9px] xs375:text-[12px]">
                                                                    {formattedTimeWithMeridian(
                                                                        new Date(
                                                                            last.Destination.ArrTime
                                                                        )
                                                                    )}
                                                                </Text>
                                                                <Text className="block text-[9px] xs375:text-[12px] text-gray-500">
                                                                    {
                                                                        last.Destination.Airport
                                                                            .AirportCode
                                                                    }{' '}
                                                                    •{' '}
                                                                    {dayjs(
                                                                        last.Destination.ArrTime
                                                                    ).format('MMM D')}
                                                                </Text>
                                                            </Flex>
                                                        </Flex>

                                                        <Flex
                                                            justify="space-between"
                                                            className="mb-1 w-full"
                                                        >
                                                            <Text className="text-[9px] xs375:text-[12px] font-bold">
                                                                ₹ {flight.price.toFixed(2)}
                                                            </Text>
                                                            <NonLccTag lcc={flight.lcc} />
                                                        </Flex>
                                                        <Flex
                                                            justify="space-between"
                                                            className=" w-full"
                                                        >
                                                            <Button
                                                                type="link"
                                                                className={`${expandedColumn !== 'right' ? 'hidden' : ''} text-[9px] xs375:text-[12px] p-0 h-auto text-bgOrange2`}
                                                                onClick={() => {
                                                                    setDrawerDetails(flight);
                                                                    setIsDrawerOpen(true);
                                                                }}
                                                            >
                                                                Flight Details
                                                            </Button>
                                                        </Flex>
                                                    </Flex>
                                                </Flex>
                                            </Card>
                                        ) : (
                                            <Card
                                                key={index}
                                                className={`mt-2 h-[125px] xs375:h-[142px] w-full rounded-md border p-0 cursor-pointer hover:shadow-md ${
                                                    selectedResultIndex === flight.ResultIndex
                                                        ? 'border-[#ff4d4f]'
                                                        : 'border-gray-300'
                                                }`}
                                                bodyStyle={{ padding: '12px' }}
                                                onClick={() => {
                                                    handleClickIsbount(flight);
                                                    setSelectedAirlinePrice(flight.price);
                                                }}
                                            >
                                                <Flex justify="space-between" align="start">
                                                    <Flex vertical flex={1}>
                                                        {/* Airline name */}
                                                        <Flex align="center" className="mb-1">
                                                            <Image
                                                                src={flight.logo}
                                                                alt="Airline Logo"
                                                                preview={false}
                                                                width={24}
                                                                height={24}
                                                                style={{ objectFit: 'contain' }}
                                                                className="mr-2"
                                                            />
                                                            <Text
                                                                strong
                                                                className="text-[9px] xs375:text-[11px]"
                                                            >
                                                                {first.Airline.AirlineName}
                                                            </Text>
                                                        </Flex>

                                                        {/* Flight times */}
                                                        <Flex
                                                            vertical
                                                            justify="space-between"
                                                            align="start"
                                                            className="mb-1"
                                                        >
                                                            <Flex vertical align="start">
                                                                <Text className="font-semibold text-[9px] xs375:text-[10px]">
                                                                    {formattedTimeWithMeridian(
                                                                        new Date(
                                                                            first.Origin.DepTime
                                                                        )
                                                                    )}
                                                                </Text>
                                                                <Text className="block text-[9px] xs375:text-[9px] text-gray-500">
                                                                    {
                                                                        first.Origin.Airport
                                                                            .AirportCode
                                                                    }{' '}
                                                                    •{' '}
                                                                    {dayjs(
                                                                        first.Origin.DepTime
                                                                    ).format('MMM D')}
                                                                </Text>
                                                            </Flex>

                                                            <Flex vertical align="start">
                                                                <Text className="font-semibold text-[9px] xs375:text-[10px]">
                                                                    {formattedTimeWithMeridian(
                                                                        new Date(
                                                                            last.Destination.ArrTime
                                                                        )
                                                                    )}
                                                                </Text>
                                                                <Text className="block text-[9px] xs375:text-[9px] text-gray-500">
                                                                    {
                                                                        last.Destination.Airport
                                                                            .AirportCode
                                                                    }{' '}
                                                                    •{' '}
                                                                    {dayjs(
                                                                        last.Destination.ArrTime
                                                                    ).format('MMM D')}
                                                                </Text>
                                                            </Flex>
                                                        </Flex>

                                                        <Flex
                                                            justify="space-between"
                                                            className="mb-1 w-full"
                                                        >
                                                            <Text className="text-[9px] xs375:text-[11px] font-bold">
                                                                ₹ {flight.price.toFixed(2)}
                                                            </Text>
                                                            <NonLccTag lcc={flight.lcc} />
                                                        </Flex>
                                                    </Flex>
                                                </Flex>
                                            </Card>
                                        )
                                    );
                                })}
                                <Col span={24} className="flex justify-center mt-4">
                                    {inbountFlights && inbountFlights.length > 0 && (
                                        <Pagination
                                            size="small"
                                            current={currentInbountPage}
                                            pageSize={itemsPerPage}
                                            total={inbountFlights.length}
                                            onChange={page => setCurrentInbountPage(page)}
                                            className="mt-4"
                                            showLessItems
                                            itemRender={(page, type, originalElement) => {
                                                if (type === 'prev' || type === 'next') {
                                                    return originalElement;
                                                }
                                                return null; // hide page numbers
                                            }}
                                        />
                                    )}
                                </Col>
                            </Col>
                            {/* </div> */}
                        </Flex>
                    </Flex>
                )}
                <Flex justify="space-between" align="center" className="w-full px-4 py-2">
                    <Flex vertical>
                        <Text className="text-sm text-gray-700">Total Amount</Text>
                        <Text strong className="text-xl text-black">
                            {price}
                        </Text>
                    </Flex>

                    <Button
                        key="submit"
                        type="primary"
                        onClick={handleBookNow}
                        className=" rounded-md px-6"
                        danger
                    >
                        Book Now
                    </Button>
                </Flex>
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
