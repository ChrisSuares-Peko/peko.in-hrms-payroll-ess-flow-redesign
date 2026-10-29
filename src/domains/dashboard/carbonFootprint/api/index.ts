import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    AllProjectPayload,
    AnswerSheet,
    AnswersResponse,
    SingleProjectPayload,
    balanceQuery,
    balanceResponse,
    dashboardResponse,
    neutrilizeResponse,
    projectListingResponse,
    questionsResponse,
    selectProjectResponse,
    singleViewResponse,
    transactionListingPayload,
    transactionListingResponse,
} from '../types/dashboard';

export const getDashboardData = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<dashboardResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/carbonFootprint/dashboard`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const getSingleProjectData = async (payload: SingleProjectPayload) => {
    try {
        const resp: SuccessGenericResponse<singleViewResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/carbonFootprint/projects/details/${payload.projectId}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getAllProjectData = async (payload: AllProjectPayload) => {
    try {
        const resp: SuccessGenericResponse<projectListingResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/carbonFootprint/projects`,
            {
                params: {
                    searchQuery: payload.searchQuery,
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getNeutriliseNowData = async (payload: SingleProjectPayload) => {
    try {
        const resp: SuccessGenericResponse<neutrilizeResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/carbonFootprint/neutralize/${payload.projectId}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getSelectProjects = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<selectProjectResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/carbonFootprint/allProjects`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getTransactions = async (payload: transactionListingPayload) => {
    try {
        const res: SuccessGenericResponse<transactionListingResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/carbonFootprint/latestTransactions`,
            {
                params: {
                    from: payload.from,
                    to: payload.to,
                    searchQuery: payload.searchText,
                    sort: payload.sort,
                    page: payload.page,
                    filter: payload.filter,
                    itemsPerPage: 10,
                },
            }
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const getQuestions = async (payload: UserPayload & { questionType: string }) => {
    try {
        const resp: SuccessGenericResponse<questionsResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/carbonFootprint/questions?type=${payload.questionType}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const submitAnswers = async (
    payload: UserPayload & { questionType: string; answers: AnswerSheet }
) => {
    try {
        const resp: SuccessGenericResponse<AnswersResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/carbonFootprint/questions?type=${payload.questionType}`,
            { answersObj: payload.answers }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const checkBalance = async (payload: UserPayload & balanceQuery) => {
    try {
        const resp: SuccessGenericResponse<balanceResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/carbonFootprint/balance`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
