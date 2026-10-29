import React, { useCallback, useEffect, useState } from 'react';

import { Flex, Typography } from 'antd';
import dayjs from 'dayjs';
import moment from 'moment';
import { useDispatch } from 'react-redux';
import { ReactSVG } from 'react-svg';

import useDebounce from '@src/hooks/useDebounce';

import Autocomplete from './autocomplete/AutoCompleteSelection';
import DatePicker from './DatePicker';
import AirplaneSVG from '../assets/icons/airplane.svg';
import CalenderSVG from '../assets/icons/calender.svg';
import icSwapSVG from '../assets/icons/ic_Swap.svg';
import { useGetSearchAirport } from '../hooks/useSearchAirport';
import { ITripData } from '../types/airlineTypes';
import { ISearchData } from '../types/searchAirports';
import { retrieveAirport } from '../utils/airlineData';
import '../assets/style.css';
import { retrieveFlightClass } from '../utils/getFlightClass';

const { Paragraph, Text } = Typography;

interface SearchCardMobileProps {
    showModal: () => void;
    tripData: ITripData;
    setTripData: any;
    tripType: number;
    multicity: boolean;
    setTripType: (trip: number) => void;
    defaultFromTo?: string[];
}

type dateTime = {
    date: string;
    day: string;
};

const SearchCardDesktop: React.FC<SearchCardMobileProps> = ({
    showModal,
    tripData,
    tripType,
    setTripData,
    multicity,
    setTripType,
    defaultFromTo = ['', ''],
}) => {
    const dispatch = useDispatch();

    const [searchKey, setSearchKey] = useState<string>(defaultFromTo[0] || '');
    const [searchKeyTo, setSearchKeyTo] = useState<string>(defaultFromTo[1] || '');

    const [searchData, setSearchData] = useState<ISearchData[]>();
    const [searchDataTo, setSearchDataTo] = useState<ISearchData[]>();

    const debounceSearchText = useDebounce(searchKey, 200);
    const debounceSearchTextTo = useDebounce(searchKeyTo, 200);

    const getInitialDepartureDate = () => {
        if (multicity) {
            // Leg 2's date is fully user-controlled — never auto-set it to leg 1 + 1 day
            // (that overrode the date the user picked). Only echo back the user's own
            // previously-selected leg-2 date; otherwise leave it blank for the user to choose.
            if (tripData.depart) {
                let parsed = dayjs(tripData.depart, 'DD-MM-YYYY', true);
                if (!parsed.isValid()) {
                    parsed = dayjs(tripData.depart, 'DD MM YYYY', true);
                }
                return parsed.isValid() ? parsed.format('DD-MM-YYYY') : '';
            }
            return '';
        }
            if (tripData.depart1) {
                let parsed = dayjs(tripData.depart1, 'DD-MM-YYYY', true);
                if (!parsed.isValid()) {
                    parsed = dayjs(tripData.depart1, 'DD MM YYYY', true);
                }
                return parsed.isValid() ? parsed.format('DD-MM-YYYY') : dayjs().add(1, 'day').format('DD-MM-YYYY');
            }
            return dayjs().add(1, 'day').format('DD-MM-YYYY');
        
    };

    const initialDate = getInitialDepartureDate();
    const [departureData, setDepartureData] = useState<dateTime>({
        date: initialDate,
        day: (() => {
            let parsed = dayjs(initialDate, 'DD-MM-YYYY', true);
            if (!parsed.isValid()) {
                parsed = dayjs(initialDate, 'DD MM YYYY', true);
            }
            return parsed.isValid() ? parsed.format('dddd') : '';
        })(),
    });
    const [arrivalData, setArrivalData] = useState<dateTime>({
        date: '',
        day: '',
    });

    const { data } = useGetSearchAirport(debounceSearchText);
    const { data: dataTo } = useGetSearchAirport(debounceSearchTextTo);

    const updateTripData = useCallback(
        (key: string, val: string | number) => {
            setTripData((prevTripData: ITripData) => ({
                ...prevTripData,
                [key]: val,
            }));
        },
        [setTripData]
    );

    const updateTripDetails = (key: string) => (value: string) => {
        setTripData((state: ITripData) => ({
            ...state,
            [key]: value,
        }));
    };

    useEffect(() => {
        // if (tripType === 2) {
        //     const dep = dayjs(departureData.date, 'DD MM YYYY');
        //     const arr = dayjs(arrivalData.date, 'DD MM YYYY');
        //     if (dep.isAfter(arr)) {
        //         dispatch(
        //             showToast({
        //                 description:
        //                     'The return date must be the same as or later than the departure date. Please adjust your itinerary.',
        //                 variant: 'error',
        //             })
        //         );
        //     }
        // }
        updateTripData(`${multicity === true ? 'depart' : 'depart1'}`, departureData.date);
        updateTripData(`${multicity === true ? 'departDay' : 'departDay1'}`, departureData.day);
    }, [departureData, updateTripData, multicity, arrivalData.date, dispatch]);

    useEffect(() => {
        updateTripData('arrive', arrivalData.date);
        updateTripData('arriveDay', arrivalData.day);
    }, [arrivalData, updateTripData]);

    useEffect(() => {
        setSearchData(data);
    }, [data]);
    useEffect(() => {
        setSearchDataTo(dataTo);
    }, [dataTo]);

    // Sync departureData state when tripData changes (for multi-city date sync)
    useEffect(() => {
        const currentDate = multicity ? tripData.depart : tripData.depart1;
        if (currentDate && currentDate !== departureData.date) {
            try {
                // Try parsing with both formats (DD-MM-YYYY from DatePicker or DD MM YYYY)
                let parsedDate = dayjs(currentDate, 'DD-MM-YYYY', true);
                if (!parsedDate.isValid()) {
                    parsedDate = dayjs(currentDate, 'DD MM YYYY', true);
                }
                
                if (parsedDate.isValid()) {
                    // DatePicker expects DD-MM-YYYY format
                    const formattedDate = parsedDate.format('DD-MM-YYYY');
                    setDepartureData({
                        date: formattedDate,
                        day: parsedDate.format('dddd'),
                    });
                }
            } catch (error) {
                console.error('Error parsing date:', error);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [multicity ? tripData.depart : tripData.depart1, multicity]);

    const handleLocationSwap = (index: number) => {
        if (index === 0) {
            const fromLocation = tripData.fromLocation1;
            const toLocation = tripData.toLocation1;
            updateTripData('fromLocation1', toLocation);
            updateTripData('toLocation1', fromLocation);
        }
        if (index === 1) {
            const { fromLocation, toLocation } = tripData;
            updateTripData('fromLocation', toLocation);
            updateTripData('toLocation', fromLocation);
        }
        setSearchData(searchDataTo);
        setSearchDataTo(searchData);
        setSearchKey(searchKeyTo);
        setSearchKeyTo(searchKey);
    };

    const { adults, children, infants } = tripData;
    const passengerCount = adults + children + infants;

    const disabledEndDate = (current: any) => {
        if (!tripData.depart1) return false;
        // Try parsing with both formats
        let parsedDepart1 = moment(tripData.depart1, 'DD-MM-YYYY', true);
        if (!parsedDepart1.isValid()) {
            parsedDepart1 = moment(tripData.depart1, 'DD MM YYYY', true);
        }
        return current && parsedDepart1.isValid() && current < parsedDepart1.startOf('day');
    };

    const disabledStartDate = (current: any) => {
        // if one way don't need to check depart date
        if (tripData.tripType === 1) {
            return current && current < moment().startOf('day');
        }
        if (multicity && tripData.depart1) {
            // Try parsing with both formats
            let minDate = moment(tripData.depart1, 'DD-MM-YYYY', true);
            if (!minDate.isValid()) {
                minDate = moment(tripData.depart1, 'DD MM YYYY', true);
            }
            return current && minDate.isValid() && current < minDate.startOf('day');
        }
        return current && current < moment().startOf('day');
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleOpenChange = () => {
        if (!arrivalData.date) {
            const nextDayOfDeparture = dayjs(departureData.date, 'DD MM YYYY').add(1, 'day'); // Adds one day
            const formattedDate = nextDayOfDeparture.format('DD-MM-YYYY');
            const dayOfWeek = nextDayOfDeparture.format('dddd');
            setArrivalData({
                date: formattedDate,
                day: dayOfWeek,
            });
        }
    };

    useEffect(() => {
        if (tripType) {
            setArrivalData({
                date: '',
                day: '',
            });
        }
    }, [tripType]);

    const boxStyle = 'border border-gray-200 rounded-[12px] px-5 py-3 h-[65px] flex flex-col justify-center relative hover:border-red-200 transition-colors bg-white cursor-pointer';
    const labelStyle = 'flex-none text-sm mb-3 text-black font-medium ml-1 block';
    const subtextStyle = 'text-xs text-gray-500 line-clamp-1 mt-1 font-medium';
    const iconColor = '#7C3AED';

    return (
        <Flex className="w-full" gap={20} align="end" wrap="wrap">
            {/* FROM */}
            <Flex vertical className="flex-1 relative z-9">
                <Paragraph className={labelStyle}>From</Paragraph>
                <Flex className={`${boxStyle} w-full mt-3 min-w-[180px]`}>
                    <Flex align="center" gap={12}>
                        <ReactSVG
                            src={AirplaneSVG}
                            beforeInjection={svg => svg.setAttribute('style', `width: 24px; height: 24px; color: ${iconColor};`)}
                        />
                        <div className="flex-1 w-full">
                            <Autocomplete
                                options={searchData}
                                onSelect={updateTripData}
                                searchKey={searchKey}
                                setSearchKey={setSearchKey}
                                tripData={tripData}
                                location={multicity ? 'fromLocation' : 'fromLocation1'}
                                updateTripDetails={updateTripDetails('originCountryCode')}
                            />
                            <Typography.Text className={`${subtextStyle} ml-[11px]`}>
                                {retrieveAirport(tripData[multicity ? 'fromLocation' : 'fromLocation1']) ?? 'Select Airport'}
                            </Typography.Text>
                        </div>
                    </Flex>
                </Flex>
            </Flex>

            {/* SWAP */}
            <Flex justify="center" align="center" className="relative z-10 -mx-8 mb-[0.75rem]" style={{ width: '40px' }}>
                <Flex
                    justify="center"
                    align="center"
                    className="cursor-pointer hover:scale-105 transition-transform bg-white rounded-full"
                    onClick={() => handleLocationSwap(multicity ? 1 : 0)}
                    style={{ width: '40px', height: '40px' }}
                >
                    <ReactSVG
                        src={icSwapSVG}
                        beforeInjection={svg => svg.setAttribute('style', 'width: 32px; height: 32px; color: #ef4444')}
                    />
                </Flex>
            </Flex>

            {/* TO */}
            <Flex vertical className="flex-1 relative z-9">
                <Paragraph className={labelStyle}>To</Paragraph>
                <Flex className={`${boxStyle} w-full mt-3 min-w-[180px]`}>
                    <Flex align="center" gap={12}>
                        <ReactSVG
                            src={AirplaneSVG}
                            beforeInjection={svg => svg.setAttribute('style', `width: 24px; height: 24px; color: ${iconColor};`)}
                        />
                        <div className="flex-1 w-full">
                            <Autocomplete
                                options={searchDataTo}
                                onSelect={updateTripData}
                                searchKey={searchKeyTo}
                                setSearchKey={setSearchKeyTo}
                                tripData={tripData}
                                location={multicity ? 'toLocation' : 'toLocation1'}
                                updateTripDetails={updateTripDetails('destinationCountryCode')}
                            />
                            <Typography.Text className={`${subtextStyle} ml-[11px]`}>
                                {retrieveAirport(tripData[multicity ? 'toLocation' : 'toLocation1']) ?? 'Select Airport'}
                            </Typography.Text>
                        </div>
                    </Flex>
                </Flex>
            </Flex>

            {/* DEPARTURE DATE */}
            <Flex vertical className="flex-1 min-w-[180px]">
                <Paragraph className={labelStyle}>Departure Date</Paragraph>
                <Flex className={`${boxStyle} mt-3 w-full`}>
                    <Flex align="center" gap={12}>
                        <ReactSVG
                            src={CalenderSVG}
                            beforeInjection={svg => svg.setAttribute('style', `width: 20px; height: 20px; color: ${iconColor};`)}
                        />
                        <div className="flex-1 overflow-hidden">
                            <DatePicker
                                defaultDate={multicity ? tripData.depart : tripData.depart1}
                                disabledDate={disabledStartDate}
                                dateData={setDepartureData}
                                style={{ border: 0, padding: 0, fontSize: '1.1rem', fontWeight: 700 }}
                                defaultPickerValue={(() => {
                                    const dateStr = multicity ? tripData.depart : tripData.depart1;
                                    if (!dateStr) return dayjs();
                                    let parsed = dayjs(dateStr, 'DD-MM-YYYY', true);
                                    if (!parsed.isValid()) parsed = dayjs(dateStr, 'DD MM YYYY', true);
                                    return parsed.isValid() ? parsed : dayjs();
                                })()}
                            />
                            <Typography.Text className={subtextStyle}>
                                {departureData.day !== '' ? departureData.day : 'Select Date'}
                            </Typography.Text>
                        </div>
                    </Flex>
                </Flex>
            </Flex>

            {/* RETURN DATE */}
            {tripType !== 3 && (
                <Flex vertical className="flex-1 min-w-[180px]">
                    <Paragraph className={labelStyle}>Return Date</Paragraph>
                    <Flex className={`${boxStyle} mt-3 w-full`}>
                        {tripType === 1 ? (
                            <Flex align="center" gap={12}>
                                <ReactSVG
                                    src={CalenderSVG}
                                    beforeInjection={svg => svg.setAttribute('style', `width: 20px; height: 20px; color: ${iconColor};`)}
                                />
                                <Typography.Text
                                    className="text-base font-semibold text-red-500 cursor-pointer"
                                    onClick={() => { setTripType(2); updateTripData('tripType', 2); }}
                                >
                                    + Add Return
                                </Typography.Text>
                            </Flex>
                        ) : (
                            <Flex align="center" gap={12}>
                                <ReactSVG
                                    src={CalenderSVG}
                                    beforeInjection={svg => svg.setAttribute('style', `width: 20px; height: 20px; color: ${iconColor};`)}
                                />
                                <div className="flex-1 overflow-hidden">
                                    <DatePicker
                                        disabledData={tripData.tripType === 3}
                                        dateData={setArrivalData}
                                        defaultDate={arrivalData.date !== '' ? arrivalData.date : ''}
                                        style={{ border: 0, padding: 0, fontSize: '1.1rem', fontWeight: 700 }}
                                        disabledDate={disabledEndDate}
                                        defaultPickerValue={dayjs(tripData.depart1, 'DD-MM-YYYY')}
                                    />
                                    <Typography.Text className={subtextStyle}>
                                        {arrivalData.day !== '' ? arrivalData.day : 'Select Date'}
                                    </Typography.Text>
                                </div>
                            </Flex>
                        )}
                    </Flex>
                </Flex>
            )}

            {/* TRAVELLERS & CABIN CLASS */}
            {!multicity ? (
                <Flex vertical className="flex-1 min-w-[180px]">
                    <Paragraph className={labelStyle}>Travellers & Cabin Class</Paragraph>
                    <Flex className={`${boxStyle} mt-3 w-full`} onClick={showModal}>
                        <Flex align="center" gap={0}>
                            <div>
                                <Flex align="baseline">
                                    <Text className="text-gray-900 font-bold text-xl leading-none">
                                        {tripData.adults + tripData.children + tripData.infants}
                                    </Text>
                                    <Text className="text-gray-900 font-bold text-lg leading-none ms-1">
                                        {passengerCount > 1 ? 'Travellers' : 'Traveller'}
                                    </Text>
                                </Flex>
                                <Text className={subtextStyle}>
                                    {retrieveFlightClass(tripData.class)}
                                </Text>
                            </div>
                        </Flex>
                    </Flex>
                </Flex>
            ) : (
                <div className="flex-1 min-w-[180px]" />
            )}
        </Flex>
    );
};
export default SearchCardDesktop;
