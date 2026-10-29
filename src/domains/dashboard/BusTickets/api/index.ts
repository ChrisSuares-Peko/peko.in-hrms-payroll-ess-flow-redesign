import { UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { BlockTicketPayload, BlockTicketResponse, BookTicketResponse, BpDpDetails, BusBookingsResponse, BusCity, BusSearchQuery, BusSearchResponse, CancelBookingResponse, RawAvailableTrip, TripDetails } from '../types/buslist';

export const getBusCities = async ({ userId, userType }: UserPayload): Promise<BusCity[] | null> => {
    const resp = await ApiClient.get<{ cities: BusCity[] }>(
        `${userType}/${userId}/travel/bus/cities`
    ).catch(() => null);
    return resp?.data?.cities ?? null;
};

export const searchBuses = async ({ userId, userType, source, destination, doj }: UserPayload & BusSearchQuery): Promise<RawAvailableTrip[]> => {
    const resp = await ApiClient.get<BusSearchResponse>(
        `${userType}/${userId}/travel/bus/search`,
        { params: { source, destination, doj } }
    ).catch(() => null);
    const trips = resp?.data?.availableTrips;
    if (!trips) return [];
    return Array.isArray(trips) ? trips : [trips];
};

export const getBpDpDetails = async ({ userId, userType, id }: UserPayload & { id: string }): Promise<BpDpDetails | null> => {
    const resp = await ApiClient.get<BpDpDetails>(
        `${userType}/${userId}/travel/bus/bpdp-details`,
        { params: { id } }
    ).catch(() => null);
    return resp?.data ?? null;
};

export const getTripDetails = async ({
    userId, userType, id, bpId, dpId,
}: UserPayload & { id: string; bpId?: string; dpId?: string }): Promise<TripDetails | null> => {
    const resp = await ApiClient.get<TripDetails>(
        `${userType}/${userId}/travel/bus/trip-details`,
        { params: { id, ...(bpId && { bpId }), ...(dpId && { dpId }) } }
    ).catch(() => null);
    return resp?.data ?? null;
};

export const blockTicket = async ({ userId, userType, payload }: UserPayload & { payload: BlockTicketPayload }): Promise<BlockTicketResponse | null> => {
    try {
        const resp = await ApiClient.post<BlockTicketResponse>(
            `${userType}/${userId}/travel/bus/block`,
            payload
        );
        return resp?.data ?? null;
    } catch (err: any) {
        const msg = err?.response?.data?.message || err?.response?.data?.error || 'Failed to block ticket. Please try again.';
        const responseCode = err?.response?.data?.responseCode;
        const error = new Error(msg) as Error & { responseCode?: string };
        error.responseCode = responseCode;
        throw error;
    }
};

export const bookTicket = async ({
    userId,
    userType,
    blockKey,
    contactPhone,
    contactEmail,
    couponCode,
    couponAmount,
    pgAmount,
}: UserPayload & {
    blockKey: string;
    contactPhone: string;
    contactEmail: string;
    couponCode?: string;
    couponAmount?: number | string;
    pgAmount?: number | string;
}): Promise<BookTicketResponse | null> => {
    const resp = await ApiClient.post<BookTicketResponse>(
        `${userType}/${userId}/travel/bus/book`,
        { blockKey, contactPhone, contactEmail, couponCode, couponAmount, pgAmount }
    ).catch(() => null);
    return resp?.data ?? null;
};

export const cancelBooking = async ({ userId, userType, tin, seatsToCancel, corporateTxnId, email }: UserPayload & { tin: string; seatsToCancel: string[]; corporateTxnId: string; email?: string }): Promise<CancelBookingResponse | null> => {
    const resp = await ApiClient.post<CancelBookingResponse>(
        `${userType}/${userId}/travel/bus/cancel`,
        { tin, seatsToCancel, corporateTxnId, ...(email && { email }) }
    ).catch(() => null);
    return (resp as unknown as CancelBookingResponse) ?? null;
};

export const getBookingDetails = async ({ userId, userType, corporateTxnId }: UserPayload & { corporateTxnId: string }): Promise<Record<string, any> | null> => {
    const resp = await ApiClient.get<Record<string, any>>(
        `${userType}/${userId}/travel/bus/booking-details`,
        { params: { corporateTxnId } }
    ).catch(() => null);
    return resp?.data ?? null;
};

export const downloadTicket = async ({ userId, userType, corporateTxnId }: UserPayload & { corporateTxnId: string }): Promise<{ pdfBase64: string; pdfName: string } | null> => {
    const resp = await ApiClient.get<{ pdfBase64: string; pdfName: string }>(
        `${userType}/${userId}/travel/bus/download-ticket`,
        { params: { corporateTxnId } }
    ).catch(() => null);
    return resp?.data ?? null;
};

export const getBookings = async ({ userId, userType, page = 1, limit = 10, type }: UserPayload & { page?: number; limit?: number; type?: string }): Promise<BusBookingsResponse | null> => {
    const resp = await ApiClient.get<BusBookingsResponse>(
        `${userType}/${userId}/travel/bus/bookings`,
        { params: { page, limit, ...(type && { type }) } }
    ).catch(() => null);
    return resp?.data ?? null;
};
