import { SuccessGenericResponse } from '@customtypes/api';
import { ApiClient } from '@src/services/config';

import { Challan, ChallanOrder, FleetChallansResponse } from '../types/index';

interface UserPayload {
    userId: number;
    userType: string;
}

// Fetch challans for a single vehicle registration number (Bill Payments flow).
export const getVehicleChallans = async ({
    userId,
    userType,
    vehicleNumber,
}: UserPayload & { vehicleNumber: string }): Promise<Challan[] | false> => {
    try {
        const res: SuccessGenericResponse<Challan[]> = await ApiClient.get(
            `${userType}/${userId}/payment/challan/fetch`,
            { params: { vehicle_number: vehicleNumber } }
        );
        // Success → always return an array (tolerate a bare array or a nested { data: [] }).
        const payload: any = res.data;
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.data)) return payload.data;
        return [];
    } catch (error) {
        return false;
    }
};

// Fetch all challans across the corporate's Turbo fleet (BE loops Droom Fetch Challan
// over each fleet vehicle's registration number, then aggregates).
// Returns `false` on error so callers can fall back to mock data while the BE is being built.
export const getFleetChallans = async ({
    userId,
    userType,
    refresh = false,
}: UserPayload & { refresh?: boolean }): Promise<FleetChallansResponse | false> => {
    try {
        const res: SuccessGenericResponse<FleetChallansResponse> = await ApiClient.get(
            `${userType}/${userId}/payment/challan/fleet`,
            { params: refresh ? { refresh: true } : {} }
        );
        return res.data;
    } catch (error) {
        return false;
    }
};

// Live Droom order detail for the Order History "View".
export const getChallanOrderDetail = async ({
    userId,
    userType,
    orderId,
}: UserPayload & { orderId: string }): Promise<ChallanOrder | false> => {
    try {
        const res: SuccessGenericResponse<ChallanOrder> = await ApiClient.get(
            `${userType}/${userId}/payment/challan/orders/${orderId}/detail`
        );
        return (res.data as ChallanOrder) ?? false;
    } catch (error) {
        return false;
    }
};

// Order history — past challan payment orders (BE maps the Droom order-list).
export const getChallanOrders = async ({
    userId,
    userType,
}: UserPayload): Promise<ChallanOrder[] | false> => {
    try {
        const res: SuccessGenericResponse<ChallanOrder[]> = await ApiClient.get(
            `${userType}/${userId}/payment/challan/orders`
        );
        const payload: any = res.data;
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.data)) return payload.data;
        if (Array.isArray(payload?.orders)) return payload.orders;
        return [];
    } catch (error) {
        return false;
    }
};
