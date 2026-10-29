import { useCallback, useState } from 'react';

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { searchBuses } from '../api';
import { setBusSearchResponse } from '../slices/busTicketSlice';
import { BusData } from '../types/buslist';

dayjs.extend(customParseFormat);

const DATE_FORMATS = ['D MMMM YYYY', 'DD MMMM YYYY', 'D MMM YYYY', 'DD MMM YYYY', 'YYYY-MM-DD'];

function parseDoj(date: string): string {
    const matched = DATE_FORMATS.map(fmt => dayjs(date, fmt, true)).find(d => d.isValid());
    return matched ? matched.format('YYYY-MM-DD') : date;
}

function minutesToTime(val: string | number): string {
    const mins = parseInt(String(val), 10);
    if (Number.isNaN(mins)) return '';
    const h24 = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    return `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function getMinFare(fares: string | string[]): number {
    if (Array.isArray(fares)) {
        const nums = fares.map(f => parseFloat(f)).filter(n => !Number.isNaN(n));
        return nums.length ? Math.min(...nums) : 0;
    }
    return parseFloat(String(fares)) || 0;
}

function mapTrip(trip: any, index: number, fromCity: string, toCity: string): BusData {
    const fare = getMinFare(trip.fares);
    // Extract YYYY-MM-DD before parsing to avoid UTC conversion shifting the date
    const dojStr = typeof trip.doj === 'string' && trip.doj.includes('T') ? trip.doj.split('T')[0] : trip.doj;
    const dojDate = dayjs(dojStr);
    const arrivalDate = trip.nextDay === 'true' ? dojDate.add(1, 'day') : dojDate;

    return {
        id: String(trip.id ?? index),
        operator: String(trip.travels ?? '').trim(),
        type: trip.busType ?? '',
        rating: parseFloat(String(trip.rating ?? '0')) || 0,
        ratings: parseInt(String(trip.total_rating_count ?? 0), 10),
        liveTracking: trip.liveTrackingAvailable === 'true',
        departCity: fromCity,
        departTime: minutesToTime(trip.departureTime),
        departDate: dojDate.isValid() ? dojDate.format('DD MMM YYYY') : '',
        arrivalCity: toCity,
        arrivalTime: minutesToTime(trip.arrivalTime),
        arrivalDate: arrivalDate.isValid() ? arrivalDate.format('DD MMM YYYY') : '',
        duration: trip.duration ?? '',
        seats: parseInt(String(trip.availableSeats ?? 0), 10),
        single: parseInt(String(trip.availableSingleSeat ?? 0), 10),
        price: fare,
        originalPrice: fare,
        isAC: trip.AC === 'true',
        isSleeper: trip.sleeper === 'true',
        isSeater: trip.seater === 'true',
        hasFreeCancellation: parseFloat(String(trip.zeroCancellationTime ?? '0')) > 0,
        bpDpSeatLayout: trip.bpDpSeatLayout === 'true',
        amenities: trip.amenities ? trip.amenities.split(',').map((a: string) => a.trim()).filter(Boolean) : [],
        cancellationPolicy: typeof trip.cancellationPolicy === 'string' ? trip.cancellationPolicy : undefined,
        imagesMetadataUrl: trip.imagesMetadataUrl,
        busImageCount: trip.busImageCount,
    };
}

export default function useSearchBusApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [buses, setBuses] = useState<BusData[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const search = useCallback(async (
        source: string,
        destination: string,
        date: string,
        fromCity: string,
        toCity: string,
    ) => {
        setIsLoading(true);
        const doj = parseDoj(date);
        const trips = await searchBuses({ userId: id, userType: role, source, destination, doj });
        dispatch(setBusSearchResponse({ agentMappedToCp: '', agentMappedToEarning: '', availableTrips: trips as any[] }));
        setBuses(trips.map((trip, index) => mapTrip(trip, index, fromCity, toCity)));
        setIsLoading(false);
    }, [id, role, dispatch]);

    return { isLoading, buses, search };
}
