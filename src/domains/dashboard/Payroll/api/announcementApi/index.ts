import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    IAnnouncementData,
    IAnnouncementsPayload,
    ICreateAnnouncementPayload,
    IEmployeeList,
    IPayload,
} from '../../types/announcementTypes';
import { announcementDeletePayload, announcementDeleteResponse } from '../../types/dashboardTypes';

export const getAnnouncementsAPI = async (payload: IAnnouncementsPayload) => {
    try {
        const params = {
            page: payload.page,
            limit: 10,
            order: 'DESC',
            search: payload.search,
            year: payload.year,
            month: payload.month,
        };
        const res: SuccessGenericResponse<IAnnouncementData> = await ApiClient.get(
            `/${payload.userType}/${payload.userId}/payroll/announcement`,
            { params }
        );
        const { data } = res;
        return data;
    } catch (err) {
        return false;
    }
};

export const getEmployeeListAPI = async (payload: IPayload) => {
    try {
        const res: SuccessGenericResponse<IEmployeeList> = await ApiClient.get(
            `/${payload.userType}/${payload.userId}/payroll/announcement/employees`
        );
        const { data } = res;
        return data;
    } catch (err) {
        return false;
    }
};

export const createAnnouncementAPI = async (payload: ICreateAnnouncementPayload) => {
    try {
        const { postData } = payload;
        const res: SuccessGenericResponse<IEmployeeList> = await ApiClient.post(
            `/${payload.userType}/${payload.userId}/payroll/announcement`,
            postData
        );
        return res;
    } catch (err) {
        return false;
    }
};
export const deleteAnnouncement = async (payload: announcementDeletePayload) => {
    try {
        const res: SuccessGenericResponse<announcementDeleteResponse> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/payroll/announcement/${payload.announcementId}`
        );
        return res;
    } catch (error) {
        return false;
    }
};
