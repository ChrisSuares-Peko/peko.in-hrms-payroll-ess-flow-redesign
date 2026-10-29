/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Card, Col, Flex, Row, Select, Typography } from 'antd';
import dayjs from 'dayjs';
import moment from 'moment';
import { ReactSVG } from 'react-svg';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { store } from '@src/store/store';

import SwapSVG from '../../assets/icons/swap.svg';
import { useGetSearchAirport } from '../../hooks/useSearchAirport';
import { setQuickUpdateTripType, setSearchData as setSearchDataAction } from '../../slices/airlineSlice';
import { ITripData } from '../../types/airlineTypes';
import { ISearchData } from '../../types/searchAirports';
import { SearchData } from '../../types/slices';
import { retrieveAirport } from '../../utils/airlineData';
import { retrieveFlightClass } from '../../utils/getFlightClass';
import { tripMethods } from '../../utils/options';
import Autocomplete from '../autocomplete/AutoCompleteSelection';
import Date from '../DatePicker';
import PassengerSelectModal from '../PassengerSelectModal';

import '../../assets/style.css';

const swapSVGPath = SwapSVG;

type AirlineSearchFormProps = {
    isLoading: boolean;
    handleSearch: (tripData?: ITripData) => void;
};

type dateTime = {
    date: string;
    day: string;
};

const AirlineSearchForm: React.FC<AirlineSearchFormProps> = ({ isLoading, handleSearch }) => {
    const dispatch = useAppDispatch();
    const airlineSearchData: SearchData = useAppSelector(state => state.reducer.airline.searchData);
    const airlineSearchDataRef = useRef<SearchData>(airlineSearchData);
    
    useEffect(() => {
        airlineSearchDataRef.current = airlineSearchData;
    }, [airlineSearchData]);

    // Sync date fields when Redux searchData changes externally (e.g. fare calendar date click)
    useEffect(() => {
        if (!airlineSearchData.depart1) return;
        setDepartureData({
            date: airlineSearchData.depart1,
            day: airlineSearchData.departDay1 ?? '',
        });
        setTripData(prev => ({
            ...prev,
            depart1: airlineSearchData.depart1,
            departDay1: airlineSearchData.departDay1 ?? '',
        }));
    }, [airlineSearchData.depart1]);

    const [searchKey, setSearchKey] = useState<string>(airlineSearchData.fromLocation1);
    const [searchKeyTo, setSearchKeyTo] = useState<string>(airlineSearchData.toLocation1);

    const [searchData, setSearchData] = useState<ISearchData[]>([]);
    const [searchDataTo, setSearchDataTo] = useState<ISearchData[]>([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [departureData, setDepartureData] = useState<dateTime>({
        date: airlineSearchData?.depart1,
        day: airlineSearchData?.departDay1,
    });
    const [departureDate2, setDepartureDate2] = useState<dateTime>({
        date: airlineSearchData?.depart,
        day: airlineSearchData?.departDay,
    });

    const [arrivalData, setArrivalData] = useState<dateTime>({
        date: airlineSearchData?.arrive,
        day: airlineSearchData?.arriveDay,
    });

    const airportSearch = useGetSearchAirport(searchKey || '');
    const airportSearchTo = useGetSearchAirport(searchKeyTo || '');

    const [tripData, setTripData] = useState<ITripData>({
        tripType: airlineSearchData.tripType,
        fromLocation: airlineSearchData?.fromLocation ?? '',
        toLocation: airlineSearchData?.toLocation ?? '',
        depart: airlineSearchData?.depart ?? '',
        departDay: airlineSearchData?.departDay ?? '',
        arrive: airlineSearchData?.arrive ?? '',
        arriveDay: airlineSearchData?.arriveDay ?? '',
        fromLocation1: airlineSearchData?.fromLocation1 ?? '',
        toLocation1: airlineSearchData?.toLocation1 ?? '',
        depart1: airlineSearchData?.depart1 ?? '',
        departDay1: airlineSearchData?.departDay1 ?? '',
        arrive1: airlineSearchData?.arrive1 ?? '',
        arriveDay1: airlineSearchData?.arriveDay1 ?? '',
        adults: airlineSearchData?.adults ?? '',
        children: airlineSearchData?.children ?? '',
        infants: airlineSearchData?.infants ?? '',
        class: airlineSearchData?.class ?? 2,
        originCountryCode: airlineSearchData?.originCountryCode ?? '',
        destinationCountryCode: airlineSearchData?.destinationCountryCode ?? '',
    });

    const updateTripDetails = (key: string) => (value: string) => {
        setTripData(state => ({
            ...state,
            [key]: value,
        }));
    };

    const updateTripData = useCallback(
        (key: string, val: string | number) => {
            setTripData((prevTripData: ITripData) => ({
                ...prevTripData,
                [key]: val,
            }));
        },
        []
    );

    const updateStore = useCallback(
        (values: Partial<ITripData>) => {
            const currentState = store.getState() as any;
            const currentSearchData = 
                currentState?.reducer?.reducer?.airline?.searchData ||
                currentState?.reducer?.airline?.searchData ||
                airlineSearchDataRef.current;
            
            dispatch(
                setSearchDataAction({
                    ...currentSearchData,
                    ...values,
                } as SearchData)
            );
            
            // Update ref after dispatch
            airlineSearchDataRef.current = {
                ...currentSearchData,
                ...values,
            } as SearchData;
        },
        [dispatch]
    );

    useEffect(() => {
        if (tripData.tripType === 2) {
            if (departureData.date) {
                let parsedDate = dayjs(departureData.date, 'DD-MM-YYYY');
                if (!parsedDate.isValid()) {
                    parsedDate = dayjs(departureData.date, 'DD MM YYYY');
                }
                if (parsedDate.isValid()) {
                    const nextDay = parsedDate.add(1, 'day');
                    const formattedDate = nextDay.format('DD-MM-YYYY');
                    const dayOfWeek = nextDay.format('dddd');
                    
                    // Only update if return date is empty or if departure date is after return date
                    if (!arrivalData.date || parsedDate.isAfter(dayjs(arrivalData.date, 'DD-MM-YYYY'))) {
                        setArrivalData({
                            date: formattedDate,
                            day: dayOfWeek,
                        });
                        updateTripData('arrive', formattedDate);
                        updateTripData('arriveDay', dayOfWeek);
                        updateStore({
                            arrive: formattedDate,
                            arriveDay: dayOfWeek,
                        });
                    }
                }
            }
        }
        // Only update if values actually changed
        if (tripData.depart1 !== departureData.date || tripData.departDay1 !== departureData.day) {
            updateTripData('depart1', departureData.date);
            updateTripData('departDay1', departureData.day);
            updateStore({
                depart1: departureData.date,
                departDay1: departureData.day,
            });
        }
    }, [departureData.date, departureData.day, tripData.tripType]);

    useEffect(() => {
        // Only update if values actually changed
        if (tripData.depart !== departureDate2.date || tripData.departDay !== departureDate2.day) {
            updateTripData('depart', departureDate2.date);
            updateTripData('departDay', departureDate2.day);
            updateStore({
                depart: departureDate2.date,
                departDay: departureDate2.day,
            });
        }
    }, [departureDate2.date, departureDate2.day]);

    useEffect(() => {
        // Only update if values actually changed
        if (tripData.arrive !== arrivalData.date || tripData.arriveDay !== arrivalData.day) {
            updateTripData('arrive', arrivalData.date);
            updateTripData('arriveDay', arrivalData.day);
            updateStore({
                arrive: arrivalData.date,
                arriveDay: arrivalData.day,
            });
        }
    }, [arrivalData.date, arrivalData.day]);

    useEffect(() => {
        if (airportSearch.data) {
            setSearchData(airportSearch.data);
        }
    }, [airportSearch.data]);

    useEffect(() => {
        if (airportSearchTo.data) {
            setSearchDataTo(airportSearchTo.data);
        }
    }, [airportSearchTo.data]);

    // Multi-city sync: when first segment's "to" changes, update second segment's "from"
    useEffect(() => {
        if (tripData.tripType === 3 && tripData.toLocation1 && tripData.toLocation1 !== tripData.fromLocation) {
            updateTripData('fromLocation', tripData.toLocation1);
            updateStore({ fromLocation: tripData.toLocation1 });
        }
    }, [tripData.tripType, tripData.toLocation1, tripData.fromLocation, updateTripData, updateStore]);

    // Multi-city: the second leg's date is fully user-controlled. We intentionally do NOT
    // auto-set it to depart1 + 1 day. The previous effect did, and because tripData.depart was
    // in its deps it re-fired and overwrote the date the user had just picked. Ordering
    // (leg 2 >= leg 1) is enforced by the second date picker's disabled-date guard + validate().

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
    };

    const handleTripDataUpdate = useCallback(
        (updatedTripData: ITripData) => {
            setTripData(updatedTripData);
            updateStore({
                adults: updatedTripData.adults,
                children: updatedTripData.children,
                infants: updatedTripData.infants,
                class: updatedTripData.class,
            });
        },
        [updateStore]
    );

    const handleLocationSwap = useCallback(
        (index: number) => {
            if (index === 0) {
                const fromLocation = tripData.fromLocation1;
                const toLocation = tripData.toLocation1;

                updateTripData('fromLocation1', toLocation);
                updateTripData('toLocation1', fromLocation);
                updateStore({
                    fromLocation1: toLocation,
                    toLocation1: fromLocation,
                });
            }
            if (index === 1) {
                const { fromLocation, toLocation } = tripData;

                updateTripData('fromLocation', toLocation);
                updateTripData('toLocation', fromLocation);
                updateStore({
                    fromLocation: toLocation,
                    toLocation: fromLocation,
                });
            }
            setSearchData(prev => {
                const temp = searchDataTo;
                setSearchDataTo(prev);
                return temp;
            });
            setSearchKey(prev => {
                const temp = searchKeyTo;
                setSearchKeyTo(prev);
                return temp;
            });
        },
        [tripData, updateTripData, updateStore, searchDataTo, searchKeyTo]
    );

    const updateTripType = (val: number) => {
        dispatch(setQuickUpdateTripType(val));
    };

    const gridStyle: React.CSSProperties = {
        width: '50%',
        padding: '0.7rem',
        alignItems: 'center',
        borderRadius: '.80rem',
        height: '4rem',
    };

    const gridStyleEnd: React.CSSProperties = {
        width: '50%',
        height: '4rem',
        padding: '.5rem',
        alignItems: 'center',
        borderTopRightRadius: '.80rem',
        borderBottomRightRadius: '.80rem',
    };

    const gridStyleStart: React.CSSProperties = {
        width: '50%',
        height: '4rem',
        padding: '.5rem',
        alignItems: 'center',
        borderTopLeftRadius: '.80rem',
        borderBottomLeftRadius: '.80rem',
    };

    const totalNumberOfPassengers = tripData.adults + tripData.children + tripData.infants;

    const disabledEndDate = (current: any) => {
        const parsedDepart1 = moment(tripData.depart1, 'DD-MM-YYYY').startOf('day');
        return current && current < parsedDepart1;
    };

    const disabledStartDate = (current: any) => current && current < moment().startOf('day');

    const multiCityDepartureDisabledDates = (current: any) =>
        current && current < moment(tripData.depart1, 'DD-MM-YYYY').startOf('day');

    const handleOpenChange = () => {
        if (!arrivalData.date && tripData.tripType === 2) {
            const nextDayOfDeparture = dayjs(departureData.date, 'DD MM YYYY').add(1, 'day');
            const formattedDate = nextDayOfDeparture.format('DD-MM-YYYY');
            const dayOfWeek = nextDayOfDeparture.format('dddd');
            setArrivalData({
                date: formattedDate,
                day: dayOfWeek,
            });
        }
    };

    return (
        <>
            <Row justify="space-between" className="p-0 m-0">
                <Col className="" md={4} xl={4}>
                    <Card className="border rounded-xl h-full" styles={{ body: { padding: 0 } }}>
                        <Col className="flex flex-col w-full p-2 justify-center h-full">
                            <Select
                                className="font-black my-auto mt-2 custon_select_bold"
                                style={{ fontWeight: 800 }}
                                value={tripData.tripType}
                                variant="borderless"
                                options={tripMethods}
                                onSelect={val => {
                                    updateTripData('tripType', val);
                                    updateTripType(val);
                                    updateStore({ tripType: val });
                                    if (val === 1) {
                                        updateTripData('arrive', '');
                                        updateStore({ arrive: '' });
                                        setArrivalData({ date: '', day: '' });
                                    }
                                    if (val === 2) {
                                        // Round trip: auto-set return date to departure date + 1 day
                                        const departDate = tripData.depart1 || departureData.date;
                                        if (departDate) {
                                            let parsedDate = dayjs(departDate, 'DD-MM-YYYY');
                                            if (!parsedDate.isValid()) {
                                                parsedDate = dayjs(departDate, 'DD MM YYYY');
                                            }
                                            if (parsedDate.isValid()) {
                                                const nextDay = parsedDate.add(1, 'day');
                                                const formattedDate = nextDay.format('DD-MM-YYYY');
                                                const dayOfWeek = nextDay.format('dddd');
                                                updateTripData('arrive', formattedDate);
                                                updateTripData('arriveDay', dayOfWeek);
                                                setArrivalData({
                                                    date: formattedDate,
                                                    day: dayOfWeek,
                                                });
                                                updateStore({
                                                    arrive: formattedDate,
                                                    arriveDay: dayOfWeek,
                                                });
                                            }
                                        } else {
                                            // If no departure date yet, clear arrive date
                                            updateTripData('arrive', '');
                                            updateTripData('arriveDay', '');
                                            setArrivalData({ date: '', day: '' });
                                            updateStore({ arrive: '', arriveDay: '' });
                                        }
                                    }
                                    if (val === 3) {
                                        // Multi-city: set second segment's "from" to first segment's "to"
                                        if (tripData.toLocation1) {
                                            updateTripData('fromLocation', tripData.toLocation1);
                                            updateStore({ fromLocation: tripData.toLocation1 });
                                        }
                                        // Leg 2's date stays user-controlled — do NOT auto-set it
                                        // to leg 1 + 1 day on switching to multi-city. Ordering is
                                        // enforced by the leg-2 picker's disabled-date guard.
                                    }
                                }}
                                disabled={isLoading}
                            />
                        </Col>
                    </Card>
                </Col>
                <Col className="h-full" md={tripData.tripType === 3 ? 10 : 8} xl={tripData.tripType === 3 ? 10 : 8}>
                    <Card className="flex flex-col border-none h-full" styles={{ body: { padding: 0 } }}>
                        <Card.Grid hoverable={false} style={gridStyleStart}>
                            <Autocomplete
                                options={searchData}
                                onSelect={(loc, val) => {
                                    updateTripData(loc, val);
                                    updateStore({ [loc]: val } as Partial<ITripData>);
                                }}
                                searchKey={searchKey}
                                setSearchKey={setSearchKey}
                                tripData={tripData}
                                location="fromLocation1"
                                disabled={isLoading}
                                updateTripDetails={updateTripDetails('originCountryCode')}
                            />
                            <Typography.Text className="text-xs text-start text-gray-500 mx-3 overflow-hidden line-clamp-1">
                                {retrieveAirport(tripData.fromLocation1 || '')}
                            </Typography.Text>
                        </Card.Grid>
                        <Card className="border-0 w-0 h-full">
                            <Flex className="h-full w-full mt-5" justify="center" align="center">
                                <ReactSVG
                                    src={swapSVGPath}
                                    onClick={() => !isLoading && handleLocationSwap(0)}
                                    wrapper="div"
                                    beforeInjection={svg => {
                                        svg.setAttribute('style', 'cursor: pointer;');
                                    }}
                                />
                            </Flex>
                        </Card>
                        <Card.Grid hoverable={false} style={{ ...gridStyleEnd, paddingLeft: '1rem' }}>
                            <Autocomplete
                                options={searchDataTo}
                                onSelect={(loc, val) => {
                                    updateTripData(loc, val);
                                    updateStore({ [loc]: val } as Partial<ITripData>);
                                }}
                                searchKey={searchKeyTo}
                                setSearchKey={setSearchKeyTo}
                                tripData={tripData}
                                location="toLocation1"
                                disabled={isLoading}
                                updateTripDetails={updateTripDetails('destinationCountryCode')}
                            />
                            <Typography.Text className="text-xs text-start text-gray-500 mx-3 overflow-hidden line-clamp-1">
                                {retrieveAirport(tripData.toLocation1 || '')}
                            </Typography.Text>
                        </Card.Grid>
                    </Card>
                </Col>
                <Col className="" md={tripData.tripType === 3 ? 3 : 7} xl={tripData.tripType === 3 ? 4 : 8}>
                    <Flex className="w-full">
                        <Card className="flex-1 border-none">
                            <Card.Grid
                                hoverable={false}
                                style={tripData.tripType === 3 ? gridStyle : gridStyleStart}
                                className="flex-1"
                            >
                                <Typography.Text className="text-sm text-gray-500 flex">
                                    <Date
                                        defaultDate={tripData?.depart1 || airlineSearchData.depart1}
                                        dateData={setDepartureData}
                                        style={{ border: 0 }}
                                        disabledData={isLoading}
                                        disabledDate={disabledStartDate}
                                    />
                                </Typography.Text>
                                <Typography.Text className="text-xs text-gray-500 ms-3 line-clamp-1">
                                    {departureData.day !== '' ? departureData.day : ' '}
                                </Typography.Text>
                            </Card.Grid>
                            <Card.Grid
                                hoverable={false}
                                style={gridStyleEnd}
                                className={`flex-1 ${tripData.tripType === 3 ? 'hidden' : ''}`}
                            >
                                {tripData.tripType === 1 && (
                                    <Flex gap={5} vertical>
                                        <Typography.Text
                                            className={`text-lg font-medium ${isLoading ? 'text-gray-500' : 'text-iconRed cursor-pointer'} mt-3 ms-3 line-clamp-1`}
                                            onClick={async () => {
                                                if (isLoading) return;

                                                let parsedDate = dayjs(departureData.date, 'DD-MM-YYYY');
                                                if (!parsedDate.isValid()) {
                                                    parsedDate = dayjs(departureData.date, 'DD MM YYYY');
                                                }
                                                if (!parsedDate.isValid() && tripData.depart1) {
                                                    parsedDate = dayjs(tripData.depart1, 'DD-MM-YYYY');
                                                    if (!parsedDate.isValid()) {
                                                        parsedDate = dayjs(tripData.depart1, 'DD MM YYYY');
                                                    }
                                                }

                                                let formattedDate = '';
                                                let dayOfWeek = '';

                                                if (parsedDate.isValid()) {
                                                    const nextDay = parsedDate.add(1, 'day');
                                                    formattedDate = nextDay.format('DD-MM-YYYY');
                                                    dayOfWeek = nextDay.format('dddd');
                                                }

                                                updateTripData('tripType', 2);
                                                if (formattedDate) {
                                                    updateTripData('arrive', formattedDate);
                                                    updateTripData('arriveDay', dayOfWeek);
                                                    setArrivalData({
                                                        date: formattedDate,
                                                        day: dayOfWeek,
                                                    });
                                                }
                                                updateTripType(2);
                                                updateStore({
                                                    tripType: 2,
                                                    arrive: formattedDate,
                                                    arriveDay: dayOfWeek,
                                                });

                                                setTimeout(() => {
                                                    // Pass current tripData to handleSearch to ensure latest values are used
                                                    handleSearch({
                                                        ...tripData,
                                                        tripType: 2,
                                                        arrive: formattedDate,
                                                        arriveDay: dayOfWeek,
                                                    });
                                                }, 150);
                                            }}
                                        >
                                            + Add Return
                                        </Typography.Text>
                                    </Flex>
                                )}
                                {tripData.tripType === 2 && (
                                    <Typography.Text className="text-sm text-gray-500 flex flex-col">
                                        <Date
                                            disabledData={isLoading}
                                            disabledDate={disabledEndDate}
                                            defaultDate={tripData?.arrive ?? tripData?.depart1}
                                            dateData={setArrivalData}
                                            style={{ border: 0 }}
                                            handleOpenChange={handleOpenChange}
                                        />
                                        <Typography.Text className="text-xs text-gray-500 ms-3 line-clamp-1">
                                            {arrivalData.day !== '' ? arrivalData.day : ' '}
                                        </Typography.Text>
                                    </Typography.Text>
                                )}
                            </Card.Grid>
                        </Card>
                    </Flex>
                </Col>
                <Col md={tripData.tripType === 3 ? 5 : 4} lg={tripData.tripType === 3 ? 4 : 3} className="flex justify-center items-center">
                    <Card
                        style={gridStyle}
                        styles={{ body: { padding: 0 } }}
                        size="small"
                        className={`flex-1 justify-center items-center h-full ${isLoading ? 'text-gray-500' : 'cursor-pointer'}`}
                        onClick={() => !isLoading && toggleModal()}
                    >
                        <Typography.Text
                            className={`xxl:text-base md:text-sm font-bold py-0 mx-0 xxl:mx-3 line-clamp-1 ${isLoading ? 'text-gray-500' : 'cursor-pointer'}`}
                        >
                            {totalNumberOfPassengers}{' '}
                            {Number(totalNumberOfPassengers) > 1 ? 'Passengers' : 'Passenger'}
                        </Typography.Text>
                        <Typography.Text className="text-xs text-start text-gray-500 mx-0 xxl:mx-3 line-clamp-1">
                            {retrieveFlightClass(tripData.class)}
                        </Typography.Text>
                    </Card>
                </Col>
            </Row>
            {tripData.tripType === 3 && (
                <Row justify="space-between" className="h-20 p-0 mt-3">
                    <Col md={4} xl={4} />
                    <Col md={10} xl={10}>
                        <Card className="flex flex-col border-none" styles={{ body: { padding: 0 } }}>
                            <Card.Grid hoverable={false} style={gridStyleStart}>
                                <Autocomplete
                                    options={searchData}
                                    onSelect={(loc, val) => {
                                        updateTripData(loc, val);
                                        updateStore({ [loc]: val } as Partial<ITripData>);
                                    }}
                                    searchKey={searchKey}
                                    setSearchKey={setSearchKey}
                                    tripData={tripData}
                                    location="fromLocation"
                                    disabled={isLoading}
                                    updateTripDetails={updateTripDetails('originCountryCode')}
                                />
                                <Typography.Text className="text-xs text-start text-gray-500 mx-3 overflow-hidden line-clamp-1">
                                    {retrieveAirport(tripData.fromLocation || '')}
                                </Typography.Text>
                            </Card.Grid>
                            <Card className="border-0 w-0">
                                <Flex className="h-full w-full mt-4" justify="center" align="center">
                                    <ReactSVG
                                        src={swapSVGPath}
                                        onClick={() => !isLoading && handleLocationSwap(1)}
                                        wrapper="div"
                                        beforeInjection={svg => {
                                            svg.setAttribute('style', 'cursor: pointer;');
                                        }}
                                    />
                                </Flex>
                            </Card>
                            <Card.Grid hoverable={false} style={gridStyleEnd}>
                                <Autocomplete
                                    options={searchDataTo}
                                    onSelect={(loc, val) => {
                                        updateTripData(loc, val);
                                        updateStore({ [loc]: val } as Partial<ITripData>);
                                    }}
                                    searchKey={searchKeyTo}
                                    setSearchKey={setSearchKeyTo}
                                    tripData={tripData}
                                    location="toLocation"
                                    disabled={isLoading}
                                    updateTripDetails={updateTripDetails('destinationCountryCode')}
                                />
                                <Typography.Text className="text-xs text-start text-gray-500 mx-3 overflow-hidden line-clamp-1">
                                    {retrieveAirport(tripData.toLocation || '')}
                                </Typography.Text>
                            </Card.Grid>
                        </Card>
                    </Col>
                    <Col md={3} xl={4}>
                        <Flex>
                            <Card
                                style={tripData.tripType === 3 ? gridStyle : gridStyleStart}
                                styles={{ body: { padding: 0 } }}
                                className="flex-1"
                            >
                                <Typography.Text className="text-sm text-gray-500 py-1 px-0 flex-col">
                                    <Date
                                        disabledDate={multiCityDepartureDisabledDates}
                                        defaultDate={tripData.depart}
                                        dateData={setDepartureDate2}
                                        style={{ border: 0 }}
                                        disabledData={isLoading}
                                    />
                                    <Typography.Text className="text-xs text-gray-500 ms-3 line-clamp-1">
                                        {departureDate2.day !== '' ? departureDate2.day : ' '}
                                    </Typography.Text>
                                </Typography.Text>
                            </Card>
                        </Flex>
                    </Col>
                    <Col md={5} lg={4} className="flex justify-center items-center">
                        <Flex justify="center" align="center" className="h-full hidden">
                            <Typography.Text
                                className={`text-lg font-medium ${isLoading ? 'text-gray-500' : 'text-iconRed cursor-pointer'} line-clamp-1`}
                                onClick={() => {
                                    if (!isLoading) {
                                        // Handle add another flight logic here
                                        // This can be extended to add more flight segments
                                    }
                                }}
                            >
                                + Add Another Flight
                            </Typography.Text>
                        </Flex>
                    </Col>
                </Row>
            )}
            <PassengerSelectModal
                tripData={tripData}
                setTripData={handleTripDataUpdate}
                isModalOpen={isModalOpen}
                handleCancel={toggleModal}
            />
        </>
    );
};

export default AirlineSearchForm;
