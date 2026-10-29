import React, { useCallback, useEffect, useState } from 'react';

import { UserOutlined } from '@ant-design/icons';
import { Card, Col, Flex, Row, Typography } from 'antd';
import dayjs from 'dayjs';
import { ReactSVG } from 'react-svg';

import useDebounce from '@src/hooks/useDebounce';

import SwapSVG from '../../assets/icons/swap.svg';
import { useGetSearchAirport } from '../../hooks/useSearchAirport';
import { ITripData } from '../../types/airlineTypes';
import { ISearchData } from '../../types/searchAirports';
import { retrieveAirport } from '../../utils/airlineData';
import { retrieveFlightClass } from '../../utils/getFlightClass';
import Autocomplete from '../autocomplete/AutoCompleteSelectionMobile';
import Date from '../DatePicker';

interface SearchCardMobileProps {
    showModal: () => void;
    tripData: ITripData;
    setTripData: any;
    tripType: number;
    multicity: boolean;
    defaultFromTo?: string[];
}

type dateTime = {
    date: string;
    day: string;
};

const SearchCardMobile: React.FC<SearchCardMobileProps> = ({
    showModal,
    tripData,
    tripType,
    setTripData,
    multicity,
    defaultFromTo = ['', ''],
}) => {
    const [searchKey, setSearchKey] = useState<string>(defaultFromTo[0] || '');
    const [searchKeyTo, setSearchKeyTo] = useState<string>(defaultFromTo[1] || '');

    const [searchData, setSearchData] = useState<ISearchData[]>([]);
    const [searchDataTo, setSearchDataTo] = useState<ISearchData[]>();

    const debounceSearchText = useDebounce(searchKey, 200);
    const debounceSearchTextTo = useDebounce(searchKeyTo, 200);

    const [departureData, setDepartureData] = useState<dateTime>({
        date: dayjs().add(1, 'day').format('DD MM YYYY'),
        day: dayjs().add(1, 'day').format('dddd'),
    });
    const [arrivalData, setArrivalData] = useState<dateTime>({
        date: '',
        day: '',
    });

    const { data } = useGetSearchAirport(debounceSearchText);
    const { data: dataTo } = useGetSearchAirport(debounceSearchTextTo);

    const updateTripData = useCallback(
        (key: string, val: string) => {
            setTripData((prevTripData: object) => ({
                ...prevTripData,
                [key]: val,
            }));
        },
        [setTripData]
    );

    const handleLocationSwap = () => {
        const fromLocation = multicity ? tripData.fromLocation : tripData.fromLocation1;
        const toLocation = multicity ? tripData.toLocation : tripData.toLocation1;

        updateTripData(multicity ? 'fromLocation' : 'fromLocation1', toLocation);
        updateTripData(multicity ? 'toLocation' : 'toLocation1', fromLocation);
    };

    useEffect(() => {
        updateTripData(`${multicity ? 'depart' : 'depart1'}`, departureData.date);
        updateTripData(`${multicity ? 'departDay' : 'departDay1'}`, departureData.day);
    }, [departureData, updateTripData, multicity]);

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

    // Multi-city leg 2 (this card when multicity) must depart on/after leg 1 (tripData.depart1).
    // Mirrors SearchCardDesktop.disabledStartDate; also blocks past dates. (depart1 format may be
    // either DD-MM-YYYY or DD MM YYYY, so both are tried.)
    const disabledMultiCitySecondDate = (current: any) => {
        if (current && current < dayjs().startOf('day')) return true;
        if (!tripData.depart1) return false;
        let minDate = dayjs(tripData.depart1, 'DD-MM-YYYY', true);
        if (!minDate.isValid()) minDate = dayjs(tripData.depart1, 'DD MM YYYY', true);
        return Boolean(current && minDate.isValid() && current < minDate.startOf('day'));
    };

    return (
        <Row gutter={[24, 24]} className="overflow-x-hidden">
            <Col xs={24} sm={24} md={12} lg={10}>
                <Card
                    className="flex flex-col h-full border-none"
                    bodyStyle={{ padding: 0, height: '100%' }}
                >
                    <Row className="px-2" align="middle">
                        <Col span={11} className="border border-solid rounded-xl p-2">
                            <Autocomplete
                                options={searchData}
                                onSelect={updateTripData}
                                searchKey={searchKey}
                                setSearchKey={setSearchKey}
                                tripData={tripData}
                                location={multicity ? 'fromLocation' : 'fromLocation1'}
                            />
                            <Typography.Text className="text-xs text-start text-gray-500 mx-3 overflow-hidden line-clamp-1">
                                {retrieveAirport(
                                    tripData[multicity ? 'fromLocation' : 'fromLocation1']
                                ) ?? ''}
                            </Typography.Text>
                        </Col>
                        <Col span={2} className="w-full z-50">
                            <Flex className="w-full h-full" justify="center" align="center">
                                <ReactSVG src={SwapSVG} onClick={handleLocationSwap} />
                            </Flex>
                        </Col>
                        <Col span={11} className="border border-solid rounded-xl p-2">
                            <Autocomplete
                                options={searchDataTo}
                                onSelect={updateTripData}
                                searchKey={searchKey}
                                setSearchKey={setSearchKeyTo}
                                tripData={tripData}
                                location={multicity ? 'toLocation' : 'toLocation1'}
                            />
                            <Typography.Text className="text-xs text-start text-gray-500 mx-3 overflow-hidden line-clamp-1">
                                {retrieveAirport(
                                    tripData[multicity ? 'toLocation' : 'toLocation1']
                                ) ?? ''}
                            </Typography.Text>
                        </Col>
                    </Row>

                    <Row className="px-2 pt-5" align="middle" justify="space-between">
                        {/* Departure */}
                        <Col
                            span={tripType === 2 ? 11 : 24}
                            className="border border-solid rounded-xl px-1 py-2"
                        >
                            <Typography.Text className="font-semibold text-gray-500 py-1 block">
                                <Date
                                    placeholder="Departure Date"
                                    dateData={setDepartureData}
                                    style={{ border: 0 }}
                                    defaultDate={multicity ? tripData.depart : tripData.depart1}
                                    disabledDate={
                                        multicity ? disabledMultiCitySecondDate : undefined
                                    }
                                />
                            </Typography.Text>
                            <Typography.Text className="text-xs text-gray-500 mx-3">
                                {departureData.day !== ''
                                    ? departureData.day
                                    : 'Please Select Date'}
                            </Typography.Text>
                        </Col>

                        {/* Return (conditionally rendered) */}
                        {tripType === 2 && (
                            <>
                                <Col span={2} className="w-full z-50">
                                    <Flex className="w-full h-full" justify="center" align="center">
                                        &nbsp;
                                    </Flex>
                                </Col>
                                <Col span={11} className="border border-solid rounded-xl p-2">
                                    <Typography.Text className="font-semibold text-gray-500 py-1 px-0 block">
                                        <Date
                                            placeholder="Return Date"
                                            dateData={setArrivalData}
                                            style={{ border: 0 }}
                                        />
                                    </Typography.Text>
                                    <Typography.Text className="text-[0.65rem] text-gray-500 mx-2 ml-2">
                                        {arrivalData.day !== ''
                                            ? arrivalData.day
                                            : 'Please Select Date'}
                                    </Typography.Text>
                                </Col>
                            </>
                        )}
                    </Row>

                    <Row
                        className={`px-2 pt-5 ${multicity && 'hidden'}`}
                        align="middle"
                        justify="space-between"
                    >
                        <Col
                            span={11}
                            className="border border-solid rounded-xl p-2"
                            onClick={showModal}
                        >
                            <Typography.Text className="text-[0.71rem] text-gray-500 mx-2">
                                <UserOutlined />
                                &nbsp;
                                {tripData.adults + tripData.children + tripData.infants}{' '}
                                {tripData.adults + tripData.children + tripData.infants === 1
                                    ? 'Passenger'
                                    : 'Passengers'}
                            </Typography.Text>
                        </Col>
                        <Col span={2} className="w-full z-50">
                            <Flex className="w-full h-full" justify="center" align="center">
                                &nbsp;
                            </Flex>
                        </Col>
                        <Col
                            span={11}
                            className="border border-solid rounded-xl p-2"
                            onClick={showModal}
                        >
                            <Typography.Text className="text-[0.71rem] text-gray-500 mx-2">
                                {retrieveFlightClass(tripData.class)}
                            </Typography.Text>
                        </Col>
                    </Row>
                </Card>
            </Col>
        </Row>
    );
};

export default SearchCardMobile;
