import React, { useCallback, useEffect, useState } from 'react';

import { Button, Col, Flex, Grid, Typography } from 'antd';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import { useAppDispatch } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import SearchCardMobile from './adaptive/SearchCardMobile';
import PassengerSelectModal from './PassengerSelectModal';
import SearchCardDesktop from './SearchCardDesktop';
import MagnifyingGlass from '../assets/icons/MagnifyingGlass.svg';
import useHandleAirlineSearch from '../hooks/useHandleAirlineSearch';
import { resetFormState } from '../slices/airlineSlice';
import { ITripData } from '../types/airlineTypes';
import { retrieveFlightClass } from '../utils/getFlightClass';
import { tripMethods } from '../utils/options';



const { useBreakpoint } = Grid;
export default function SearchFlight() {
    const navigate = useNavigate();
    const { handleAirlineSearch } = useHandleAirlineSearch();
    const dispatch = useAppDispatch();
    const screens = useBreakpoint();
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [tripType, setTripType] = useState<number>(1);
    const [tripData, setTripData] = useState<ITripData>({
        tripType,
        fromLocation: '',
        toLocation: '',
        depart: '',
        departDay: '',
        arrive: '',
        arriveDay: '',
        fromLocation1: '',
        toLocation1: '',
        depart1: '',
        departDay1: dayjs().format('dddd'),
        arrive1: '',
        arriveDay1: '',
        adults: 1,
        children: 0,
        infants: 0,
        class: 2,
        originCountryCode: 'IN',
        destinationCountryCode: 'IN',
    });
    const showModal = () => {
        setIsModalOpen(true);
    };
    const handleCancel = () => {
        setIsModalOpen(false);
    };
    useEffect(() => {
        dispatch(resetFormState());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (tripType === 3 && screens.xs && tripData.toLocation) {
            setTripData((prevTripData: ITripData) => ({
                ...prevTripData,
                fromLocation1: tripData.toLocation,
            }));
        }
    }, [tripData.toLocation, tripType, screens.xs]);

    useEffect(() => {
        if (tripType === 3 && !screens.xs && tripData.toLocation1) {
            setTripData((prevTripData: ITripData) => ({
                ...prevTripData,
                fromLocation: tripData.toLocation1,
            }));
        }
    }, [tripData.toLocation1, tripType, screens.xs]);

    // Multi-city: the second leg's date is fully user-controlled. We intentionally do NOT
    // auto-set it to firstDate+1 — that clobbered the date the user picked. Ordering
    // (leg 2 >= leg 1) is enforced by the date picker's disabled-date guard and validate().

    const handleSearch = () => {
        if (tripType === 2 && !tripData.arrive) {
            dispatch(
                showToast({
                    description: 'Please select return date.',
                    variant: 'error',
                })
            );
            return;
        }
        const search = handleAirlineSearch(tripData);
        if (search.status) {
            if (typeof Moengage?.track_event === 'function') {
                const parseFlightDate = (d: string) => new Date(d.split('-').reverse().join('-'));
                const payload: Record<string, any> = {
                    from_city: tripData.fromLocation1,
                    destination_city: tripData.toLocation1,
                    depart_date: parseFlightDate(tripData.depart1),
                    cabin_class: retrieveFlightClass(tripData.class),
                    trip_type: tripMethods.find(t => t.value === tripData.tripType)?.label,
                    number_passengers: tripData.adults + tripData.children + tripData.infants,
                };
                if (tripData.tripType === 2) payload.return_date = parseFlightDate(tripData.arrive);
                if (tripData.tripType === 3) {
                    payload.from_city_multi = tripData.fromLocation;
                    payload.destination_city_multi = tripData.toLocation;
                }
                Moengage.track_event('flight_search_started', payload);
            }
            navigate(`${paths.airline.index}/${paths.airline.results}`, {
                state: { flightkey: 'searchFlights' },
            });
        }
    };

    const updateTripData = useCallback(
        (key: string, val: string | number) => {
            setTripData((prevTripData: ITripData) => ({
                ...prevTripData,
                [key]: val,
            }));
        },
        [setTripData]
    );

    return (
        <Col className="md:border xs:border-none xs:p-0 md:p-0 ">
            <Flex vertical gap={25}>
                  <Flex gap={12} wrap="wrap" className="mt-4 md:mt-1">
                <Button
                    onClick={() => { setTripType(1); updateTripData('tripType', 1); }}
                    className={`h-11 px-6 rounded-full font-small transition-all ${
                        tripType === 1
                            ? '!bg-[#FFF4F4] !text-[#FF4F4F] !border-[#FF4F4F] font-bold'
                            : 'bg-white text-black border border-gray-200 hover:border-[#FF4F4F] hover:text-[#FF4F4F]'
                    }`}
                >
                    One-Way
                </Button>
                <Button
                    onClick={() => { setTripType(2); updateTripData('tripType', 2); }}
                    className={`h-11 px-6 rounded-full font-small transition-all ${
                        tripType === 2
                            ? '!bg-[#FFF4F4] !text-[#FF4F4F] !border-[#FF4F4F] font-bold'
                            : 'bg-white text-black border border-gray-200 hover:border-[#FF4F4F] hover:text-[#FF4F4F]'
                    }`}
                >
                    Round Trip
                </Button>
                <Button
                    onClick={() => { setTripType(3); updateTripData('tripType', 3); }}
                    className={`h-11 px-6 rounded-full font-small transition-all ${
                        tripType === 3
                            ? '!bg-[#FFF4F4] !text-[#FF4F4F] !border-[#FF4F4F] font-bold'
                            : 'bg-white text-black border border-gray-200 hover:border-[#FF4F4F] hover:text-[#FF4F4F]'
                    }`}
                >
                    Multi-City
                </Button>
                 <Button
                        className="ml-auto h-11 px-6 rounded-lg font-small border border-[#FF4F4F] text-[#FF4F4F] hover:bg-transparent hover:text-[#FF4F4F] hover:border-[#FF4F4F] bg-white"
                        onClick={() =>
                            navigate(`${paths.airline.index}/${paths.airline.manage}`, {
                                state: { initialActiveTab: '1' },
                            })
                        }
                    >
                        Manage Booking
                    </Button>
                </Flex>
                {screens.xs &&
                    (tripType === 3 ? (
                        <>
                            <SearchCardMobile
                                tripData={tripData}
                                setTripData={setTripData}
                                tripType={tripType}
                                multicity
                                showModal={showModal}
                            />
                            <SearchCardMobile
                                tripData={tripData}
                                setTripData={setTripData}
                                multicity={false}
                                tripType={tripType}
                                showModal={showModal}
                            />
                        </>
                    ) : (
                        <SearchCardMobile
                            tripData={tripData}
                            setTripData={setTripData}
                            multicity={false}
                            tripType={tripType}
                            showModal={showModal}
                        />
                    ))}
                {screens.xs === false && (
                    <Flex vertical gap={16} className="w-full">
                        <Flex
                            className="xs:hidden sm:flex w-full"
                            gap={tripType === 3 ? 16 : 'large'}
                            align="start"
                            vertical
                        >
                            {tripType === 3 ? (
                                <>
                                    <SearchCardDesktop
                                        defaultFromTo={['', '']}
                                        tripData={tripData}
                                        setTripData={setTripData}
                                        tripType={tripType}
                                        multicity={false}
                                        showModal={showModal}
                                        setTripType={setTripType}
                                    />
                                    <SearchCardDesktop
                                        defaultFromTo={['', '']}
                                        tripData={tripData}
                                        setTripData={setTripData}
                                        tripType={tripType}
                                        showModal={showModal}
                                        setTripType={setTripType}
                                        multicity
                                    />
                                </>
                            ) : (
                                <SearchCardDesktop
                                    defaultFromTo={['', '']}
                                    multicity={false}
                                    tripData={tripData}
                                    setTripData={setTripData}
                                    tripType={tripType}
                                    showModal={showModal}
                                    setTripType={setTripType}
                                />
                            )}
                        </Flex>
                        <Flex className='mt-2' justify="end">
                            <Button
                                onClick={handleSearch}
                                danger
                                className="xxl:w-52 md:w-48 h-14 flex justify-center items-center rounded-md"
                                type="primary"
                                size="middle"
                                icon={
                                    <ReactSVG
                                        src={MagnifyingGlass}
                                        beforeInjection={svg => {
                                            svg.setAttribute(
                                                'style',
                                                'width: 20px; height: 20px; color: white;'
                                            );
                                        }}
                                    />
                                }
                            >
                                <Typography.Text className="text-white text-base">
                                    Search Flights
                                </Typography.Text>
                            </Button>
                        </Flex>
                    </Flex>
                )}

                <PassengerSelectModal
                    tripData={tripData}
                    setTripData={setTripData}
                    isModalOpen={isModalOpen}
                    handleCancel={handleCancel}
                />
                <Button
                    onClick={handleSearch}
                    danger
                    className="w-full sm:hidden sm:w-52 flex justify-center rounded-md"
                    type="primary"
                    size="middle"
                icon={
                                <ReactSVG
                                    src={MagnifyingGlass}
                                    beforeInjection={svg => {
                                        svg.setAttribute(
                                            'style',
                                            'width: 20px; height: 20px; color: white;'
                                        );
                                    }}
                                />
                            }
                        >
                            <Typography.Text className="text-white text-base">
                                Search Flights
                            </Typography.Text>
                </Button>
            </Flex>
        </Col>
    );
}
