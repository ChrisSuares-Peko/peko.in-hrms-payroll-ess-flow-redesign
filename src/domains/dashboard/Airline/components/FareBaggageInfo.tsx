import { Flex, Typography } from 'antd';

import { useAppSelector } from '@src/hooks/store';

import { Journey } from '../types/airlineList';
import { AllFareQuote, FareQuotes } from '../types/fareRules';

type Props = {
    fareQuotes: AllFareQuote;
};

type BaggageRow = {
    key: string;
    label: string;
    cabin: string;
    checkIn: string;
};

const PAX_LABELS: Record<number, string> = { 1: 'Adult', 2: 'Child', 3: 'Infant' };

const segmentLabel = (segment: Journey | undefined, fallbackIndex: string) =>
    segment
        ? `${segment.Origin.Airport.AirportCode} → ${segment.Destination.Airport.AirportCode} · ${segment.Airline.AirlineCode} ${segment.Airline.FlightNumber}`
        : `Flight ${fallbackIndex}`;

// SegmentDetails come in the same order as the itinerary's segments, so pair them by position
const buildRows = (
    quote: FareQuotes | null | undefined,
    journey: Journey[][] | undefined,
    paxType: number
): BaggageRow[] => {
    const breakdown = quote?.FareBreakdown?.find(fb => fb.PassengerType === paxType);
    const segments = (journey || []).flat();
    return (breakdown?.SegmentDetails || []).map((detail, i) => ({
        key: `${paxType}-${detail.FlightInfoIndex}-${i}`,
        label: segmentLabel(segments[i], detail.FlightInfoIndex),
        cabin: detail.CabinBaggage?.FreeText || '-',
        checkIn: detail.CheckedInBaggage?.FreeText || '-',
    }));
};

const FareBaggageInfo = ({ fareQuotes }: Props) => {
    const { selectedAirline, selectedInbountAirline } = useAppSelector(
        state => state.reducer.airline
    );

    const primaryQuote = fareQuotes.outbount || fareQuotes.combined;
    const paxTypes = (primaryQuote?.FareBreakdown || []).map(fb => fb.PassengerType);

    const groups = paxTypes
        .map(paxType => ({
            paxType,
            rows: [
                ...buildRows(primaryQuote, selectedAirline?.journey, paxType),
                ...buildRows(fareQuotes.inbount, selectedInbountAirline?.journey, paxType),
            ],
        }))
        .filter(group => group.rows.length > 0);

    if (!groups.length) return null;

    return (
        <Flex vertical gap={12}>
            <Typography.Text className="text-base font-semibold text-slate-900">
                Baggage allowance
            </Typography.Text>
            {groups.map(group => (
                <Flex
                    key={group.paxType}
                    vertical
                    className="overflow-hidden rounded-xl border border-solid border-slate-200"
                >
                    <Flex className="px-4 py-2.5 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                        <span className="flex-1">
                            {`${PAX_LABELS[group.paxType] || 'Passenger'} · per person`}
                        </span>
                        <span className="w-24 text-right">Cabin</span>
                        <span className="w-24 text-right">Check-in</span>
                    </Flex>
                    {group.rows.map(row => (
                        <Flex
                            key={row.key}
                            align="center"
                            className="px-4 py-3 text-sm border-0 border-t border-solid border-slate-200"
                        >
                            <span className="flex-1 min-w-0 text-slate-700">{row.label}</span>
                            <span className="w-24 text-right font-semibold text-slate-900">
                                {row.cabin}
                            </span>
                            <span className="w-24 text-right font-semibold text-slate-900">
                                {row.checkIn}
                            </span>
                        </Flex>
                    ))}
                </Flex>
            ))}
        </Flex>
    );
};

export default FareBaggageInfo;
