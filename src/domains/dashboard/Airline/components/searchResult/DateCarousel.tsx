import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Flex, Skeleton, Typography } from 'antd';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import { FareCalendarPriceMap } from '../../hooks/useFareCalendar';

dayjs.extend(customParseFormat);

interface DateCarouselProps {
    initialDate: string; // DD-MM-YYYY
    priceMap?: FareCalendarPriceMap;
    isLoading?: boolean;
    onDateSelect?: (date: string) => void; // DD-MM-YYYY
    visibleCount?: number; // how many date cells to show at once — narrower on mobile
    compact?: boolean; // smaller text/padding for narrow (mobile) screens
}

const DEFAULT_VISIBLE_COUNT = 9;

// depart1 is meant to be "DD-MM-YYYY", but several search entry points across this domain
// (e.g. SearchFlightMobile's default value) write it as "DD MM YYYY" instead. The old
// dash-only split silently produced an invalid dayjs here, which made monthKey never match
// any priceMap key — the carousel would just render null with no visible error.
function parseDMY(date: string): dayjs.Dayjs {
    let parsed = dayjs(date, 'DD-MM-YYYY', true);
    if (!parsed.isValid()) parsed = dayjs(date, 'DD MM YYYY', true);
    if (!parsed.isValid()) parsed = dayjs(date);
    return parsed;
}

const today = dayjs().startOf('day');

const DateCarousel = ({
    initialDate,
    priceMap = {},
    isLoading = false,
    onDateSelect,
    visibleCount = DEFAULT_VISIBLE_COUNT,
    compact = false,
}: DateCarouselProps) => {
    const VISIBLE_COUNT = visibleCount;
    const arrowIconSize = compact ? 14 : 18;
    const arrowPadding = compact ? '0 4px' : '0 8px';
    const cellPadding = compact ? '8px 2px' : '10px 6px';
    const dateFontSize = compact ? 11 : 12;
    const priceFontSize = compact ? 10 : 12;
    const baseDayjs = parseDMY(initialDate);
    const monthKey = baseDayjs.format('YYYY-MM');

    // Only dates from the API response for this month, excluding past dates
    const availableDates = useMemo(
        () =>
            Object.keys(priceMap)
                .filter(key => key.startsWith(monthKey))
                .sort()
                .map(key => dayjs(key))
                .filter(d => !d.isBefore(today)),
        [priceMap, monthKey]
    );

    const totalDates = availableDates.length;

    const getWindowStart = useCallback(
        (target: dayjs.Dayjs, dates: dayjs.Dayjs[]) => {
            const targetStr = target.format('YYYY-MM-DD');
            const idx = dates.findIndex(d => d.format('YYYY-MM-DD') === targetStr);
            const center = Math.floor(VISIBLE_COUNT / 2);
            const anchor = idx >= 0 ? idx : 0;
            return Math.max(0, Math.min(anchor - center, Math.max(0, dates.length - VISIBLE_COUNT)));
        },
        [VISIBLE_COUNT]
    );

    const [activeDate, setActiveDate] = useState(initialDate);
    const [windowStart, setWindowStart] = useState(0);

    // Re-centre whenever initialDate or available dates change
    useEffect(() => {
        const parsed = parseDMY(initialDate);
        setActiveDate(initialDate);
        setWindowStart(getWindowStart(parsed, availableDates));
    }, [initialDate, availableDates, getWindowStart]);

    const visibleDates = availableDates.slice(windowStart, windowStart + VISIBLE_COUNT);
    const canGoPrev = windowStart > 0;
    const canGoNext = windowStart + VISIBLE_COUNT < totalDates;

    const handleClick = (dateStr: string) => {
        setActiveDate(dateStr);
        if (onDateSelect) onDateSelect(dateStr);
    };

    if (isLoading) {
        return (
            <Flex
                align="center"
                className="w-full bg-white"
                style={{ minHeight: 64, borderBottom: '1px solid #e5e7eb', padding: '0 8px', overflow: 'hidden' }}
            >
                {Array.from({ length: VISIBLE_COUNT }).map((_, i) => (
                    <Flex
                        key={i}
                        vertical
                        align="center"
                        justify="center"
                        className="flex-1"
                        style={{
                            minWidth: 0,
                            padding: cellPadding,
                            borderRight: i < VISIBLE_COUNT - 1 ? '1px solid #e5e7eb' : 'none',
                        }}
                    >
                        <Skeleton.Input active size="small" style={{ width: 48, height: 12, marginBottom: 6 }} />
                        <Skeleton.Input active size="small" style={{ width: 56, height: 12 }} />
                    </Flex>
                ))}
            </Flex>
        );
    }

    if (totalDates === 0) return null;

    return (
        <Flex
            align="stretch"
            className="w-full bg-white"
            style={{ minHeight: 64, borderBottom: '1px solid #e5e7eb', overflow: 'hidden' }}
        >
            <button
                type="button"
                onClick={() => setWindowStart(w => Math.max(0, w - 1))}
                disabled={!canGoPrev}
                className="flex items-center justify-center bg-transparent border-none cursor-pointer text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                style={{ padding: arrowPadding }}
            >
                <LeftOutlined style={{ fontSize: arrowIconSize }} />
            </button>

            {/* minWidth: 0 lets these flex-1 cells actually shrink below their text's natural
                width — without it, "nowrap" price text forces the row wider than the viewport,
                pushing the next-arrow off-screen and causing a page-level horizontal scrollbar. */}
            <Flex align="stretch" className="flex-1" style={{ minWidth: 0 }}>
                {visibleDates.map((date, idx) => {
                    const dateStr = date.format('DD-MM-YYYY');
                    const ymdKey = date.format('YYYY-MM-DD');
                    const isSelected = dateStr === activeDate;
                    const isLast = idx === visibleDates.length - 1;
                    const entry = priceMap[ymdKey];

                    return (
                        <React.Fragment key={dateStr}>
                        <button
                            type="button"
                            onClick={() => !isSelected && handleClick(dateStr)}
                            className="flex-1 flex flex-col items-center justify-center bg-transparent border-none cursor-pointer"
                            style={{
                                minWidth: 0,
                                borderBottom: isSelected ? '3px solid #EA3639' : '3px solid transparent',
                                padding: cellPadding,
                            }}
                        >
                            <Typography.Text
                                ellipsis
                                style={{
                                    maxWidth: '100%',
                                    fontSize: dateFontSize,
                                    fontWeight: isSelected ? 700 : 400,
                                    color: isSelected ? '#1a1a1a' : '#6B7280',
                                    lineHeight: 1.4,
                                }}
                            >
                                {date.format('DD MMM')}
                            </Typography.Text>
                            {entry && (
                                <Typography.Text
                                    ellipsis
                                    className="mt-1"
                                    style={{
                                        maxWidth: '100%',
                                        fontSize: priceFontSize,
                                        fontWeight: isSelected ? 600 : 500,
                                        color: isSelected ? '#1a1a1a' : '#6B7280',
                                        lineHeight: 1.4,
                                    }}
                                >
                                    {`₹ ${formatNumberWithLocalString(entry.price)}`}
                                </Typography.Text>
                            )}
                        </button>
                        {!isLast && (
                            <div style={{ width: 1, background: '#e5e7eb', margin: '8px 0', flexShrink: 0 }} />
                        )}
                        </React.Fragment>
                    );
                })}
            </Flex>

            <button
                type="button"
                onClick={() => setWindowStart(w => Math.min(totalDates - VISIBLE_COUNT, w + 1))}
                disabled={!canGoNext}
                className="flex items-center justify-center bg-transparent border-none cursor-pointer text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                style={{ padding: arrowPadding }}
            >
                <RightOutlined style={{ fontSize: arrowIconSize }} />
            </button>
        </Flex>
    );
};

export default DateCarousel;
