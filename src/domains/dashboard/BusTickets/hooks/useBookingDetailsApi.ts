import { useEffect, useState } from 'react';

import dayjs from 'dayjs';

import { useAppSelector } from '@src/hooks/store';

import { getBookingDetails } from '../api';

function minutesToTime(val: string): string {
    const mins = parseInt(val, 10);
    if (Number.isNaN(mins)) return '';
    const totalMins = mins % (24 * 60);
    const h24 = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
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

export type BookingDetail = {
    tin: string;
    corporateTxnId: string;
    operator: string;
    busType: string;
    departureTime: string;
    departureDate: string;
    departureLocation: string;
    departureLandmark: string;
    arrivalTime: string;
    arrivalDate: string;
    arrivalLocation: string;
    arrivalLandmark: string;
    duration: string;
    routeFrom: string;
    routeTo: string;
    bookingDate: string;
    amount: string;
    passengers: { name: string; age: string; gender: string; seat: string }[];
    baseFare: string;
    fare: string;
    totalFare: string;
    serviceTax: string;
    serviceTaxPercentage: string;
    bookingFee: string;
    couponCode: string;
    couponDiscount: string;
    pgAmount: string;
    cancellationPolicy: string;
    contactEmail: string;
};

function mapDetails(raw: Record<string, any>, corporateTxnId: string): BookingDetail {
    const trip = raw.tripDetails ?? {};
    const doj = trip.doj ? dayjs(trip.doj) : null;
    const dropMins = parseInt(trip.dropTime ?? '0', 10);
    const isNextDay = dropMins >= 24 * 60;

    const passengers = (raw.passengers ?? []).map((item: any) => ({
        name: item.passenger?.name ?? '',
        age: item.passenger?.age ?? '',
        gender: item.passenger?.gender ? item.passenger.gender.charAt(0).toUpperCase() + item.passenger.gender.slice(1).toLowerCase() : '',
        seat: item.seatName ?? '',
    }));

    const fareItems = raw.fare?.inventoryItems ?? [];
    const firstFare = fareItems[0] ?? {};

    return {
        tin: raw.tin ?? raw.pnr ?? '',
        corporateTxnId,
        operator: raw.travels ?? '',
        busType: raw.busType ?? '',
        departureTime: minutesToTime(trip.pickUpTime ?? ''),
        departureDate: doj?.format('ddd, DD MMM') ?? '',
        departureLocation: trip.pickUpLocation ?? '',
        departureLandmark: trip.pickUpLandmark ?? trip.boardingLandmark ?? trip.landmark ?? '',
        arrivalTime: minutesToTime(trip.dropTime ?? ''),
        arrivalDate: doj ? (isNextDay ? doj.add(1, 'day') : doj).format('ddd, DD MMM') : '',
        arrivalLocation: trip.dropLocation ?? '',
        arrivalLandmark: trip.dropLandmark ?? trip.droppingLandmark ?? '',
        duration: calcDuration(trip.pickUpTime ?? '', trip.dropTime ?? ''),
        routeFrom: trip.sourceCity ?? '',
        routeTo: trip.destinationCity ?? '',
        bookingDate: raw.transactionDate ? dayjs(raw.transactionDate).format('ddd, DD MMM YYYY, HH:mm') : '',
        amount: raw.amountInINR ?? '',
        passengers,
        baseFare: firstFare.baseFare ?? '',
        fare: firstFare.grandTotalFare ?? firstFare.fare ?? '',
        totalFare: fareItems.reduce((sum: number, item: any) => {
            const f = parseFloat(item.grandTotalFare ?? item.fare ?? '0');
            return sum + (Number.isNaN(f) ? 0 : f);
        }, 0).toFixed(2),
        serviceTax: fareItems.reduce((sum: number, item: any) => {
            const t = parseFloat(item.serviceTax ?? '0');
            return sum + (Number.isNaN(t) ? 0 : t);
        }, 0).toFixed(2),
        serviceTaxPercentage: firstFare.serviceTaxPercentage ?? firstFare.gst ?? '',
        bookingFee: raw.surcharge ?? raw.fare?.bookingFee ?? '0',
        couponCode: raw.couponCode ?? raw.coupon_code ?? '',
        couponDiscount: String(raw.couponDiscount ?? raw.couponAmount ?? raw.coupon_amount ?? '0'),
        pgAmount: String(raw.pgAmount ?? ''),
        cancellationPolicy: raw.cancellationPolicy ?? raw.tripDetails?.cancellationPolicy ?? '',
        contactEmail: raw.contactEmail ?? raw.contact_email ?? '',
    };
}

export default function useBookingDetailsApi(corporateTxnId: string) {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const [detail, setDetail] = useState<BookingDetail | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!corporateTxnId) return;
        setIsLoading(true);
        getBookingDetails({ userId: id, userType: role, corporateTxnId })
            .then(data => { if (data) setDetail(mapDetails(data, corporateTxnId)); })
            .finally(() => setIsLoading(false));
    }, [corporateTxnId, id, role]);

    return { detail, isLoading };
}
