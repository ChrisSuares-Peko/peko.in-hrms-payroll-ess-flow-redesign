import { useEffect, useState } from 'react';

import dayjs from 'dayjs';

import { useAppSelector } from '@src/hooks/store';

import { getBookings } from '../api';
import { BusBooking, RawBusBookingItem } from '../types/buslist';

function extractSeatNames(inventoryItems: any): string[] {
    if (!inventoryItems) return [];
    if (Array.isArray(inventoryItems)) return inventoryItems.map((item: any) => item.seatName).filter(Boolean);
    return inventoryItems.seatName ? [inventoryItems.seatName] : [];
}

function minutesToTime(val: string): string {
    const mins = parseInt(val, 10);
    if (Number.isNaN(mins)) return '';
    const h24 = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    const period = h24 < 12 ? 'AM' : 'PM';
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}

function calcDuration(pickupTime: string, dropTime: string): string {
    const pickup = parseInt(pickupTime, 10);
    const drop = parseInt(dropTime, 10);
    if (Number.isNaN(pickup) || Number.isNaN(drop)) return '';
    const diff = drop - pickup;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function mapRawBooking(raw: RawBusBookingItem): BusBooking {
    const details = raw.bookingDetails as any;
    const doj = details?.doj ? dayjs(details.doj) : null;
    const dropMins = parseInt(details?.dropTime ?? '0', 10);
    const isNextDay = dropMins >= 24 * 60;

    return {
        id: String(raw.id),
        pnrNumber: raw.tin,
        confirmationNumber: raw.corporateTxnId,
        bookingDate: dayjs(raw.transactionDate).format('MMMM D YYYY, [at] hh:mm A'),
        status: raw.status,
        orderStatus: raw.orderStatus,
        amount: raw.amount,
        operator: details?.travels ?? '',
        busType: details?.busType ?? '',
        departureTime: minutesToTime(details?.pickupTime ?? ''),
        departureDate: doj?.format('DD MMM YYYY') ?? '',
        departureLocation: details?.pickupLocation ?? '',
        arrivalTime: minutesToTime(details?.dropTime ?? ''),
        arrivalDate: doj ? (isNextDay ? doj.add(1, 'day') : doj).format('DD MMM YYYY') : '',
        arrivalLocation: details?.dropLocation ?? '',
        duration: calcDuration(details?.pickupTime ?? '', details?.dropTime ?? ''),
        stops: 'Non stop',
        routeFrom: details?.sourceCity ?? '',
        routeTo: details?.destinationCity ?? '',
        ticketId: raw.tin,
        seats: extractSeatNames(details?.inventoryItems),
        cancellationPolicy: details?.cancellationPolicy ?? '',
    };
}

export default function useManageBookingsApi(type?: string) {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const [bookings, setBookings] = useState<BusBooking[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [tick, setTick] = useState(0);

    const refetch = () => setTick(t => t + 1);

    useEffect(() => {
        const fetch = async () => {
            setIsLoading(true);
            const data = await getBookings({ userId: id, userType: role, type });
            if (data) setBookings(data.bookings.map(mapRawBooking));
            setIsLoading(false);
        };
        fetch();
    }, [id, role, type, tick]);

    return { bookings, isLoading, refetch };
}
