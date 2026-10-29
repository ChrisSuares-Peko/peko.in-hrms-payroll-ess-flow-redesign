import { CommonFileBuffer, SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    AssignmentData,
    assignPayload,
    DLData,
    DrivingLicenseResponseV2,
    filterState,
    RefreshFleetData,
    updatePayload,
    UserPayload,
    VehicleData,
    verifyPayload,
} from '../types';

export const verify = async (payload: verifyPayload) => {
    let reqbody;
    if (payload.type === 'dl') {
        reqbody = {
            doc_identity_no: payload.doc_identity_no,
            dob: payload.dob,
        };
    } else {
        reqbody = {
            doc_identity_no: payload.doc_identity_no,
        };
    }
    try {
        const resp: SuccessGenericResponse<DLData> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/garage/verify/${payload.type}`,
            reqbody
        );

        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};

export const getDashboardData = async (payload: any) => {
    try {
        const resp: SuccessGenericResponse<VehicleData> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/garage`
        );

        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};

// Pulls current consumed seats (fleets + drivers). Combined with addonData.maxLimit (from
// useGetAddonDetails) it tells the UI when to disable Search / Add buttons because the
// user has hit their Turbo quota.
export const getGarageUsage = async (payload: { userType: string; userId: number }) => {
    try {
        const resp: SuccessGenericResponse<{ fleetsUsed: number; driversUsed: number }> =
            await ApiClient.get(
                `${payload.userType}/${payload.userId}/officeAndBusiness/garage/usage-count`
            );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const getRefreshData = async (payload: any) => {
    try {
        const resp: SuccessGenericResponse<VehicleData> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/garage/refresh`
        );

        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};

export const addDoc = async (payload: verifyPayload) => {
    try {
        let reqbody;
        if (payload.type === 'dl') {
            reqbody = {
                doc_identity_no: payload.doc_identity_no,
                dob: payload.dob,
                vehicleId: payload?.vehicleId
            };
            
        } else {
            reqbody = {
                doc_identity_no: payload.doc_identity_no,
            };
        }
        const resp: SuccessGenericResponse<DrivingLicenseResponseV2> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/garage/add/${payload.type}`,
            reqbody
        );
        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};
export const getAllFleets = async (payload: filterState & UserPayload) => {
    try {
        const res: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/garage/fleets`,
            {
                params: {
                    // from: payload.from,
                    // to: payload.to,
                    searchText: payload.searchText,
                    // sort: payload.sort,
                    page: payload.page,
                    // filter: payload.filter,
                    itemsPerPage: payload.pageSize ?? 10,
                    // sortField: payload.sortField,
                },
            }
        );
        const { data } = res;

        return data;
    } catch (error) {
        return false;
    }
};

export const getAllDocs = async (payload: filterState & UserPayload) => {
    try {
        const res: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/garage/documents`,
            {
                params: {
                    from: payload.from,
                    to: payload.to,
                    searchText: payload.searchText,
                    // sort: payload.sort,
                    page: payload.page,
                    // filter: payload.filter,
                    itemsPerPage: payload.pageSize ?? 10,
                    // sortField: payload.sortField,
                },
            }
        );
        const { data } = res;

        return data;
    } catch (error) {
        return false;
    }
};

export const getVehicleDocuments = async (payload: any) => {
    try {
        const res: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/garage/documents`,
            {
                params: {
                    vehicleId: payload.vehicleId,
                    itemsPerPage: 50,
                },
            }
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
export const createDocument = async (payload: assignPayload) => {
    try {
        const resp: SuccessGenericResponse<AssignmentData> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/garage/documents`,
            payload
        );

        // const { data } = resp;

        return resp;
    } catch (err) {
        return false;
    }
};
export const updateDocument = async (payload: updatePayload) => {

    try {
        const resp: SuccessGenericResponse<AssignmentData> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/officeAndBusiness/garage/documents/${payload.docId}`,
            payload
        );

        // const { data } = resp;

        return resp;
    } catch (err) {
        return false;
    }
};
export const deleteDocument = async (payload: any) => {
    try {
        const resp: SuccessGenericResponse<AssignmentData> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/officeAndBusiness/garage/documents/${payload.docId}`
        );

        // const { data } = resp;

        return resp;
    } catch (err) {
        return false;
    }
};

export const getAllDrivers = async (payload: filterState & UserPayload) => {
    try {
        const res: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/garage/drivers`,
            {
                params: {
                    // from: payload.from,
                    // to: payload.to,
                    searchText: payload.searchText,
                    // sort: payload.sort,
                    page: payload.page,
                    // filter: payload.filter,
                    itemsPerPage: payload.pageSize ?? 10,
                    // sortField: payload.sortField,
                },
            }
        );
        const { data } = res;

        return data;
    } catch (error) {
        return false;
    }
};
export const getAllLogs = async (payload: filterState & UserPayload) => {
    try {
        const res: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/garage/logs`,
            {
                params: {
                    from: payload.from,
                    to: payload.to,
                    searchText: payload.searchText,

                    page: payload.page,

                    itemsPerPage: payload.pageSize ?? 10,
                },
            }
        );
        const { data } = res;

        return data;
    } catch (error) {
        return false;
    }
};
export const assign = async (payload: assignPayload) => {
    try {
        const resp: SuccessGenericResponse<AssignmentData> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/garage/assignment`,
            payload
        );

        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};

export const unassign = async (payload: any) => {
    try {
        const resp: SuccessGenericResponse<AssignmentData> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/officeAndBusiness/garage/assignment/${payload.id}`
        );

        return resp;
    } catch (err) {
        return false;
    }
};

export const deleteFleet = async (payload: any) => {
    try {
        const resp: SuccessGenericResponse<AssignmentData> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/officeAndBusiness/garage/fleet/${payload.id}`,
            payload
        );

        // const { data } = resp;

        return resp;
    } catch (err) {
        return false;
    }
};
export const getFileBufferReport = async (payload: UserPayload & any) => {
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/garage/fleets/${payload.type}?searchText=${payload?.searchText ?? ""}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const getFileBufferDriverReport = async (payload: UserPayload & any) => {
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/garage/drivers/${payload.type}`,
            {
                params: {
                    // from: payload.from,
                    // to: payload.to,
                    searchText: payload.searchText,

                    page: payload.page,

                    itemsPerPage: payload.pageSize ?? 10,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const deleteDriver = async (payload: any) => {
    try {
        const resp: SuccessGenericResponse<AssignmentData> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/officeAndBusiness/garage/driver/${payload.id}`,
            payload
        );

        // const { data } = resp;

        return resp;
    } catch (err) {
        return false;
    }
};

export const getFleet = async (payload: any) => {
    try {
        const resp: SuccessGenericResponse<VehicleData> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/garage/fleet/${payload.id}`
        );

        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};
export const updateFleetServiceDates = async (payload: any) => {
    try {
        const resp: SuccessGenericResponse<VehicleData> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/officeAndBusiness/garage/fleet/${payload.id}`,
            {
                lastServiceDate: payload.lastServiceDate,
                nextServiceDue: payload.nextServiceDue,
            }
        );

        return resp;
    } catch (err) {
        return false;
    }
};
// Ticket 31321: re-pulls this vehicle's RC from the vendor. The server answers 200 with
// `refreshed: false` when the weekly window has not elapsed — that is a normal outcome, not an
// error, so the caller renders the "next refresh" message itself.
export const refreshFleetData = async (payload: any) => {
    try {
        const resp: SuccessGenericResponse<RefreshFleetData> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/garage/fleet/${payload.id}/refresh`
        );

        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};
export const updateFleetFastag = async (payload: any) => {
    try {
        const resp: SuccessGenericResponse<VehicleData> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/officeAndBusiness/garage/fleet/${payload.id}/fastag`,
            {
                fastagProvider: payload.fastagProvider,
                fastagBillerId: payload.fastagBillerId,
                fastagRegistration: payload.fastagRegistration,
                fastagParamName: payload.fastagParamName,
            }
        );

        return resp;
    } catch (err) {
        return false;
    }
};
export const createQuoteRequest = async (payload: any) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/garage/quote-request`,
            {
                fullName: payload.fullName,
                mobileNumber: payload.mobileNumber,
                email: payload.email,
                insuranceType: payload.insuranceType,
                vehicleNumber: payload.vehicleNumber,
                vehicleId: payload.vehicleId,
            }
        );

        return resp;
    } catch (err) {
        return false;
    }
};
export const getUsage = async (payload: any) => {
    try {
        const resp: SuccessGenericResponse<VehicleData> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/garage/usage-count`
        );

        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};
export const getDriver = async (payload: any) => {
    try {
        const resp: SuccessGenericResponse<VehicleData> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/garage/driver/${payload.id}`
        );

        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};
