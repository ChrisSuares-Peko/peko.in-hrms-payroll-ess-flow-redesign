import { CommonFileBuffer, SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    supportTicketListing,
    ticketListingResponse,
    ticketPayload,
    supportTicketRaiseResponse,
    createChatPayload,
    createChatResponse,
    singleTicketResponse,
    TicketRaisePayload,
    ticketUpdateResponse,
    ticketUpdatePayload,
    issueListingResponse,
    ModuleListingResponse,
    CorporateListResponse,
} from '../types/type';

export const ticketListing = async ({
    userId,
    userType,
    page,
    fromDate,
    toDate,
    status,
}: supportTicketListing) => {
    try {
        const res: SuccessGenericResponse<ticketListingResponse> = await ApiClient.get(
            `${userType}/${userId}/others/support/tickets`,
            {
                params: {
                    from: fromDate,
                    to: toDate,
                    itemsPerPage: 10,
                    searchText: '',
                    page,
                    status,
                },
            }
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
export const getSingleTicket = async (payload: ticketPayload) => {
    try {
        const res: SuccessGenericResponse<singleTicketResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/support/ticketDetials/${payload.ticketId}`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
export const ticketRaise = async (payload: TicketRaisePayload) => {
    try {
        const res: SuccessGenericResponse<supportTicketRaiseResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/others/support/create-ticket`,
            payload
        );
        // const { data } = res;
        return res;
    } catch (error) {
        return false;
    }
};
export const updateTicketStatus = async (payload: ticketUpdatePayload) => {
    try {
        const res: SuccessGenericResponse<ticketUpdateResponse> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/others/support/${payload.chatId}`,
            payload
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const createChat = async ({ userType, userId, ...payload }: createChatPayload) => {
    try {
        const res: SuccessGenericResponse<createChatResponse> = await ApiClient.post(
            `${userType}/${userId}/others/support/create`,
            payload
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const issueTypeListing = async () => {
    try {
        const res: SuccessGenericResponse<issueListingResponse> = await ApiClient.get(
            'user/general/support/issueType'
        );
        const { data } = res;

        return data;
    } catch (error) {
        return false;
    }
};

export const moduleTypeListing = async () => {
    try {
        const res: SuccessGenericResponse<ModuleListingResponse> = await ApiClient.get(
            'user/general/support/modules'
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const getAllCorporates = async ({ userType, userId, searchText }: any) => {
    try {
        const res: SuccessGenericResponse<CorporateListResponse> = await ApiClient.get(
            `${userType}/${userId}/others/transferFunds/corporate-users?searchText=${searchText}`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const getFileBufferReport = async (params: any) => {
    try {
        const res: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${params.userType}/${params.userId}/others/support/download-report/${params.type}`,
            {
                params: {
                    sort: params.sort,
                    searchText: params.searchText || '',
                    to: params.to,
                    from: params.from,
                },
            }
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
