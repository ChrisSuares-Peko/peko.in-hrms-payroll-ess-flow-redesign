import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    FleetListingPayload,
    FleetListingResponse,
    VehicleUpdatePayload,
    VehicleDeletePayload,
    VehicleCreatePayload,
    VehicleCreateResponse,
    VehicleDocCreatePayload,
    VehicleDocCreateResponse,
    VehicleDocDeletePayload,
    VehicleDocListingResponse,
    VehicleDocUpdatePayload,
    VehicleUsageCreateResponse,
    VehicleUsageDeletePayload,
    VehicleUsageListingPayload,
    VehicleUsageListingResponse,
    VehicleUsageUpdatePayload,
    VehicleDocListingPayload,
    VehicleMaintenanceCreateResponse,
    VehicleMaintenanceDeletePayload,
    VehicleMaintenanceListingPayload,
    VehicleMaintenanceListingResponse,
    VehicleMaintenanceUpdatePayload,
    VehicleMaintenanceCreatePayload,
    VehicleUsageCreatePayload,
    SingleVehicleDetailsPayload,
    SingleVehicleDetailsResponse,
    LatestVehicleDetailsResponse,
    FleetInfoResponse,
} from '../types/fleetManagement/index';

export const listVehicle = async (payload: FleetListingPayload) => {
    try {
        const res: SuccessGenericResponse<FleetListingResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/fleets`,
            {
                params: {
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    searchText: payload.searchText,
                },
            }
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
export const listVehicleInfo = async (payload: FleetListingPayload) => {
    try {
        const res: SuccessGenericResponse<FleetInfoResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/fleets/info`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
export const getSingleVehicle = async (payload: SingleVehicleDetailsPayload) => {
    try {
        const res: SuccessGenericResponse<SingleVehicleDetailsResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/fleets/${payload.fleetId}`
        );
        const { data } = res;
        return data;
    } catch (err) {
        return false;
    }
};
export const createVehicle = async (payload: VehicleCreatePayload) => {
    try {
        const res: SuccessGenericResponse<VehicleCreateResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/fleets`,
            payload
        );

        return res;
    } catch (error) {
        return false;
    }
};

export const updateVehicle = async (payload: VehicleUpdatePayload) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/fleets/${payload.fleetId}`,
            payload
        );

        return resp;
    } catch (err) {
        return false;
    }
};

export const deleteVehicle = async (payload: VehicleDeletePayload) => {
    try {
        const res: SuccessGenericResponse<any> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/fleets/${payload.fleetId}`
        );

        return res;
    } catch (error) {
        return false;
    }
};

export const listVehicleDoc = async (payload: VehicleDocListingPayload) => {
    try {
        const res: SuccessGenericResponse<VehicleDocListingResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/fleet-details/docs`,
            {
                params: {
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    searchText: payload.searchText,
                    fleetId: payload.fleetId,
                },
            }
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
export const createVehicleDoc = async (payload: VehicleDocCreatePayload) => {
    try {
        const res: SuccessGenericResponse<VehicleDocCreateResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/fleet-details/docs`,
            payload
        );

        return res;
    } catch (error) {
        return false;
    }
};

export const updateVehicleDoc = async (payload: VehicleDocUpdatePayload) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/fleet-details/docs/${payload.docId}`,
            payload
        );

        return resp;
    } catch (err) {
        return false;
    }
};

export const deleteVehicleDoc = async (payload: VehicleDocDeletePayload) => {
    try {
        const res: SuccessGenericResponse<any> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/fleet-details/docs/${payload.docId}`
        );

        return res;
    } catch (error) {
        return false;
    }
};
export const listVehicleUsageHistory = async (payload: VehicleUsageListingPayload) => {
    try {
        const res: SuccessGenericResponse<VehicleUsageListingResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/fleet-details/usage-history`,
            {
                params: {
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    searchText: payload.searchText,
                    fleetId: payload.fleetId,
                },
            }
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
export const createVehicleUsageHistory = async ({
    userId,
    userType,
    ...payload
}: VehicleUsageCreatePayload) => {
    try {
        const res: SuccessGenericResponse<VehicleUsageCreateResponse> = await ApiClient.patch(
            `${userType}/${userType}/officeAndBusiness/peko-cloud/fleets/assign`,
            payload
        );

        return res;
    } catch (error) {
        return false;
    }
};

export const updateVehicleUsageHistory = async (payload: VehicleUsageUpdatePayload) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/fleet-details/usage-history/${payload.usageId}`,
            payload
        );

        return resp;
    } catch (err) {
        return false;
    }
};

export const deleteVehicleUsageHistory = async (payload: VehicleUsageDeletePayload) => {
    try {
        const res: SuccessGenericResponse<any> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/fleet-details/usage-history/${payload.usageId}`
        );

        return res;
    } catch (error) {
        return false;
    }
};
export const listVehicleMaintenanceHistory = async (payload: VehicleMaintenanceListingPayload) => {
    try {
        const res: SuccessGenericResponse<VehicleMaintenanceListingResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/fleet-details/maintenances`,
            {
                params: {
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    searchText: payload.searchText,
                    fleetId: payload.fleetId,
                },
            }
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
export const createVehicleMaintenanceHistory = async (payload: VehicleMaintenanceCreatePayload) => {
    try {
        const res: SuccessGenericResponse<VehicleMaintenanceCreateResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/fleet-details/maintenances`,
            payload
        );

        return res;
    } catch (error) {
        return false;
    }
};

export const updateVehicleMaintenanceHistory = async (payload: VehicleMaintenanceUpdatePayload) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/fleet-details/maintenances/${payload.maintenanceId}`,
            payload
        );

        return resp;
    } catch (err) {
        return false;
    }
};

export const deleteVehicleMaintenanceHistory = async (payload: VehicleMaintenanceDeletePayload) => {
    try {
        const res: SuccessGenericResponse<any> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/fleet-details/maintenances/${payload.maintenanceId}`
        );

        return res;
    } catch (error) {
        return false;
    }
};
export const getLatestVehicleUsage = async (payload: SingleVehicleDetailsPayload) => {
    try {
        const res: SuccessGenericResponse<LatestVehicleDetailsResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/fleet-details/usage-history/latest`,
            {
                params: {
                    fleetId: payload.fleetId,
                },
            }
        );
        const { data } = res;
        return data;
    } catch (err) {
        return false;
    }
};
