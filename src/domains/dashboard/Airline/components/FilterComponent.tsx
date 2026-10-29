import { useEffect, useState } from 'react';

import { Card, Checkbox, Col, Flex, Radio, Row, Slider, Space, Typography } from 'antd';
import isEqual from 'lodash/isEqual';
import { useDispatch } from 'react-redux';
import { ReactSVG } from 'react-svg';

import afternoon from '@src/domains/dashboard/Airline/assets/icons/afternoon.svg';
import morning from '@src/domains/dashboard/Airline/assets/icons/morning.svg';
import night from '@src/domains/dashboard/Airline/assets/icons/night.svg';
import noon from '@src/domains/dashboard/Airline/assets/icons/noon.svg';
import { useAppSelector } from '@src/hooks/store';
import { formatNumberWithLocalStringWithoutDecimalPoint } from '@utils/priceFormat';

import SortPresetCards, { SortPreset } from './searchResult/SortPresetCards';
import { updateSearchFilter } from '../slices/airlineSlice';
import { filterTypes, Flight, LayoverCounts } from '../types/Flight';
import { retrieveAirlineName } from '../utils/airlineData';
import { formattedTimeOnly } from '../utils/dateTime';
import { getFlightGroupKey } from '../utils/flightGrouping';

import '../assets/style.css';

type props = {
    flightsData: Flight[] | undefined;
    setFlightData: any;
    data: Flight[];
    rawInbount: Flight[];
    inbountFlights: Flight[];
    setInbountFlights: (value: Flight[]) => void;
    filterCount: any;
    filterValue: any;
    inbountFilterValue: { type: string; highest: boolean };
    setInbountFilterValue: ({ type, highest }: { type: string; highest: boolean }) => void;
    setFilterValue: ({ type, highest }: { type: string; highest: boolean }) => void;
    isNonStopOnly?: boolean;
    setIsNonStopOnly?: (value: boolean) => void;
    setFilterLoading: (value: boolean) => void;
    isMultiCity?: boolean;
};

const FilterComponent = ({
    flightsData,
    setFlightData,
    data,
    rawInbount,
    filterCount,
    filterValue,
    inbountFlights,
    inbountFilterValue,
    isNonStopOnly,
    setFilterLoading,
    setInbountFilterValue,
    setFilterValue,
    setInbountFlights,
    setIsNonStopOnly,
    isMultiCity,
}: props) => {
    const dispatch = useDispatch();

    const { highestPrice, lowestPrice } = filterCount;
    const [startValue, setStartValue] = useState<number>(lowestPrice);

    const { searchFilter } = useAppSelector(state => state.reducer.airline);

    const [endValue, setEndValue] = useState<number>(highestPrice);
    const [airlineRadioValue, setAirlineRadioValue] = useState<string[]>([]);
    const [airlineTimeRadioValue, setAirlineTimeRadioValue] = useState<number[]>([]);
    const [layoverVal, setLayoverVal] = useState<number[]>([]);
    const [layoverCounts, setLayoverCounts] = useState({ 0: 0, 1: 0, 2: 0 });
    const [sortPreset, setSortPreset] = useState<SortPreset>(null);

    const handleSort = (updateState: any, dataSource: any, filter: any) => {
        if (!Array.isArray(dataSource) || dataSource.length === 0) return [];

        const value = filter.type;
        const { highest } = filter;
        if (value === '') return dataSource;
        let sortedData: Flight[] = [];

        if (value === 'price') {
            if (highest === true) {
                sortedData = dataSource.slice().sort((a, b) => a.price - b.price);
                updateState(sortedData);
            }
            if (highest === false) {
                sortedData = dataSource.slice().sort((a, b) => b.price - a.price);
                updateState(sortedData);
            }
        }

        if (value === 'arrival') {
            if (highest === true) {
                sortedData = dataSource.slice().sort((a, b) => {
                    const timeA = new Date(a.arrive.datetime);
                    const timeB = new Date(b.arrive.datetime);
                    // @ts-ignore
                    return timeA - timeB;
                });
            }
            if (highest === false) {
                sortedData = dataSource.slice().sort((a, b) => {
                    const timeA = new Date(a.arrive.datetime);
                    const timeB = new Date(b.arrive.datetime);
                    // @ts-ignore
                    return timeB - timeA;
                });
            }
            updateState(sortedData);
        }
        if (value === 'duration') {
            sortedData = dataSource.slice().sort((a, b) => {
                const durA = a.flightDuration || 0;
                const durB = b.flightDuration || 0;
                return highest ? durA - durB : durB - durA;
            });
            updateState(sortedData);
        }

        if (value === 'stops') {
            sortedData = dataSource.slice().sort((a, b) => {
                const sA = Number.isFinite(a?.stopCount) ? a.stopCount : 99;
                const sB = Number.isFinite(b?.stopCount) ? b.stopCount : 99;
                return highest ? sA - sB : sB - sA;
            });
            updateState(sortedData);
        }

        if (value === 'departure') {
            if (highest === true) {
                sortedData = dataSource.slice().sort((a, b) => {
                    const timeA = new Date(a.depart.datetime);
                    const timeB = new Date(b.depart.datetime);
                    // @ts-ignore
                    return timeA - timeB;
                });
            }
            if (highest === false) {
                sortedData = dataSource.slice().sort((a, b) => {
                    const timeA = new Date(a.depart.datetime);
                    const timeB = new Date(b.depart.datetime);
                    // @ts-ignore
                    return timeB - timeA;
                });
            }
            updateState(sortedData);
        }

        return sortedData;
    };

    const handleFilter = ({
        startPrice,
        endPrice,
        layover,
        airlineTimeCode,
        flightCode,
    }: filterTypes) => {
        function filter(updateState: (value: Flight[]) => void, rawData: Flight[], filterObj: any) {
            let filteredData = rawData;
            filteredData = filteredData.filter(
                (flight: Flight) => flight.price >= startPrice && flight.price <= endPrice
            );

            // Layover Filter if layover is not null
            if (layover.length > 0) {
                filteredData = filteredData.filter((flight: Flight) =>
                    flight.journey.every(segment => layover.includes(segment.length - 1))
                );
            }

            // Airline filter if flightCode is not null
            if (flightCode.length > 0) {
                filteredData = filteredData.filter((flight: Flight) =>
                    flightCode.includes(flight.flightCode)
                );
            }
            // Airline Time Filter
            if (airlineTimeCode.length > 0) {
                const airlineTime = {
                    1: ['00:00', '11:59'],
                    2: ['12:00', '14:59'],
                    3: ['15:00', '17:59'],
                    4: ['18:00', '23:59'],
                };

                filteredData = filteredData.filter((flight: Flight) =>
                    airlineTimeCode.some((timeCode: number) => {
                        const [startTime, endTime] = airlineTime[timeCode as 1 | 2 | 3 | 4];
                        const flightTime = formattedTimeOnly(new Date(flight.depart.datetime));
                        return flightTime >= startTime && flightTime <= endTime;
                    })
                );
            }

            filteredData = handleSort(updateState, filteredData, filterObj);
            updateState(filteredData);
        }

        filter(setFlightData, data, filterValue);
        filter(setInbountFlights, rawInbount, inbountFilterValue);

        setFilterLoading(true);
        setTimeout(() => {
            setFilterLoading(false);
        }, 200);
    };

    const onChange = (values: [number, number]) => {
        setStartValue(values[0]);
        setEndValue(values[1]);
    };

    const handlePresetClick = (preset: SortPreset) => {
        setSortPreset(preset);
        if (preset === 'cheapest') {
            setFilterValue({ type: 'price', highest: true });
            setInbountFilterValue({ type: 'price', highest: true });
        } else if (preset === 'nonstop') {
            setFilterValue({ type: 'stops', highest: true });
            setInbountFilterValue({ type: 'stops', highest: true });
        } else if (preset === 'fastest') {
            setFilterValue({ type: 'duration', highest: true });
            setInbountFilterValue({ type: 'duration', highest: true });
        }
    };

    const handleFilterReset = () => {
        // const sortedData = handleSort(data);
        setFlightData(data);
        setFilterValue({ type: '', highest: true });
        setInbountFilterValue({ type: '', highest: true });
        setSortPreset(null);

        onChange([lowestPrice, highestPrice]);
        setAirlineRadioValue([]);
        setAirlineTimeRadioValue([]);
        setLayoverVal([]);
        if (setIsNonStopOnly) {
            setIsNonStopOnly(false);
        }
    };

    const airlineCodes = new Set();

    data?.forEach((item: Flight) => {
        airlineCodes.add(item.flightCode);
    });
    const airlineOptions = Array.from(airlineCodes);

    const updateDepartTimeFilter = (code: number) => {
        const newValue = airlineTimeRadioValue.includes(code)
            ? airlineTimeRadioValue.filter((value: any) => value !== code)
            : [...airlineTimeRadioValue, code];

        setAirlineTimeRadioValue(newValue);
    };

    useEffect(() => {
        if (filterValue && filterValue.type) {
            handleSort(setFlightData, flightsData!, filterValue);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterValue]);

    useEffect(() => {
        if (inbountFilterValue && inbountFilterValue.type) {
            handleSort(setInbountFlights, inbountFlights, inbountFilterValue);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inbountFilterValue]);

    useEffect(() => {
        const calculateLayoverCounts = () => {
            // Apply all filters except layover
            const filteredData = data
                .filter((flight: Flight) => flight.price >= startValue && flight.price <= endValue)
                .filter((flight: Flight) =>
                    airlineRadioValue.length > 0
                        ? airlineRadioValue.includes(flight.flightCode)
                        : true
                )
                .filter((flight: Flight) =>
                    airlineTimeRadioValue.length > 0
                        ? airlineTimeRadioValue.some((timeCode: number) => {
                              const airlineTime = {
                                  1: ['00:00', '11:59'],
                                  2: ['12:00', '14:59'],
                                  3: ['15:00', '17:59'],
                                  4: ['18:00', '23:59'],
                              };
                              const [startTime, endTime] = airlineTime[timeCode as 1 | 2 | 3 | 4];
                              const flightTime = formattedTimeOnly(
                                  new Date(flight.depart.datetime)
                              );
                              return flightTime >= startTime && flightTime <= endTime;
                          })
                        : true
                );

            // Count grouped flights, not raw fare variants — dedupe by the same key
            // SearchResultBody groups on, so the count matches the rendered list.
            const counts: LayoverCounts = { 0: 0, 1: 0, 2: 0 };
            const seen = new Set<string>();
            filteredData.forEach((flight: Flight) => {
                const key = getFlightGroupKey(flight, isMultiCity);
                if (seen.has(key)) return;
                seen.add(key);
                const stopCounts = flight.journey.map(segment => segment.length - 1);
                const uniqueValues = new Set(stopCounts);
                if (uniqueValues.size === 1) {
                    const stopCount = [...uniqueValues][0];
                    counts[stopCount as 0 | 1 | 2] += 1;
                }
            });
            setLayoverCounts(counts);
        };

        calculateLayoverCounts();
        dispatch(
            updateSearchFilter({
                startValue,
                endValue,
                airlineRadioValue,
                airlineTimeRadioValue,
                layoverVal,
            })
        );
    }, [
        data,
        startValue,
        endValue,
        airlineRadioValue,
        airlineTimeRadioValue,
        layoverVal,
        dispatch,
        isMultiCity,
    ]);

    useEffect(() => {
        handleFilter({
            startPrice: startValue,
            endPrice: endValue,
            layover: layoverVal,
            airlineTimeCode: airlineTimeRadioValue,
            flightCode: airlineRadioValue,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [layoverVal, airlineTimeRadioValue, airlineRadioValue]);

    useEffect(() => {
        if (isNonStopOnly) {
            setLayoverVal([0]);
        } else if (layoverVal.length === 1) {
            setLayoverVal([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isNonStopOnly]);

    useEffect(() => {
        if (!setIsNonStopOnly) return;
        if (layoverVal.length === 1 && layoverVal[0] === 0) {
            setIsNonStopOnly(true);
        } else {
            setIsNonStopOnly(false);
        }
    }, [layoverVal, setIsNonStopOnly]);

    useEffect(() => {
        let isUpdated = false;
        if (startValue !== searchFilter.startValue && searchFilter.startValue !== 0) {
            setStartValue(searchFilter.startValue);
            isUpdated = true;
        }
        if (endValue !== searchFilter.endValue && searchFilter.endValue !== 0) {
            setEndValue(searchFilter.endValue);
            isUpdated = true;
        }
        if (!isEqual(airlineRadioValue, searchFilter.airlineRadioValue)) {
            setAirlineRadioValue(searchFilter.airlineRadioValue);
        }
        if (!isEqual(airlineTimeRadioValue, searchFilter.airlineTimeRadioValue)) {
            setAirlineTimeRadioValue(searchFilter.airlineTimeRadioValue);
        }
        if (!isEqual(layoverVal, searchFilter.layoverVal)) {
            setLayoverVal(searchFilter.layoverVal);
        }

        if (isUpdated) {
            handleFilter({
                startPrice: searchFilter.startValue,
                endPrice: searchFilter.endValue,
                layover: layoverVal,
                airlineTimeCode: airlineTimeRadioValue,
                flightCode: airlineRadioValue,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchFilter]);

    return (
        <Card
            className="border-gray-100 rounded-xl mt-7 xl:mt-0"
            bodyStyle={{ padding: 15 }}
            style={{ minHeight: '100%' }}
        >
            <Flex justify="space-between">
                <Typography.Text className="text-lg font-bold leading-6">Filter</Typography.Text>
                <Flex align="center" justify="center">
                    <Typography.Link
                        onClick={() => handleFilterReset()}
                        type="danger"
                        className="font-medium text-bgOrange2 cursor-pointer"
                    >
                        Reset
                    </Typography.Link>
                </Flex>
            </Flex>
            <Flex vertical className="my-5 gap-3">
                <Typography.Text className="text-base font-medium leading-6">Price</Typography.Text>
                <Slider
                    range
                    className="text-red-500"
                    onChangeComplete={e => {
                        handleFilter({
                            startPrice: e[0],
                            endPrice: e[1],
                            layover: layoverVal,
                            airlineTimeCode: airlineTimeRadioValue,
                            flightCode: airlineRadioValue,
                        });
                    }}
                    onChange={values => {
                        onChange(values as [number, number]);
                    }}
                    value={[startValue, endValue]}
                    min={lowestPrice}
                    max={highestPrice}
                />
                <Row className="gap-2 flex xl:flex-row md:flex-col">
                    <Col sm={24} className="border border-gray-100 p-2 flex-1 flex-col rounded-[12px]">
                        <Typography.Text className="text-neutral-400 text-sm font-normal leading-6">
                            Min price
                        </Typography.Text>
                        <Typography.Text className="text-xs font-medium line-clamp-2 cursor-default">{`₹ ${formatNumberWithLocalStringWithoutDecimalPoint(startValue)}`}</Typography.Text>
                        {/* <InputNumber
                            min={lowestPrice}
                            max={highestPrice}
                            type="number"
                            variant="borderless"
                            className="text-sm font-medium w-full m-0 p-0"
                            value={lowestPrice}
                            onChange={value => setStartValue(value !== null ? value : 1)}
                            size="small"
                            controls={false}
                            prefix={
                                <Typography.Text className="text-sm m-0 p-0">₹</Typography.Text>
                            }
                        /> */}
                    </Col>
                    <Col sm={24} className="border border-gray-100 p-2 flex-1 flex-col rounded-[12px]">
                        <Typography.Text className="text-neutral-400 text-sm font-normal leading-6">
                            Max price
                        </Typography.Text>
                        <Typography.Text className="text-xs font-medium line-clamp-2 cursor-default">{`₹ ${formatNumberWithLocalStringWithoutDecimalPoint(endValue)}`}</Typography.Text>
                        {/* <InputNumber
                            min={0}
                            max={highestPrice}
                            type="number"
                            variant="borderless"
                            className="text-base font-medium w-full m-0 p-0 "
                            value={endValue ?? 10}
                            onChange={value => {
                                setEndValue(value !== null ? value : 10);
                            }}
                            prefix={
                                <Typography.Text className="text-sm m-0 p-0">₹</Typography.Text>
                            }
                            controls={false}
                            size="small"
                        /> */}
                    </Col>
                </Row>
            </Flex>
            <SortPresetCards
                data={flightsData ?? []}
                selected={sortPreset}
                onSelect={handlePresetClick}
            />
            <Typography.Text className="text-base font-medium leading-6">
                Departure Time
            </Typography.Text>

            <Radio.Group className="w-full" value={airlineTimeRadioValue}>
                <Row justify="space-between" gutter={[10, 10]} className="my-5">
                    <Col xs={12} sm={24} md={24} lg={24} xl={12}>
                        <Radio.Button
                            value={1}
                            className="w-full h-auto m-1"
                            style={{
                                borderRadius: '12px',
                                borderColor: airlineTimeRadioValue.includes(1) ? 'red' : '#f5f5f5',
                            }}
                            onClick={() => {
                                updateDepartTimeFilter(1);
                            }}
                        >
                            <Flex vertical align="center" className="py-2">
                                <ReactSVG src={morning} className="mr-1" />
                                <Typography.Text className="text-xs font-normal leading-6 line-clamp-1">
                                    Morning
                                </Typography.Text>
                                <Flex justify="center" wrap="wrap">
                                    <Typography.Text className="text-xs font-normal leading-6 line-clamp-1">
                                        00:00 -
                                    </Typography.Text>
                                    <Typography.Text className="text-xs font-normal leading-6 line-clamp-1">
                                        11:59
                                    </Typography.Text>
                                </Flex>
                            </Flex>
                        </Radio.Button>
                    </Col>
                    <Col xs={12} sm={24} md={24} lg={24} xl={12}>
                        <Radio.Button
                            value={2}
                            className="w-full h-auto m-1"
                            style={{
                                borderRadius: '12px',
                                borderColor: airlineTimeRadioValue.includes(2) ? 'red' : '#f5f5f5',
                            }}
                            onClick={() => {
                                updateDepartTimeFilter(2);
                            }}
                        >
                            <Flex vertical align="center" className="py-2">
                                <ReactSVG src={noon} />
                                <Typography.Paragraph className="text-xs font-normal leading-6  line-clamp-1">
                                    Noon
                                </Typography.Paragraph>
                                <Flex justify="center" wrap="wrap">
                                    <Typography.Text className="text-xs font-normal leading-6 line-clamp-1">
                                        12:00 -
                                    </Typography.Text>
                                    <Typography.Text className="text-xs font-normal leading-6 line-clamp-1">
                                        14:59
                                    </Typography.Text>
                                </Flex>
                            </Flex>
                        </Radio.Button>
                    </Col>
                    <Col xs={12} sm={24} md={24} lg={24} xl={12}>
                        <Radio.Button
                            value={3}
                            className="w-full  h-auto m-1"
                            style={{
                                borderRadius: '12px',
                                borderColor: airlineTimeRadioValue.includes(3) ? 'red' : '#f5f5f5',
                            }}
                            onClick={() => {
                                updateDepartTimeFilter(3);
                            }}
                        >
                            <Flex vertical align="center" className="py-2">
                                <ReactSVG src={afternoon} />
                                <Typography.Paragraph className="text-xs font-normal leading-6  line-clamp-1">
                                    Afternoon
                                </Typography.Paragraph>
                                <Flex justify="center" wrap="wrap">
                                    <Typography.Text className="text-xs font-normal leading-6 line-clamp-1">
                                        15:00 -
                                    </Typography.Text>
                                    <Typography.Text className="text-xs font-normal leading-6 line-clamp-1">
                                        17:59
                                    </Typography.Text>
                                </Flex>
                            </Flex>
                        </Radio.Button>
                    </Col>
                    <Col xs={12} sm={24} md={24} lg={24} xl={12}>
                        <Radio.Button
                            value={4}
                            className="w-full h-auto m-1"
                            style={{
                                borderRadius: '12px',
                                borderColor: airlineTimeRadioValue.includes(4) ? 'red' : '#f5f5f5',
                            }}
                            onClick={() => {
                                updateDepartTimeFilter(4);
                            }}
                        >
                            <Flex vertical align="center" className="py-2">
                                <ReactSVG src={night} />
                                <Typography.Paragraph className="text-xs font-normal leading-6  line-clamp-1">
                                    Night
                                </Typography.Paragraph>
                                <Flex justify="center" wrap="wrap">
                                    <Typography.Text className="text-xs font-normal leading-6 line-clamp-1">
                                        18:00 -
                                    </Typography.Text>
                                    <Typography.Text className="text-xs font-normal leading-6 line-clamp-1">
                                        23:59
                                    </Typography.Text>
                                </Flex>
                            </Flex>
                        </Radio.Button>
                    </Col>
                </Row>
            </Radio.Group>

            <Typography.Text className="text-base font-medium leading-6">
                Number of Layovers
            </Typography.Text>
            <br />

            <Checkbox.Group
                className="mt-2 w-full"
                value={layoverVal}
                onChange={(selectedValues: number[]) => {
                    setLayoverVal(selectedValues);
                }}
            >
                <Space direction="vertical" className="w-full">
                    <Flex justify="space-between" className="w-full">
                        <Checkbox value={0}>Non Stop</Checkbox>
                        <Typography.Text className="text-center">
                            {layoverCounts[0]}
                        </Typography.Text>
                    </Flex>
                    <Flex justify="space-between" className="w-full">
                        <Checkbox value={1}>1 Stop</Checkbox>
                        <Typography.Text className="text-center">
                            {layoverCounts[1]}
                        </Typography.Text>
                    </Flex>
                    <Flex justify="space-between" className="w-full">
                        <Checkbox value={2}>2 Stops</Checkbox>
                        <Typography.Text className="text-center">
                            {layoverCounts[2]}
                        </Typography.Text>
                    </Flex>
                </Space>
            </Checkbox.Group>

            <Row className="mt-8">
                <Typography.Text className="text-base font-medium leading-6">
                    Airlines
                </Typography.Text>
            </Row>

            <Checkbox.Group
                className="mt-2"
                value={airlineRadioValue}
                onChange={(selectedValues: string[]) => {
                    setAirlineRadioValue(selectedValues);
                }}
            >
                <Space direction="vertical">
                    {/* <Checkbox value="">All Airlines</Checkbox> this is is not required in web already showing all airlines */}
                    {airlineOptions.sort().map((item, i) => (
                        <Checkbox value={item} key={i}>
                            {retrieveAirlineName(item as string)}
                        </Checkbox>
                    ))}
                </Space>
            </Checkbox.Group>
        </Card>
    );
};

export default FilterComponent;
