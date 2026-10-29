import React, { useState } from 'react';

import { FilterOutlined } from '@ant-design/icons';
import { Col, Flex, Modal, Row, Spin } from 'antd';
import Lottie from 'react-lottie';

import { useAppSelector } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';

import DateCarousel from '../components/searchResult/DateCarousel';
import FlightSelectionSubmitButton from '../components/searchResult/FlightSelectionSubmitButton';
import SearchResultBody from '../components/searchResult/SearchResultBody';
import WebHeader from '../components/searchResult/WebHeader';
// import useDomesticRoundTrip from '../hooks/useDomesticRoundTrip';
import { FareCalendarPriceMap } from '../hooks/useFareCalendar';
import { Flight } from '../types/Flight';
import { AirlineSearchAnimation } from '../utils/lottie';

interface WebResultsBodyProps {
    isLoading: boolean;
    filterComponent: React.ReactNode;
    flightData: Flight[];
    dataSource: Flight[];
    inbountFlights: Flight[];
    filterValue: { type: string; highest: boolean };
    inbountFilterValue: { type: string; highest: boolean };
    filterLoading: boolean;
    setInbountFilterValue: ({ type, highest }: { type: string; highest: boolean }) => void;
    setFilterValue: ({ type, highest }: { type: string; highest: boolean }) => void;
    priceMap?: FareCalendarPriceMap;
    fareCalendarLoading?: boolean;
    onDateSelect?: (date: string) => void;
    searchParams?: {
        tripType?: number;
        fromLocation1?: string;
        toLocation1?: string;
        depart1?: string;
        arrive?: string;
        originCountryCode?: string;
        destinationCountryCode?: string;
    };
}

const WebSearchResults = ({
    isLoading,
    filterComponent,
    flightData,
    filterValue,
    dataSource,
    inbountFlights,
    inbountFilterValue,
    filterLoading,
    setInbountFilterValue,
    setFilterValue,
    priceMap,
    fareCalendarLoading,
    onDateSelect,
    searchParams,
}: WebResultsBodyProps) => {
    const { xl } = useScreenSize();
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const searchData = useAppSelector(state => state.reducer.airline.searchData);
    const selectedDate = searchParams?.depart1 || searchData?.depart1 || '';
    
    // Determine if it's domestic round trip based on searchParams (only tripType === 2)
    const isDomesticRoundTrip =
        searchParams?.tripType === 2 &&
        searchParams?.originCountryCode === 'IN' &&
        searchParams?.destinationCountryCode === 'IN' &&
        searchParams?.originCountryCode === searchParams?.destinationCountryCode;

    // Multi-city (tripType 3) returns a single COMBINED itinerary — one ResultIndex whose
    // Segments span every leg (Segments[0]=leg1, Segments[1]=leg2), exactly like an
    // international round trip. So it renders in the single-column layout (SearchResultCard
    // maps the full journey, showing all legs) and books a single ResultIndex — NOT the
    // two-column / two-ResultIndex layout used for a domestic round trip.
    const isMultiCity = searchParams?.tripType === 3;
    const isTwoColumn = isDomesticRoundTrip;

    if (isLoading || !flightData || dataSource.length === 0) {
        return (
            <Spin
                className="mt-36 pointer-events-none"
                indicator={<Lottie options={AirlineSearchAnimation} height={300} width={600} />}
                spinning
            />
        );
    }

    if (isTwoColumn) {
        return (
            <Row gutter={[20, 20]}>
                <Col span={6}>{filterComponent}</Col>
                <Col span={18}>
                    <Flex gap={10}>
                        <Flex vertical style={{ minHeight: '100%' }} className="flex-1">
                            <WebHeader
                                filterValue={filterValue}
                                setFilterValue={setFilterValue}
                                isDomesticRoundTrip
                                isOutbount
                                searchParams={searchParams}
                            />
                            <SearchResultBody
                                flights={flightData}
                                isDomesticRoundTrip
                                dataSource={dataSource}
                                filterLoading={filterLoading}
                            />
                        </Flex>
                        <Flex vertical style={{ minHeight: '100%' }} className="flex-1">
                            <WebHeader
                                filterValue={inbountFilterValue}
                                setFilterValue={setInbountFilterValue}
                                isDomesticRoundTrip
                                searchParams={searchParams}
                            />
                            <SearchResultBody
                                flights={inbountFlights}
                                isDomesticRoundTrip
                                isInbount
                                dataSource={dataSource}
                                filterLoading={filterLoading}
                            />
                        </Flex>
                    </Flex>

                    <Flex className="sticky bottom-0 right-0">
                        <FlightSelectionSubmitButton />
                    </Flex>
                </Col>
            </Row>
        );
    }

    return xl ? (
        <Row gutter={[20, 20]}>
            <Col span={6}>{filterComponent}</Col>
            <Col span={18}>
                <Flex vertical gap={16} style={{ minHeight: '100%' }}>
                    {selectedDate && !isMultiCity && (
                        <DateCarousel
                            initialDate={selectedDate}
                            priceMap={priceMap}
                            isLoading={fareCalendarLoading}
                            onDateSelect={onDateSelect}
                        />
                    )}
                    <Flex vertical style={{ minHeight: '100%' }}>
                        <WebHeader
                            filterValue={filterValue}
                            setFilterValue={setFilterValue}
                            searchParams={searchParams}
                        />
                        <SearchResultBody
                            flights={flightData}
                            dataSource={dataSource}
                            filterLoading={filterLoading}
                            isMultiCity={isMultiCity}
                        />
                    </Flex>
                </Flex>
            </Col>
        </Row>
    ) : (
        <Row gutter={[20, 20]}>
            <Col span={24}>
                <Col
                    className="border flex w-full p-1 text-center justify-center item-center rounded-md bg-gray-50 cursor-pointer"
                    onClick={() => setIsModalOpen(true)}
                >
                    <FilterOutlined className="mr-2" /> Filter
                </Col>
                <Modal
                    okButtonProps={{ className: 'bg-red-500' }}
                    open={isModalOpen}
                    onCancel={() => setIsModalOpen(false)}
                    width={370}
                    footer={null}
                >
                    {filterComponent}
                </Modal>
            </Col>
            <Col span={24}>
                <Flex vertical style={{ minHeight: '100%' }}>
                    <WebHeader
                        filterValue={filterValue}
                        setFilterValue={setFilterValue}
                        searchParams={searchParams}
                    />
                    <SearchResultBody
                        flights={flightData}
                        dataSource={dataSource}
                        filterLoading={filterLoading}
                        isLoading={isLoading}
                        isMultiCity={isMultiCity}
                    />
                </Flex>
            </Col>
        </Row>
    );
};

export default WebSearchResults;
