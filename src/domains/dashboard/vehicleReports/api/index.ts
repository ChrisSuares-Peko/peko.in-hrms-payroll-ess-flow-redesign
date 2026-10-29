import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { ReportOrderDetail } from '../types/index';

interface CatalogPayload {
    userId: number;
    userType: string;
    category: string;
    make?: string;
    model?: string;
    year?: string;
}

// One cascade level of the Valuation/Inspection forms' Vehicle Information block —
// which level comes back depends on which of make/model/year are given, per the
// backend's Droom MYBIZ catalog proxy (see DROOM_MYBIZ_API_REFERENCE.md at the
// workspace root, and officeAndBusiness/services/droomCatalog.js).
export const getVehicleCatalog = async (payload: CatalogPayload) => {
    try {
        const resp: SuccessGenericResponse<string[]> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/garage/car-report/catalog`,
            {
                params: {
                    category: payload.category,
                    make: payload.make,
                    model: payload.model,
                    year: payload.year,
                },
            }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export interface CarReportPlanInfo {
    reportType: string;
    packageId: string | null;
    displayName: string;
    price: number;
    // false = an inspection package Droom cannot book yet (no product code configured).
    bookable: boolean;
}

// Live prices + package availability from the admin-managed carReportPlans table.
export const getCarReportPlans = async ({ userId, userType }: { userId: number; userType: string }) => {
    try {
        const resp: SuccessGenericResponse<{ plans: CarReportPlanInfo[] }> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/garage/car-report/plans`
        );
        return resp.data?.plans ?? false;
    } catch (err) {
        return false;
    }
};

// ------------------------------------------------------------------------- orders
// Same officeAndBusiness/garage prefix as the lookups above — that service owns the whole
// Car Reports feature, purchase and order record included (see
// Peko-IN/officeAndBusiness/routes/API/v1/corporate/garage.js).

interface OrdersPayload {
    userId: number;
    userType: string;
    searchText?: string;
    from?: string;
    to?: string;
    page?: number;
    itemsPerPage?: number;
}

// Filtering, sorting and paging are all server-side — `count` is the unpaged total.
export const getCarReportOrders = async ({ userId, userType, ...params }: OrdersPayload) => {
    try {
        const resp: SuccessGenericResponse<{ orders: ReportOrderDetail[]; count: number }> =
            await ApiClient.get(
                `${userType}/${userId}/officeAndBusiness/garage/car-report/orders`,
                { params }
            );
        return { orders: resp.data?.orders ?? [], count: resp.data?.count ?? 0 };
    } catch (err) {
        return false;
    }
};

export const getCarReportOrderDetail = async ({
    userId,
    userType,
    orderId,
}: {
    userId: number;
    userType: string;
    orderId: string;
}) => {
    try {
        const resp: SuccessGenericResponse<ReportOrderDetail> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/garage/car-report/orders/${orderId}/detail`
        );
        return resp.data ?? false;
    } catch (err) {
        return false;
    }
};
