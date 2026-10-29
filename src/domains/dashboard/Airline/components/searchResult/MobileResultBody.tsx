/* eslint-disable react-hooks/exhaustive-deps */
import React, { useMemo, useState } from 'react';

import { FilterOutlined, RightOutlined } from '@ant-design/icons';
import { Col, Flex, Modal, Row, Skeleton, Spin, Switch } from 'antd';
import Lottie from 'react-lottie';

import { useAppSelector } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';

import DateCarousel from './DateCarousel';
import MobileHeader from './MobileHeader';
import SearchResultCardMobile from './SearchResultCardMobile';
import SearchRoundTripResultCardMobile from './SearchRoundTripResultCardMobile';
import { FareCalendarPriceMap } from '../../hooks/useFareCalendar';
import { Flight } from '../../types/Flight';
import { AirlineSearchAnimation, AirlineSearchAnimationmobile } from '../../utils/lottie';

interface MobileResultBodyProps {
    isLoading: boolean;
    filterComponent: React.ReactNode;
    flightData: Flight[]; // outbound
    inbountFlights: Flight[]; // inbound
    isNonStopOnly: boolean;
    filterValue: { type: string; highest: boolean };
    setIsNonStopOnly: (value: boolean) => void;
    setFlightData: (value: Flight[]) => void;
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

export default function MobileResultBody({
    isLoading,
    filterComponent,
    flightData,
    inbountFlights,
    isNonStopOnly,
    filterValue,
    setIsNonStopOnly,
    setFlightData,
    setFilterValue,
    priceMap,
    fareCalendarLoading,
    onDateSelect,
    searchParams,
}: MobileResultBodyProps) {
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const { xs } = useScreenSize();
    const searchData = useAppSelector(state => state.reducer.airline.searchData);
    const selectedDate = searchParams?.depart1 || searchData?.depart1 || '';
    const isMultiCity = searchParams?.tripType === 3;
    // Utility to compute duration when needed (fallback).
    const computeDurationMs = (f: Flight) => {
        // Prefer explicit flight.flightDuration (minutes) if available.
        // Otherwise try to compute from flight.arrive / flight.depart fields.
        // Return milliseconds.
        if ((f as any).flightDuration !== undefined) {
            // convert minutes to ms
            return (f as any).flightDuration * 60 * 1000;
        }
        try {
            const arrive = new Date((f as any).arrive?.datetime || (f as any).arrive).getTime();
            const depart = new Date((f as any).depart?.datetime || (f as any).depart).getTime();
            if (!Number.isNaN(arrive) && !Number.isNaN(depart)) {
                return Math.abs(arrive - depart);
            }
        } catch (e) {
            // ignore
        }
        return 0;
    };

    // Single memoized pipeline to filter + sort a generic list
    const createProcessedList = (source: Flight[]) =>
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useMemo(() => {
            if (!Array.isArray(source)) return [];

            let data = source.slice(); // copy

            // 1) Non-stop filter
            if (isNonStopOnly) {
                data = data.filter(f =>
                    // your previous non-stop check used:
                    // flight.journey.every(segment => segment.length === 1)
                    // Keep same behavior, but guard for missing props
                    Array.isArray((f as any).journey)
                        ? (f as any).journey.every((seg: any[]) => seg.length === 1)
                        : true
                );
            }

            // 2) Sorting
            const value = filterValue?.type || '';
            const highest = filterValue?.highest;

            if (!value) return data;

            const cmp = (a: Flight, b: Flight) => {
                if (value === 'price') {
                    return (a.price || 0) - (b.price || 0);
                }
                if (value === 'arrival') {
                    const ta = new Date((a as any).arrive?.datetime || (a as any).arrive).getTime() || 0;
                    const tb = new Date((b as any).arrive?.datetime || (b as any).arrive).getTime() || 0;
                    return ta - tb;
                }
                if (value === 'departure') {
                    const ta = new Date((a as any).depart?.datetime || (a as any).depart).getTime() || 0;
                    const tb = new Date((b as any).depart?.datetime || (b as any).depart).getTime() || 0;
                    return ta - tb;
                }
                if (value === 'duration') {
                    const da = computeDurationMs(a);
                    const db = computeDurationMs(b);
                    return da - db;
                }
                return 0;
            };

            data.sort((a, b) => (highest ? cmp(a, b) : -cmp(a, b)));

            return data;
        }, [source, isNonStopOnly, filterValue]); // dependencies

    // Create processed outbound + inbound lists
    // NOTE: useMemo is inside createProcessedList; calling it will return memoized value.
    const processedOutbound = createProcessedList(flightData) as Flight[];
    const processedInbound = createProcessedList(inbountFlights) as Flight[];

    return (
        // Horizontal gutter here was pure liability: both Cols are span={24} (stacked, never
        // side-by-side), so AntD's negative-margin trick for the unused horizontal gutter just
        // bled 10px past the viewport on each side — a page-level horizontal scrollbar with
        // nothing actually cut off. [0, 20] keeps the vertical spacing, drops the horizontal one.
        <Row gutter={[0, 20]}>
            <Col span={24}>
                {selectedDate && !isMultiCity && !isLoading && (
                    // Row's own [0, 20] vertical gutter already pads the top of this Col by 10px;
                    // this negative margin trims that back so the calendar sits closer to the
                    // header card above it, without touching the gutter used by the Col below.
                    <div style={{ marginTop: -8 }}>
                        <DateCarousel
                            initialDate={selectedDate}
                            priceMap={priceMap}
                            isLoading={fareCalendarLoading}
                            onDateSelect={onDateSelect}
                            visibleCount={4}
                            compact
                        />
                    </div>
                )}
                <Flex className="">
                    {isLoading ? (
                        <Skeleton.Input block className="w-full" />
                    ) : (
                        <MobileHeader
                            filterValue={filterValue}
                            setFilterValue={setFilterValue}
                            searchParams={searchParams}
                        />
                    )}
                </Flex>

                <Row className="gap-2 border-b py-3 px-2" justify="space-between">
                    <Col
                        span={8}
                        className="border text-center p-2 rounded-lg cursor-pointer flex items-center justify-center text-xs font-medium "
                        onClick={() => setIsModalOpen(true)}
                    >
                        {isLoading ? (
                            <Skeleton.Button block />
                        ) : (
                            <>
                                <FilterOutlined className="mr-2" /> Filter <RightOutlined className="ms-2" />
                            </>
                        )}
                    </Col>

                    <Col
                        span={10}
                        className="border text-center p-2 rounded-lg cursor-pointer flex items-center justify-center gap-2 text-xs font-medium"
                    >
                        {isLoading ? (
                            <Skeleton.Button block />
                        ) : (
                            <>
                                {' '}
                                Non-Stop
                                <Switch
                                    size="small"
                                    checked={isNonStopOnly}
                                    onChange={e => {
                                        // update parent prop
                                        setIsNonStopOnly(e);
                                    }}
                                    className=""
                                />
                            </>
                        )}
                    </Col>
                </Row>

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
                {isLoading ? (
                    <Flex justify="center" className="mt-10">
                        <Spin
                            className="pointer-events-none"
                            indicator={<Lottie options={
                                        xs ? AirlineSearchAnimationmobile : AirlineSearchAnimation
                                    } height={150} width={300} />}
                            spinning
                        />
                    </Flex>
                ) : (
                    <>
                        {processedInbound && processedInbound.length > 0 ? (
                            <SearchRoundTripResultCardMobile
                                flights={processedOutbound}
                                inbountFlights={processedInbound}
                            />
                        ) : (
                            <SearchResultCardMobile flights={processedOutbound} />
                        )}
                    </>
                )}
            </Col>
        </Row>
    );
}
