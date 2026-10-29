/* eslint-disable no-nested-ternary */
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Col, Flex, Progress, Row, Typography } from 'antd';
import dayjs from 'dayjs';
import Lottie from 'react-lottie';
import { useDispatch } from 'react-redux';

import { useAppSelector } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';

import { useFareCalendar } from '../../hooks/useFareCalendar';
import useHandleAirlineSearch from '../../hooks/useHandleAirlineSearch';
import { useGetOneWaySearch } from '../../hooks/useSearchOneWayApi';
import WebSearchResults from '../../pages/WebSearchResults';
import { resetBookingData, resetpriceRange, resetSelectedAirlines, setfilghtResponse,
    setInbountFlightResponse, } from '../../slices/airlineSlice';
import { Flight } from '../../types/Flight';
import { noFlightResults } from '../../utils/lottie';
import HeadSearchResultMobile from '../adaptive/HeadSearchResultMobile';
import FilterComponent from '../FilterComponent';
import HeadSearchResult from '../HeadSearchResult';
import MobileResultBody from './MobileResultBody';

// Memoized components to prevent re-renders when form values change
const MemoizedWebSearchResults = React.memo(
    WebSearchResults,
    (prevProps, nextProps) => {
        // Only re-render if search results data actually changes
        const flightDataChanged = prevProps.flightData !== nextProps.flightData;
        const dataSourceChanged = prevProps.dataSource !== nextProps.dataSource;
        const inbountFlightsChanged = prevProps.inbountFlights !== nextProps.inbountFlights;
        const searchParamsChanged =
            prevProps.searchParams?.depart1 !== nextProps.searchParams?.depart1 ||
            prevProps.searchParams?.arrive !== nextProps.searchParams?.arrive ||
            prevProps.searchParams?.fromLocation1 !== nextProps.searchParams?.fromLocation1 ||
            prevProps.searchParams?.toLocation1 !== nextProps.searchParams?.toLocation1;
        const filterChanged =
            prevProps.filterValue.type !== nextProps.filterValue.type ||
            prevProps.filterValue.highest !== nextProps.filterValue.highest ||
            prevProps.inbountFilterValue.type !== nextProps.inbountFilterValue.type ||
            prevProps.inbountFilterValue.highest !== nextProps.inbountFilterValue.highest;
        const loadingChanged =
            prevProps.isLoading !== nextProps.isLoading ||
            prevProps.filterLoading !== nextProps.filterLoading;
        const priceMapChanged = prevProps.priceMap !== nextProps.priceMap;
        const fareCalendarLoadingChanged = prevProps.fareCalendarLoading !== nextProps.fareCalendarLoading;

        // Re-render only if search results, search params, filters, or loading state changed
        return (
            !flightDataChanged &&
            !dataSourceChanged &&
            !inbountFlightsChanged &&
            !searchParamsChanged &&
            !filterChanged &&
            !loadingChanged &&
            !priceMapChanged &&
            !fareCalendarLoadingChanged
        );
    }
);

const MemoizedMobileResultBody = React.memo(
    MobileResultBody,
    (prevProps, nextProps) => {
        const flightDataChanged = prevProps.flightData !== nextProps.flightData;
        const inbountFlightsChanged = prevProps.inbountFlights !== nextProps.inbountFlights;
        const searchParamsChanged =
            prevProps.searchParams?.depart1 !== nextProps.searchParams?.depart1 ||
            prevProps.searchParams?.arrive !== nextProps.searchParams?.arrive ||
            prevProps.searchParams?.fromLocation1 !== nextProps.searchParams?.fromLocation1 ||
            prevProps.searchParams?.toLocation1 !== nextProps.searchParams?.toLocation1;
        const filterChanged =
            prevProps.filterValue.type !== nextProps.filterValue.type ||
            prevProps.filterValue.highest !== nextProps.filterValue.highest;
        const loadingChanged = prevProps.isLoading !== nextProps.isLoading;
        const nonStopChanged = prevProps.isNonStopOnly !== nextProps.isNonStopOnly;
        const priceMapChanged = prevProps.priceMap !== nextProps.priceMap;
        const fareCalendarLoadingChanged = prevProps.fareCalendarLoading !== nextProps.fareCalendarLoading;

        return (
            !flightDataChanged &&
            !inbountFlightsChanged &&
            !searchParamsChanged &&
            !filterChanged &&
            !loadingChanged &&
            !nonStopChanged &&
            !priceMapChanged &&
            !fareCalendarLoadingChanged
        );
    }
);

export default function SearchResultComponent() {
    const dispatch = useDispatch();
    const { md } = useScreenSize();
    const { handleAirlineSearch } = useHandleAirlineSearch();
    const { priceMap, isLoading: fareCalendarLoading, fetchFareCalendar } = useFareCalendar();
    const searchDataRedux = useAppSelector(state => state.reducer.airline.searchData);

    const [filterValue, setFilterValue] = useState({
        type: 'price',
        highest: true,
    });
    const [inbountFilterValue, setInbountFilterValue] = useState({
        type: 'price',
        highest: true,
    });

    const [filterLoading, setFilterLoading] = useState(false);

    const [flightData, setFlightData] = useState<Flight[]>([]); // filtered and sorted
    const [flightSearchRes, setFlightSearchRes] = useState<Flight[]>([]); // row flight details
    const [isNonStopOnly, setIsNonStopOnly] = useState<boolean>(false);

    const [rawInbount, setRawInbount] = useState<Flight[]>([]); // row flight details
    const [inbountFlights, setInbountFlights] = useState<Flight[]>([]); // filtered and sorted

    const [filterCount, setFilterCount] = useState({ lowestPrice: 0, highestPrice: 1000000 });
    const [searchParams, setSearchParams] = useState<{
        tripType?: number;
        fromLocation1?: string;
        toLocation1?: string;
        depart1?: string;
        arrive?: string;
        originCountryCode?: string;
        destinationCountryCode?: string;
    }>({});
    const { flightResponse, inbountFlightResponse } = useAppSelector(
        state => state.reducer.airline
    );

    const dataSource = useMemo(
        () => (flightSearchRes && flightSearchRes.length > 0 ? flightSearchRes : flightResponse),
        [flightSearchRes, flightResponse]
    );

    const {
        isLoading: loading,
        searchHandler,
        noResult,
        filterCount: count,
    } = useGetOneWaySearch();
    const [isLoading, setIsloading] = useState(true);
    const [progress, setProgress] = useState(0);
    useEffect(() => {
        // Clear stale flight results on mount so the spinner shows until the auto-search
        // returns fresh data. Prevents the brief flash of old flight cards from the
        // previous search when the user navigates back to this page.
        dispatch(setfilghtResponse([]));
        dispatch(setInbountFlightResponse([]));
        dispatch(resetBookingData({}));
        setIsloading(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (flightResponse.length > 0) {
            setIsloading(false);
            setFlightData(flightResponse);
        }
    }, [flightResponse]);

    useEffect(() => {
        let interval: string | number | NodeJS.Timeout | undefined;
        if (isLoading) {
            setProgress(0); // Start from 0
            interval = setInterval(() => {
                setProgress(prevProgress => {
                    if (prevProgress >= 100) {
                        clearInterval(interval);
                        return 100;
                    }
                    return prevProgress + 1;
                });
            }, 100);
        } else {
            setProgress(0); // Reset to 0 when loading stops
        }

        // Cleanup on `isLoading` change or component unmount
        return () => clearInterval(interval);
    }, [isLoading]);

    useEffect(() => {
        if (!rawInbount || rawInbount.length === 0) {
            setRawInbount(inbountFlightResponse);
        }
        setInbountFlights(rawInbount);
    }, [rawInbount, inbountFlightResponse]);

    const handleSearchComplete = useCallback(
        (tripData: any) => {
            if (!tripData?.fromLocation1 || !tripData?.toLocation1 || !tripData?.depart1) return;
            if (tripData.tripType === 3) return;
            fetchFareCalendar({
                tripType: tripData.tripType,
                flightSegments: [
                    {
                        Origin: tripData.fromLocation1,
                        Destination: tripData.toLocation1,
                        FlightCabinClass: tripData.class,
                        PreferredDepartureTime: dayjs(tripData.depart1, 'DD-MM-YYYY').format(
                            'YYYY-MM-DDTHH:mm:ss'
                        ),
                    },
                ],
                passengerData: {
                    adultCount: tripData.adults,
                    childCount: tripData.children,
                    infantCount: tripData.infants,
                },
            });
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    const handleDateSelect = useCallback(
        async (newDate: string) => {
            if (loading) return;
            const tripData = {
                tripType: searchDataRedux.tripType,
                fromLocation: searchDataRedux.fromLocation,
                toLocation: searchDataRedux.toLocation,
                depart: searchDataRedux.depart,
                departDay: searchDataRedux.departDay,
                arrive: searchDataRedux.arrive,
                arriveDay: searchDataRedux.arriveDay,
                fromLocation1: searchDataRedux.fromLocation1,
                toLocation1: searchDataRedux.toLocation1,
                depart1: newDate,
                departDay1: dayjs(newDate, 'DD-MM-YYYY').format('dddd'),
                arrive1: searchDataRedux.arrive1,
                arriveDay1: searchDataRedux.arriveDay1,
                adults: searchDataRedux.adults,
                children: searchDataRedux.children,
                infants: searchDataRedux.infants,
                class: searchDataRedux.class,
                originCountryCode: searchDataRedux.originCountryCode,
                destinationCountryCode: searchDataRedux.destinationCountryCode,
            };
            setFilterValue({ type: 'price', highest: true });
            setInbountFilterValue({ type: 'price', highest: true });
            dispatch(resetpriceRange());
            dispatch(resetSelectedAirlines({}));
            setProgress(0);
            setIsloading(true);

            const search = handleAirlineSearch(tripData);
            if (search.status) {
                const res = await searchHandler(search.data);
                if (res) {
                    setFlightData(res.outbount);
                    setFlightSearchRes(res.outbount);
                    setRawInbount(res.inbount);
                    setSearchParams(prev => ({ ...prev, depart1: newDate }));
                }
            }
            setIsloading(false);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [loading, searchDataRedux]
    );

    return (
        <Row>
            <Col span={24}>
                <Flex vertical gap={16}>
                    {md ? (
                        <HeadSearchResult
                            setFlightResData={setFlightSearchRes}
                            setFlightData={setFlightData}
                            setInboutFlights={setRawInbount}
                            setIsloading={setIsloading}
                            setProgress={setProgress}
                            setFilterCount={setFilterCount}
                            isLoading={loading}
                            searchHandler={searchHandler}
                            setFilterValue={setFilterValue}
                            setInbountFilterValue={setInbountFilterValue}
                            setSearchParams={setSearchParams}
                            onSearchComplete={handleSearchComplete}
                        />
                    ) : (
                        <HeadSearchResultMobile
                            setFlightResData={setFlightSearchRes}
                            setFlightData={setFlightData}
                            setInboutFlights={setRawInbount}
                            setIsloading={setIsloading}
                            setProgress={setProgress}
                            setFilterCount={setFilterCount}
                            isLoading={loading}
                            searchHandler={searchHandler}
                            filterCount={count}
                            setSearchParams={setSearchParams}
                            onSearchComplete={handleSearchComplete}
                        />
                    )}
                    {isLoading && (
                        <Progress percent={progress} status="exception" showInfo={false} />
                    )}

                    <Flex vertical gap={20}>
                        {noResult ? (
                            <Flex
                                vertical
                                justify="center"
                                align="center"
                                className="h-full mt-10 full md:mt-28"
                            >
                                <Lottie
                                    options={noFlightResults}
                                    height={md ? 200 : 100}
                                    width={md ? 400 : 150}
                                />
                                <Typography.Text className="mt-6 text-center md:text-sm">
                                    We couldn&apos;t find any flights matching your search criteria.
                                    <br />
                                    Please try adjusting your search filters, such as travel dates
                                    or destinations, and search again.
                                </Typography.Text>
                            </Flex>
                        ) : md ? (
                            <MemoizedWebSearchResults
                                isLoading={isLoading}
                                filterValue={filterValue}
                                setFilterValue={setFilterValue}
                                inbountFilterValue={inbountFilterValue}
                                setInbountFilterValue={setInbountFilterValue}
                                dataSource={dataSource}
                                inbountFlights={inbountFlights}
                                flightData={flightData}
                                filterLoading={filterLoading}
                                searchParams={searchParams}
                                priceMap={priceMap}
                                fareCalendarLoading={fareCalendarLoading}
                                onDateSelect={handleDateSelect}
                                filterComponent={
                                    <FilterComponent
                                        setFilterLoading={setFilterLoading}
                                        flightsData={flightData}
                                        setFlightData={setFlightData}
                                        filterCount={filterCount}
                                        data={dataSource}
                                        filterValue={filterValue}
                                        inbountFilterValue={inbountFilterValue}
                                        setInbountFilterValue={setInbountFilterValue}
                                        setFilterValue={setFilterValue}
                                        rawInbount={rawInbount}
                                        inbountFlights={inbountFlights}
                                        setInbountFlights={setInbountFlights}
                                        isMultiCity={searchParams?.tripType === 3}
                                    />
                                }
                            />
                        ) : (
                            <MemoizedMobileResultBody
                                isLoading={isLoading}
                                flightData={flightData}
                                filterValue={filterValue}
                                setFilterValue={setFilterValue}
                                setFlightData={setFlightData}
                                inbountFlights={inbountFlights}
                                isNonStopOnly={isNonStopOnly}
                                setIsNonStopOnly={setIsNonStopOnly}
                                searchParams={searchParams}
                                priceMap={priceMap}
                                fareCalendarLoading={fareCalendarLoading}
                                onDateSelect={handleDateSelect}
                                filterComponent={
                                    <FilterComponent
                                        setFilterLoading={setFilterLoading}
                                        flightsData={flightData}
                                        setFlightData={setFlightData}
                                        filterCount={filterCount}
                                        data={dataSource}
                                        filterValue={filterValue}
                                        inbountFilterValue={inbountFilterValue}
                                        setInbountFilterValue={setInbountFilterValue}
                                        setFilterValue={setFilterValue}
                                        rawInbount={rawInbount}
                                        inbountFlights={inbountFlights}
                                        setInbountFlights={setInbountFlights}
                                        isNonStopOnly={isNonStopOnly}
                                        setIsNonStopOnly={setIsNonStopOnly}
                                        isMultiCity={searchParams?.tripType === 3}
                                    />
                                }
                            />
                        )}
                    </Flex>
                </Flex>
            </Col>
        </Row>
    );
}
