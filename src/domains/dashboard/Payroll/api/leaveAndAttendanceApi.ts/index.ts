import { SuccessGenericResponse } from "@customtypes/general";
import { ApiClient } from "@src/services/config";

import {  getLeavePolicyPayload, getLeaveProfilePayload, leaveListPayload, LeaveResponse,   } from "../../types/leaveSection";
import { LeaveProfileResponse } from "../../types/leaveSection/leaveprofiletypes";

export const getleaveList = async (payload: leaveListPayload) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/leave-application/all-leaves?`,
            {
                params: {
                    searchText: payload.search,
                    page: payload.start,
                    limit: 10,
                    year: payload.year,
                    month: payload.month,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};




export const getleavePoliciesForSelectedEmployee = async (payload: leaveListPayload) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/leave-application/all-leaves?`,
            {
                params: {
                    searchText: payload.search,
                    page: payload.start,
                    limit: 10,
                    year: payload.year,
                    month: payload.month,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};


export const getAvailableLeavePolicies = async (payload: getLeavePolicyPayload) => {
    try {
        const resp: SuccessGenericResponse<LeaveResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/leave-component/${payload.employeeId}/leave-policies`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};


export const getDetailsForLeaveProfile = async (payload: getLeaveProfilePayload) => {
    try {
        const resp: SuccessGenericResponse<LeaveProfileResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/leave-application/${payload.employeeId}`,
            {
    params: {
      page: payload.page,
      limit: payload.limit,
      searchText:payload.searchText
     
    }
  }
        );
       
        const { data } = resp;
        
        return data;
    } catch (err) {
        return false;
    }
};


