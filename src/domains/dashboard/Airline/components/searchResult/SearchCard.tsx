import React, { useCallback, useEffect, useState } from 'react';

import { AutoComplete, Card, Col, Flex, Row, Typography } from 'antd';
import dayjs from 'dayjs';
import { useField, useFormikContext } from 'formik';
import moment from 'moment';
import { ReactSVG } from 'react-svg';

import SwapSVG from '../../assets/icons/swap.svg';
import { useGetSearchAirport } from '../../hooks/useSearchAirport';
import { ITripData } from '../../types/airlineTypes';
import { ISearchData } from '../../types/searchAirports';
import { retrieveAirport } from '../../utils/airlineData';
import Autocomplete from '../autocomplete/AutoCompleteSelection';
import Date from '../DatePicker';

import '../../assets/style.css';

const swapSVGPath = SwapSVG;

const GRID_STYLE: React.CSSProperties = {
    width: '50%',
    padding: '0.7rem',
    alignItems: 'center',
    borderRadius: '.80rem',
    height: '4rem',
};

const GRID_STYLE_END: React.CSSProperties = {
    width: '50%',
    height: '4rem',
    padding: '.5rem',
    alignItems: 'center',
    borderTopRightRadius: '.80rem',
    borderBottomRightRadius: '.80rem',
};

const GRID_STYLE_START: React.CSSProperties = {
    width: '50%',
    height: '4rem',
    padding: '.5rem',
    alignItems: 'center',
    borderTopLeftRadius: '.80rem',
    borderBottomLeftRadius: '.80rem',
};

type SearchCardProps = {
    index: number;
    values: any;
    removeSegment?: () => void;
    addSegment?: () => void;
    showPassengerModal: () => void;
    isLoading: boolean;
    tripType: number;
    isMultiCity?: boolean;
};

type DateTime = {
    date: string;
    day: string;
};

const SearchCard: React.FC<SearchCardProps> = ({
    index,
    values,
    removeSegment,
    addSegment,
    showPassengerModal,
    isLoading,
    tripType,
    isMultiCity = false,
}) => {
    const { setFieldValue } = useFormikContext();
    const [field] = useField(`flightSegments.${index}`);
    const segment = field.value;

    const [searchKey, setSearchKey] = useState<string>(segment.departureAirportCode || '');
    const [searchKeyTo, setSearchKeyTo] = useState<string>(segment.arrivalAirportCode || '');
    const [searchData, setSearchData] = useState<ISearchData[]>([]);
    const [searchDataTo, setSearchDataTo] = useState<ISearchData[]>([]);

    const getInitialDepartureDate = () => {
        if (segment.departureDate) {
            return dayjs(segment.departureDate, 'YYYY-MM-DD').format('DD-MM-YYYY');
        }
        return '';
    };

    const getInitialDepartureDay = () => {
        if (segment.departureDate) {
            return dayjs(segment.departureDate, 'YYYY-MM-DD').format('dddd');
        }
        return '';
    };

    const getInitialReturnDate = () => {
        if (segment.returnDate) {
            return dayjs(segment.returnDate, 'YYYY-MM-DD').format('DD-MM-YYYY');
        }
        return '';
    };

    const getInitialReturnDay = () => {
        if (segment.returnDate) {
            return dayjs(segment.returnDate, 'YYYY-MM-DD').format('dddd');
        }
        return '';
    };

    const [departureData, setDepartureData] = useState<DateTime>({
        date: getInitialDepartureDate(),
        day: getInitialDepartureDay(),
    });

    const [arrivalData, setArrivalData] = useState<DateTime>({
        date: getInitialReturnDate(),
        day: getInitialReturnDay(),
    });

    // Sync with Formik segment changes
    useEffect(() => {
        if (segment.departureAirportCode !== searchKey) {
            setSearchKey(segment.departureAirportCode || '');
        }
        if (segment.arrivalAirportCode !== searchKeyTo) {
            setSearchKeyTo(segment.arrivalAirportCode || '');
        }
        const newDepartureDate = segment.departureDate
            ? dayjs(segment.departureDate, 'YYYY-MM-DD').format('DD-MM-YYYY')
            : '';
        const newDepartureDay = segment.departureDate
            ? dayjs(segment.departureDate, 'YYYY-MM-DD').format('dddd')
            : '';
        if (newDepartureDate !== departureData.date) {
            setDepartureData({ date: newDepartureDate, day: newDepartureDay });
        }
        const newReturnDate = segment.returnDate
            ? dayjs(segment.returnDate, 'YYYY-MM-DD').format('DD-MM-YYYY')
            : '';
        const newReturnDay = segment.returnDate
            ? dayjs(segment.returnDate, 'YYYY-MM-DD').format('dddd')
            : '';
        if (newReturnDate !== arrivalData.date) {
            setArrivalData({ date: newReturnDate, day: newReturnDay });
        }
    }, [
        segment.departureAirportCode,
        segment.arrivalAirportCode,
        segment.departureDate,
        segment.returnDate,
        searchKey,
        searchKeyTo,
        departureData.date,
        arrivalData.date,
    ]);

    const airportSearch = useGetSearchAirport(searchKey || '');
    const airportSearchTo = useGetSearchAirport(searchKeyTo || '');

    const disabledEndDate = useCallback(
        (current: any) => {
            if (index === 0 && tripType === 2) {
                const parsedDepart1 = moment(departureData.date, 'DD-MM-YYYY').startOf('day');
                return current && current < parsedDepart1;
            }
            if (isMultiCity && index > 0) {
                const prevSegment = values.flightSegments[index - 1];
                if (prevSegment?.departureDate) {
                    const prevDate = moment(prevSegment.departureDate, 'YYYY-MM-DD').startOf('day');
                    return current && current < prevDate;
                }
            }
            return false;
        },
        [departureData.date, index, tripType, isMultiCity, values.flightSegments]
    );

    const disabledStartDate = useCallback(
        (current: any) => {
            if (isMultiCity && index > 0) {
                const prevSegment = values.flightSegments[index - 1];
                if (prevSegment?.arrivalAirportCode) {
                    const prevDate = moment(prevSegment.departureDate, 'YYYY-MM-DD')
                        .add(1, 'day')
                        .startOf('day');
                    return current && current < prevDate;
                }
            }
            return current && current < moment().startOf('day');
        },
        [index, isMultiCity, values.flightSegments]
    );

    const handleLocationSwap = useCallback(() => {
        const tempFrom = segment.departureAirportCode;
        const tempTo = segment.arrivalAirportCode;

        // Update Formik field
        setFieldValue(`flightSegments.${index}.departureAirportCode`, tempTo);
        setFieldValue(`flightSegments.${index}.arrivalAirportCode`, tempFrom);

        // Swap local state
        setSearchKey(searchKeyTo);
        setSearchKeyTo(searchKey);
        setSearchData(searchDataTo);
        setSearchDataTo(searchData);
    }, [segment, searchKey, searchKeyTo, searchData, searchDataTo, index, setFieldValue]);

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

    // Multi-city sync: when first route's "to" changes, update second route's "from"
    useEffect(() => {
        if (isMultiCity && index === 1 && values.flightSegments[0]?.arrivalAirportCode) {
            const firstSegmentTo = values.flightSegments[0].arrivalAirportCode;
            if (segment.departureAirportCode !== firstSegmentTo) {
                setFieldValue(`flightSegments.${index}.departureAirportCode`, firstSegmentTo);
                setSearchKey(firstSegmentTo);
            }
        }
    }, [values.flightSegments, isMultiCity, index, segment.departureAirportCode, setFieldValue]);

    // Sync departure date changes to Formik
    useEffect(() => {
        if (departureData.date) {
            const formattedDate = dayjs(departureData.date, 'DD-MM-YYYY').format('YYYY-MM-DD');
            if (segment.departureDate !== formattedDate) {
                setFieldValue(`flightSegments.${index}.departureDate`, formattedDate);
            }
        }
    }, [departureData.date, index, setFieldValue, segment.departureDate]);

    // Sync return date changes to Formik
    useEffect(() => {
        if (arrivalData.date && tripType === 2) {
            const formattedDate = dayjs(arrivalData.date, 'DD-MM-YYYY').format('YYYY-MM-DD');
            if (segment.returnDate !== formattedDate) {
                setFieldValue(`flightSegments.${index}.returnDate`, formattedDate);
            }
        } else if (tripType !== 2 && segment.returnDate) {
            setFieldValue(`flightSegments.${index}.returnDate`, '');
        }
    }, [arrivalData.date, tripType, index, setFieldValue, segment.returnDate]);

    if (isMultiCity && index > 0) {
        // Multi-city second row
        return (
            <Row gutter={10} justify="space-between" className="h-20 me-10 mt-3">
                <Col md={6} xl={6}>
                    <Card className="flex flex-col border-none" bodyStyle={{ padding: 0 }}>
                        <Card.Grid hoverable={false} style={GRID_STYLE_START}>
                            <AutoComplete
                                options={searchData}
                                defaultValue={segment.departureAirportCode || ''}
                                onSelect={(val: string) => {
                                    setFieldValue(
                                        `flightSegments.${index}.departureAirportCode`,
                                        val
                                    );
                                    setSearchKey(val);
                                }}
                                popupMatchSelectWidth={400}
                                onSearch={setSearchKey}
                                placeholder="Enter From Location"
                                variant="borderless"
                                className="w-full text-lg font-bold p-0 custom_autocomplete"
                                disabled={isLoading}
                            />
                            <Typography.Text className="text-xs text-start text-gray-500 mx-3 overflow-hidden line-clamp-1">
                                {retrieveAirport(segment.departureAirportCode || '')}
                            </Typography.Text>
                        </Card.Grid>
                        <Card className="border-0 w-0">
                            <Flex className="h-full w-full mt-4" justify="center" align="center">
                                <ReactSVG
                                    src={swapSVGPath}
                                    onClick={() => !isLoading && handleLocationSwap()}
                                    wrapper="div"
                                    beforeInjection={svg => {
                                        svg.setAttribute('style', 'cursor: pointer;');
                                    }}
                                />
                            </Flex>
                        </Card>
                        <Card.Grid hoverable={false} style={GRID_STYLE_END}>
                            <AutoComplete
                                options={searchData}
                                defaultValue={segment.arrivalAirportCode || ''}
                                onSelect={(val: string) => {
                                    setFieldValue(
                                        `flightSegments.${index}.arrivalAirportCode`,
                                        val
                                    );
                                    setSearchKeyTo(val);
                                }}
                                popupMatchSelectWidth={400}
                                onSearch={setSearchKey}
                                placeholder="Enter To Location"
                                variant="borderless"
                                className="w-full text-lg font-bold p-0 custom_autocomplete"
                                disabled={isLoading}
                            />
                            <Typography.Text className="text-xs text-start text-gray-500 mx-3 overflow-hidden line-clamp-1">
                                {retrieveAirport(segment.arrivalAirportCode || '')}
                            </Typography.Text>
                        </Card.Grid>
                    </Card>
                </Col>
                <Col md={3} xl={3}>
                    <Flex>
                        <Card style={GRID_STYLE} bodyStyle={{ padding: 0 }} className="flex-1">
                            <Typography.Text className="text-sm text-gray-500 py-1 px-0 flex-col">
                                <Date
                                    disabledDate={disabledStartDate}
                                    defaultDate={
                                        segment.departureDate
                                            ? dayjs(segment.departureDate, 'YYYY-MM-DD').format(
                                                  'DD-MM-YYYY'
                                              )
                                            : ''
                                    }
                                    dateData={setDepartureData}
                                    style={{ border: 0 }}
                                    disabledData={isLoading}
                                />
                                <Typography.Text className="text-xs text-gray-500 ms-3 line-clamp-1">
                                    {departureData.day !== '' ? departureData.day : ' '}
                                </Typography.Text>
                            </Typography.Text>
                        </Card>
                    </Flex>
                </Col>
                {addSegment && index === values.flightSegments.length - 1 && (
                    <Col md={5} lg={3} className="flex justify-center items-center">
                        <Flex justify="center" align="center" className="h-full">
                            <Typography.Text
                                className={`text-lg font-medium ${isLoading ? 'text-gray-500' : 'text-iconRed cursor-pointer'} line-clamp-1`}
                                onClick={() => !isLoading && addSegment()}
                            >
                                + Add Another Flight
                            </Typography.Text>
                        </Flex>
                    </Col>
                )}
            </Row>
        );
    }

    // Main search card (first row) - only location and date, no trip type or passenger
    return (
        <>
            {/* From/To Location Card */}
            <Col className="h-full" md={6} xl={6}>
                <Card className="flex flex-col border-none h-full" bodyStyle={{ padding: 0 }}>
                    <Card.Grid hoverable={false} style={GRID_STYLE_START}>
                        <Autocomplete
                            options={searchData}
                            onSelect={(loc, val) => {
                                setFieldValue(`flightSegments.${index}.departureAirportCode`, val);
                                setSearchKey(val);
                            }}
                            searchKey={searchKey}
                            setSearchKey={setSearchKey}
                            tripData={{} as ITripData}
                            location="fromLocation1"
                            disabled={isLoading}
                        />
                        <Typography.Text className="text-xs text-start text-gray-500 mx-3 overflow-hidden line-clamp-1">
                            {retrieveAirport(segment.departureAirportCode || '')}
                        </Typography.Text>
                    </Card.Grid>
                    <Card className="border-0 w-0 h-full">
                        <Flex className="h-full w-full mt-5" justify="center" align="center">
                            <ReactSVG
                                src={swapSVGPath}
                                onClick={() => !isLoading && handleLocationSwap()}
                                wrapper="div"
                                beforeInjection={svg => {
                                    svg.setAttribute('style', 'cursor: pointer;');
                                }}
                            />
                        </Flex>
                    </Card>
                    <Card.Grid hoverable={false} style={{ ...GRID_STYLE_END, paddingLeft: '1rem' }}>
                        <Autocomplete
                            options={searchDataTo}
                            onSelect={(loc, val) => {
                                setFieldValue(`flightSegments.${index}.arrivalAirportCode`, val);
                                setSearchKeyTo(val);
                            }}
                            searchKey={searchKeyTo}
                            setSearchKey={setSearchKeyTo}
                            tripData={{} as ITripData}
                            location="fromLocation1"
                            disabled={isLoading}
                        />
                        <Typography.Text className="text-xs text-start text-gray-500 mx-3 overflow-hidden line-clamp-1">
                            {retrieveAirport(segment.arrivalAirportCode || '')}
                        </Typography.Text>
                    </Card.Grid>
                </Card>
            </Col>

            {/* Date Card */}
            <Col className="" md={tripType === 3 ? 3 : 6} xl={tripType === 3 ? 3 : 6}>
                <Flex className="w-full">
                    <Card className="flex-1 border-none">
                        <Card.Grid
                            hoverable={false}
                            style={tripType === 3 ? GRID_STYLE : GRID_STYLE_START}
                            className="flex-1"
                        >
                            <Typography.Text className="text-sm text-gray-500 flex">
                                <Date
                                    defaultDate={
                                        segment.departureDate
                                            ? dayjs(segment.departureDate, 'YYYY-MM-DD').format(
                                                  'DD-MM-YYYY'
                                              )
                                            : ''
                                    }
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
                        {tripType === 1 && (
                            <Card.Grid hoverable={false} style={GRID_STYLE_END} className="flex-1">
                                {addSegment ? (
                                    <Flex gap={5} vertical>
                                        <Typography.Text
                                            className={`text-lg font-medium ${isLoading ? 'text-gray-500' : 'text-iconRed cursor-pointer'} mt-3 ms-3 line-clamp-1`}
                                            onClick={() => !isLoading && addSegment()}
                                        >
                                            + Add Return
                                        </Typography.Text>
                                    </Flex>
                                ) : null}
                            </Card.Grid>
                        )}
                        {tripType === 2 && (
                            <Card.Grid hoverable={false} style={GRID_STYLE_END} className="flex-1">
                                <Typography.Text className="text-sm text-gray-500 flex flex-col">
                                    <Date
                                        disabledData={isLoading}
                                        disabledDate={disabledEndDate}
                                        defaultDate={
                                            segment.returnDate
                                                ? dayjs(segment.returnDate, 'YYYY-MM-DD').format(
                                                      'DD-MM-YYYY'
                                                  )
                                                : ''
                                        }
                                        dateData={setArrivalData}
                                        style={{ border: 0 }}
                                    />
                                    <Typography.Text className="text-xs text-gray-500 ms-3 line-clamp-1">
                                        {arrivalData.day !== '' ? arrivalData.day : ' '}
                                    </Typography.Text>
                                </Typography.Text>
                            </Card.Grid>
                        )}
                    </Card>
                </Flex>
            </Col>
        </>
    );
};

export default SearchCard;
