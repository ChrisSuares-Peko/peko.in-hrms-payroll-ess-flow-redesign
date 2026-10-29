import { useEffect, useMemo, useState } from 'react';

import { Card, Flex, Pagination, Row, Typography } from 'antd';
import Lottie from 'react-lottie';
import { useNavigate } from 'react-router-dom';

import animation from '@assets/animation/Flight-Ticket-No-Result.json';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import AirlineCardSkeleton from './AirlineCardSkeleton';
import useScrollUpOnPageChange from '../../hooks/useScrollUpOnPageChange';
import {
    resetSelectAirline,
    resetSelectedInbountAirlne,
    setSelectedAirline,
    setSelectedInbountAirline,
} from '../../slices/airlineSlice';
import { Flight } from '../../types/Flight';
import { retrieveAirportName } from '../../utils/airlineData';
import { getFlightGroupKey } from '../../utils/flightGrouping';
import { retrieveFlightClass } from '../../utils/getFlightClass';
import { tripMethods } from '../../utils/options';
import FareSelectionModal from '../FareSelectionModal';
import FlightInfoDrawer from '../FlightInfoDrawer';
import SearchResultCard from '../SearchResultCard';
import SearchResultCardSmall from '../SearchResultCardSmall';

type GroupedFlight = Flight & { fareVariants: Flight[] };

const SearchResultBody = ({
    flights,
    isDomesticRoundTrip,
    isInbount,
    dataSource,
    filterLoading,
    isLoading,
    isMultiCity,
}: {
    flights: Flight[];
    isDomesticRoundTrip?: boolean;
    isInbount?: boolean;
    dataSource: Flight[];
    filterLoading: boolean;
    isLoading?: boolean;
    isMultiCity?: boolean;
}) => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [itemsPerPage] = useState<number>(7);

    const [selectedAirlinePrice, setSelectedAirlinePrice] = useState<number>();
    const [drawerDetails, setDrawerDetails] = useState<Flight>();
    const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
    const [fareModalFlight, setFareModalFlight] = useState<GroupedFlight | null>(null);

    const { selectedAirline, selectedInbountAirline, searchData } = useAppSelector(
        state => state.reducer.airline
    );

    // Shared by the direct-click selection below AND FareSelectionModal's onConfirm — flights
    // with multiple fare variants open that popup instead of selecting immediately (see
    // handleClick), so this has to be reachable from both call sites or the popup path never
    // fires flight_airline_selected at all.
    // PROTOTYPE-SETUP: MoEngage removed; this tracking-only helper is now a no-op.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const trackAirlineSelected = (_item: Flight) => {};

    const handleClick = (item: Flight) => {
        const grouped = item as GroupedFlight;
        if (!isDomesticRoundTrip && grouped.fareVariants && grouped.fareVariants.length > 1) {
            // console.log('[Airline] Fare variants for selected flight:', JSON.stringify(grouped.fareVariants));
            setFareModalFlight(grouped);
            return;
        }

        const data = item;
        if (isInbount) {
            if (selectedInbountAirline.ResultIndex === item.ResultIndex) {
                dispatch(resetSelectedInbountAirlne());
            } else {
                dispatch(setSelectedInbountAirline(data));
            }
        } else if (selectedAirline.ResultIndex === item.ResultIndex) {
            dispatch(resetSelectAirline());
        } else {
            dispatch(setSelectedAirline(data));
            trackAirlineSelected(item);
        }

        if (!isDomesticRoundTrip) {
            navigate(
                `${paths.dashboard.corporateTravel}/${paths.airline.index}/${paths.airline.results}/${paths.airline.details}`
            );
        }
    };

    const defaultOptions = {
        loop: true,
        autoplay: true,
        animationData: animation,
        rendererSettings: {
            preserveAspectRatio: 'xMidYMid slice',
        },
    };

    const groupedFlights = useMemo<GroupedFlight[]>(() => {
        const groups = new Map<string, GroupedFlight>();
        (flights || []).forEach(flight => {
            const key = getFlightGroupKey(flight, isMultiCity);
            if (groups.has(key)) {
                groups.get(key)!.fareVariants.push(flight);
            } else {
                groups.set(key, { ...flight, fareVariants: [flight] });
            }
        });
        return Array.from(groups.values());
    }, [flights, isMultiCity]);

    // Calculate paginated data
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedFlights = groupedFlights.slice(startIndex, endIndex);
    useScrollUpOnPageChange(currentPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [flights]);

    useEffect(() => {
        if (!flights || !flights.length) {
            if (isInbount) {
                dispatch(resetSelectedInbountAirlne());
            } else {
                dispatch(resetSelectAirline());
            }
        }
    }, [isInbount, flights, dispatch]);

    return (
        <Card
            variant="borderless"
            className="bg-[#F4F6FA] flex-1 mt-3 rounded-[18px]"
            bodyStyle={{ padding: '1rem' }}
        >
            {!dataSource || (dataSource.length && flights.length === 0 && !isLoading) ? (
                <Flex className="w-full h-full mt-28" vertical justify="center" align="center">
                    <Lottie options={defaultOptions} height={250} width={400} />
                    <Typography.Text className="mt-6 text-center md:text-sm">
                        We couldn&apos;t find any flights matching your search criteria.
                        <br />
                        Please try adjusting your search filters, such as travel dates or
                        destinations, and search again.
                    </Typography.Text>
                </Flex>
            ) : (
                <Flex vertical justify="space-between" className="w-full">
                    <Row gutter={10}>
                        {!flights || !flights.length || filterLoading ? (
                            <AirlineCardSkeleton length={10} />
                        ) : (
                            paginatedFlights.map((item, index: number) =>
                                isDomesticRoundTrip ? (
                                    <SearchResultCardSmall
                                        item={item}
                                        key={index}
                                        handleClick={handleClick}
                                        setDrawerDetails={setDrawerDetails}
                                        setIsDrawerOpen={setIsDrawerOpen}
                                        setSelectedAirlinePrice={setSelectedAirlinePrice}
                                        isInbount={isInbount}
                                    />
                                ) : (
                                    <SearchResultCard
                                        item={item}
                                        key={index}
                                        handleClick={handleClick}
                                        setDrawerDetails={setDrawerDetails}
                                        setIsDrawerOpen={setIsDrawerOpen}
                                        setSelectedAirlinePrice={setSelectedAirlinePrice}
                                    />
                                )
                            )
                        )}
                    </Row>
                    <Flex justify="end">
                        <Flex className="flight-search-result-pagination">
                            <Pagination
                                current={currentPage}
                                pageSize={itemsPerPage}
                                total={groupedFlights.length}
                                onChange={page => setCurrentPage(page)}
                                className="text-end pt-7"
                                showSizeChanger={false}
                            />
                        </Flex>
                    </Flex>
                </Flex>
            )}
            {isDrawerOpen && drawerDetails && (
                <FlightInfoDrawer
                    handleClose={() => setIsDrawerOpen(!isDrawerOpen)}
                    flightDetails={drawerDetails}
                    price={selectedAirlinePrice}
                    isDrawerOpen={isDrawerOpen}
                    handleSubmit={handleClick}
                    hideBookNow={isDomesticRoundTrip}
                />
            )}
            {fareModalFlight && (
                <FareSelectionModal
                    open={!!fareModalFlight}
                    onClose={() => setFareModalFlight(null)}
                    onConfirm={selected => {
                        if (isInbount) {
                            dispatch(setSelectedInbountAirline(selected));
                        } else {
                            dispatch(setSelectedAirline(selected));
                            trackAirlineSelected(selected);
                        }
                        setFareModalFlight(null);
                        navigate(
                            `${paths.dashboard.corporateTravel}/${paths.airline.index}/${paths.airline.results}/${paths.airline.details}`
                        );
                    }}
                    fareVariants={fareModalFlight.fareVariants}
                    origin={fareModalFlight.onPoint}
                    destination={fareModalFlight.offPoint}
                />
            )}
        </Card>
    );
};

export default SearchResultBody;
