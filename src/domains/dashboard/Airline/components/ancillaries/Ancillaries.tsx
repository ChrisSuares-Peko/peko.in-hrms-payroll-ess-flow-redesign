import { useEffect, useMemo, useRef, useState } from 'react';

import { Flex, Typography, theme } from 'antd';
import { useNavigate } from 'react-router-dom';

import baggageIcon from '@src/domains/dashboard/Airline/assets/icons/baggage.svg';
import mealIcon from '@src/domains/dashboard/Airline/assets/icons/mealIcon.svg';
import seatIcon from '@src/domains/dashboard/Airline/assets/icons/seatIcon.svg';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import AddonOptionCard from './AddonOptionCard';
import PassengerAddonSummary, { AddonSummaryRow } from './PassengerAddonSummary';
import SeatMap from './SeatAddOn/SeatMap';
import useFetchSSR from '../../hooks/useFetchSSR';
import useFindFlightType from '../../hooks/useFindFlightType';
import { setPassengerAncillaries } from '../../slices/airlineSlice';
import { RowSeats } from '../../types/ancilaryType';
import { AllFareQuote } from '../../types/fareRules';
import { AncType, Baggage, MealDynamic, Passenger } from '../../types/slices';
import { isMealBaggageRequired } from '../../utils/ancillaries';

type Props = {
    isSSRLoading?: boolean;
    setShowSpinner: (value: boolean) => void;
    fareQuotes: AllFareQuote;
    handleBooking?: () => void;
};

type TabKey = 'seat' | 'meal' | 'baggage';

type Segment<T> = {
    key: string;
    origin: string;
    destination: string;
    options: T;
};

type SegmentAnc = { Origin: string; Destination: string; Code: string };

const INFANT_PAX_TYPE = 3;

const segmentKey = (anc: SegmentAnc) => `${anc.Origin}-${anc.Destination}`;

const ancPropertyByTab: Record<TabKey, AncType> = {
    seat: 'SeatDynamic',
    meal: 'MealDynamic',
    baggage: 'Baggage',
};

const tabLabels: Record<TabKey, string> = {
    seat: 'Seat',
    meal: 'Meal',
    baggage: 'Extra Baggage',
};

const placeholderByTab: Record<TabKey, string> = {
    seat: 'Select Seat',
    meal: 'Select Meal',
    baggage: 'Add Baggage',
};

const getMealLabel = (meal: MealDynamic) => meal.AirlineDescription || meal.Code;
const getBaggageLabel = (baggage: Baggage) => `Extra ${baggage.Weight} kg`;
const getSeatLabel = (seat: { RowNo: string; SeatNo: string; Code: string }) =>
    seat.RowNo && seat.SeatNo ? `${seat.RowNo}${seat.SeatNo}` : seat.Code;

const isRealAnc = (anc: SegmentAnc) => !['NoMeal', 'NoSeat', 'NoBaggage'].includes(anc.Code);

export default function Ancillaries({
    isSSRLoading,
    setShowSpinner,
    fareQuotes,
    handleBooking,
}: Props) {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { getFlightType } = useFindFlightType();
    const {
        token: { colorPrimary },
    } = theme.useToken();
    const borderSecondary = '#e2e8f0';

    const { passengers } = useAppSelector(state => state.reducer.airline.bookingData);
    const { selectedAirline, selectedInbountAirline } = useAppSelector(
        state => state.reducer.airline
    );
    const { meal, baggage, seat } = useFetchSSR({ setShowSpinner, handleBooking });
    const { RequiredFieldValidators } = fareQuotes.combined;

    const [activeTab, setActiveTab] = useState<TabKey>('seat');
    const [activeSegment, setActiveSegment] = useState(0);
    const [activePassengerId, setActivePassengerId] = useState<string>();

    const mealSegments = useMemo<Segment<MealDynamic[]>[]>(() => {
        const groups: Record<string, MealDynamic[]> = {};
        (meal || []).flat().forEach(item => {
            const key = segmentKey(item);
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
        });
        return Object.values(groups).map(items => ({
            key: segmentKey(items[0]),
            origin: items[0].Origin,
            destination: items[0].Destination,
            options: items.filter(isRealAnc),
        }));
    }, [meal]);

    const baggageSegments = useMemo<Segment<Baggage[]>[]>(
        () =>
            (baggage || [])
                .filter(items => items.length > 0)
                .map(items => ({
                    key: segmentKey(items[0]),
                    origin: items[0].Origin,
                    destination: items[0].Destination,
                    options: items.filter(isRealAnc),
                })),
        [baggage]
    );

    // First row of every segment is the "NoSeat" placeholder row
    const seatSegments = useMemo<Segment<RowSeats[]>[]>(
        () =>
            (seat || [])
                .flatMap(item => item.SegmentSeat)
                .filter(item => item.RowSeats.length > 1)
                .map(item => {
                    const first = item.RowSeats[0]?.Seats[0];
                    return {
                        key: first ? segmentKey(first) : '',
                        origin: first?.Origin || 'NA',
                        destination: first?.Destination || 'NA',
                        options: item.RowSeats.slice(1),
                    };
                }),
        [seat]
    );

    const segmentsByTab: Record<TabKey, Segment<unknown>[]> = {
        seat: seatSegments,
        meal: mealSegments,
        baggage: baggageSegments,
    };

    const tabs = (Object.keys(segmentsByTab) as TabKey[]).filter(
        tab => segmentsByTab[tab].length > 0
    );

    const isMealAndBaggageRequired = isMealBaggageRequired(selectedAirline, selectedInbountAirline);
    const requiredByTab: Record<TabKey, boolean> = {
        seat: !!RequiredFieldValidators?.IsSeatRequired,
        meal: !!RequiredFieldValidators?.IsMealRequired || isMealAndBaggageRequired,
        baggage: isMealAndBaggageRequired,
    };

    // Default to the first available tab once SSR data arrives
    useEffect(() => {
        if (tabs.length && !tabs.includes(activeTab)) setActiveTab(tabs[0]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tabs.join()]);

    const isInfant = (passenger: Passenger) => passenger.PaxType === INFANT_PAX_TYPE;
    const isEligible = (passenger: Passenger, tab: TabKey) =>
        tab === 'meal' || !isInfant(passenger);

    const eligiblePassengers = (passengers || []).filter(p => isEligible(p, activeTab));
    const activePassenger =
        eligiblePassengers.find(p => p.passengerId === activePassengerId) || eligiblePassengers[0];

    const currentSegments = segmentsByTab[activeTab];
    const currentSegment = currentSegments[Math.min(activeSegment, currentSegments.length - 1)];

    // SSR loaded but offered nothing (seen on some multi-city fares): skip the add-on step,
    // same as useFetchSSR does when the SSR call fails
    const isSSRFetched = meal !== undefined && baggage !== undefined && seat !== undefined;
    const hasNoAddons = isSSRFetched && !isSSRLoading && tabs.length === 0;
    const hasSkipped = useRef(false);
    useEffect(() => {
        if (!hasNoAddons || hasSkipped.current) return;
        hasSkipped.current = true;
        if (handleBooking) {
            handleBooking();
            return;
        }
        navigate(
            `${paths.dashboard.corporateTravel}/${paths.airline.index}/${paths.airline.results}/${paths.airline.details}/${paths.airline.summary}`
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasNoAddons]);

    if (isSSRLoading || !passengers?.length || !tabs.length) return null;

    const getSelected = (passenger: Passenger, tab: TabKey, key: string) =>
        (passenger[ancPropertyByTab[tab]] as SegmentAnc[]).find(
            anc => segmentKey(anc) === key && isRealAnc(anc)
        );

    const updateSegmentSelection = (tab: TabKey, key: string, anc?: SegmentAnc) => {
        if (!activePassenger) return;
        const property = ancPropertyByTab[tab];
        const others = (activePassenger[property] as SegmentAnc[]).filter(
            item => segmentKey(item) !== key
        );
        dispatch(
            setPassengerAncillaries({
                passengerId: activePassenger.passengerId,
                anc: (anc ? [...others, anc] : others) as Passenger[AncType],
                ancType: property,
            })
        );
    };

    const getSelectionText = (passenger: Passenger, tab: TabKey, key: string) => {
        const selected = getSelected(passenger, tab, key);
        if (!selected) return '';
        if (tab === 'seat') return getSeatLabel(selected as Passenger['SeatDynamic'][number]);
        if (tab === 'meal') return getMealLabel(selected as MealDynamic);
        return getBaggageLabel(selected as Baggage);
    };

    const getSummaryValue = (passenger: Passenger, tab: TabKey) =>
        segmentsByTab[tab]
            .map(segment => {
                const text = getSelectionText(passenger, tab, segment.key);
                if (!text) return '';
                return segmentsByTab[tab].length > 1
                    ? `${segment.origin}-${segment.destination}: ${text}`
                    : text;
            })
            .filter(Boolean)
            .join(', ');

    const summaryRows = (passenger: Passenger): AddonSummaryRow[] => {
        const icons: Record<TabKey, string> = {
            seat: seatIcon,
            meal: mealIcon,
            baggage: baggageIcon,
        };
        const rowLabels: Record<TabKey, string> = {
            seat: 'Seat',
            meal: 'Meal',
            baggage: 'Baggage',
        };
        return tabs
            .filter(tab => isEligible(passenger, tab))
            .map(tab => ({
                key: tab,
                icon: icons[tab],
                label: rowLabels[tab],
                value: getSummaryValue(passenger, tab),
            }));
    };

    const renderOptions = () => {
        if (!currentSegment || !activePassenger) return null;

        if (activeTab === 'seat') {
            const takenSeats = passengers
                .filter(p => p.passengerId !== activePassenger.passengerId)
                .flatMap(p => p.SeatDynamic || []);
            return (
                <SeatMap
                    key={`${activePassenger.passengerId}-${currentSegment.key}`}
                    index={activeSegment}
                    deck={currentSegment.options as RowSeats[]}
                    passenger={activePassenger}
                    takenSeats={takenSeats}
                    setSelectedSeat={updater =>
                        dispatch(
                            setPassengerAncillaries({
                                passengerId: activePassenger.passengerId,
                                anc: updater(activePassenger.SeatDynamic),
                                ancType: 'SeatDynamic',
                            })
                        )
                    }
                />
            );
        }

        const options = currentSegment.options as (MealDynamic | Baggage)[];
        if (!options.length) {
            return (
                <Typography.Paragraph className="w-full py-6 m-0 text-center text-sm text-slate-500">
                    {`No ${activeTab === 'meal' ? 'meal' : 'baggage'} options are currently available`}
                </Typography.Paragraph>
            );
        }

        const selected = getSelected(activePassenger, activeTab, currentSegment.key) as
            | MealDynamic
            | Baggage
            | undefined;
        const half = Math.ceil(options.length / 2);
        const columns = [options.slice(0, half), options.slice(half)].filter(col => col.length);

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[26px] md:gap-0 w-full py-3">
                {columns.map((column, colIndex) => (
                    <Flex
                        key={colIndex}
                        vertical
                        gap={26}
                        className={
                            colIndex === 0
                                ? 'md:pr-[18px]'
                                : 'md:pl-[18px] md:border-0 md:border-l md:border-solid md:border-slate-200'
                        }
                    >
                        {column.map(option => (
                            <AddonOptionCard
                                key={option.Code}
                                icon={activeTab === 'meal' ? mealIcon : baggageIcon}
                                title={
                                    activeTab === 'meal'
                                        ? getMealLabel(option as MealDynamic)
                                        : getBaggageLabel(option as Baggage)
                                }
                                price={option.Price}
                                isSelected={selected?.Code === option.Code}
                                onAdd={() =>
                                    updateSegmentSelection(activeTab, currentSegment.key, option)
                                }
                                onRemove={() =>
                                    updateSegmentSelection(activeTab, currentSegment.key)
                                }
                            />
                        ))}
                    </Flex>
                ))}
            </div>
        );
    };

    return (
        <Flex vertical gap={45} className="w-full">
            <Flex
                vertical
                gap={12}
                className="w-full px-4 sm:px-6 py-[22px] bg-white rounded-[20px] shadow-[0px_1.5px_16.5px_0px_rgba(0,0,0,0.06)]"
            >
                <Flex
                    gap={24}
                    className="w-full overflow-x-auto border-0 border-b border-solid border-slate-200"
                >
                    {tabs.map(tab => {
                        const isActive = tab === activeTab;
                        return (
                            <button
                                key={tab}
                                type="button"
                                className="flex flex-col items-center gap-3 shrink-0 p-0 bg-transparent border-none cursor-pointer"
                                onClick={() => {
                                    setActiveTab(tab);
                                    setActiveSegment(0);
                                }}
                            >
                                <span
                                    className={`text-base whitespace-nowrap ${
                                        isActive
                                            ? 'font-semibold'
                                            : 'font-normal text-slate-500 pb-[15px]'
                                    }`}
                                    style={isActive ? { color: colorPrimary } : undefined}
                                >
                                    {tabLabels[tab]}
                                    {requiredByTab[tab] && (
                                        <span style={{ color: colorPrimary }} title="Required">
                                            {' *'}
                                        </span>
                                    )}
                                </span>
                                {isActive && (
                                    <span
                                        className="block h-[3px] w-full rounded-t-[3px]"
                                        style={{ backgroundColor: colorPrimary }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </Flex>

                {currentSegments.length > 1 && (
                    <Flex gap={8} wrap="wrap" className="pt-1">
                        {currentSegments.map((segment, i) => {
                            const isActive = segment.key === currentSegment?.key;
                            const flightType = getFlightType(segment.origin, segment.destination);
                            return (
                                <button
                                    key={segment.key}
                                    type="button"
                                    className={`px-3 py-1.5 rounded-full text-xs cursor-pointer bg-white border border-solid ${
                                        isActive ? 'font-medium' : 'text-slate-500'
                                    }`}
                                    style={{
                                        borderColor: isActive ? colorPrimary : borderSecondary,
                                        color: isActive ? colorPrimary : undefined,
                                    }}
                                    onClick={() => setActiveSegment(i)}
                                >
                                    {flightType && `${flightType} · `}
                                    {`${segment.origin} → ${segment.destination}`}
                                </button>
                            );
                        })}
                    </Flex>
                )}

                {renderOptions()}

                <Flex gap={12} className="w-full pt-[15px] overflow-x-auto">
                    {passengers.map(passenger => {
                        const eligible = isEligible(passenger, activeTab);
                        const isActive =
                            eligible && passenger.passengerId === activePassenger?.passengerId;
                        const selection = currentSegment
                            ? getSelectionText(passenger, activeTab, currentSegment.key)
                            : '';
                        return (
                            <button
                                key={passenger.passengerId}
                                type="button"
                                disabled={!eligible}
                                className={`flex flex-col items-start gap-2 w-[120px] shrink-0 px-4 py-3 rounded-xl bg-white text-left border-solid ${
                                    eligible ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                                }`}
                                style={{
                                    borderWidth: isActive ? 1.5 : 1,
                                    borderColor: isActive ? colorPrimary : borderSecondary,
                                }}
                                onClick={() => setActivePassengerId(passenger.passengerId)}
                            >
                                <span className="w-full text-base font-semibold text-slate-800 truncate">
                                    {`${passenger.FirstName} ${passenger.LastName?.[0] || ''}`}
                                </span>
                                <span
                                    className={`w-full text-sm truncate ${
                                        isActive && selection ? 'text-slate-800' : 'text-slate-500'
                                    }`}
                                >
                                    {eligible
                                        ? selection || placeholderByTab[activeTab]
                                        : 'Not available'}
                                </span>
                            </button>
                        );
                    })}
                </Flex>
            </Flex>

            <Flex vertical gap={18} className="w-full">
                <Typography.Text className="text-lg font-semibold text-slate-900">
                    Passenger Details &amp; Selected Add-ons
                </Typography.Text>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px] w-full">
                    {passengers.map(passenger => (
                        <PassengerAddonSummary
                            key={passenger.passengerId}
                            passenger={passenger}
                            rows={summaryRows(passenger)}
                        />
                    ))}
                </div>
            </Flex>
        </Flex>
    );
}
