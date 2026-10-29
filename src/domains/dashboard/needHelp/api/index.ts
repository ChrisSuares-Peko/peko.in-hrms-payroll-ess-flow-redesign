import {
    SuccessGenericResponse,
    UserPayload,
    createChatDataPayload,
    ticketChatPayload,
} from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    supportTicketListing,
    ticketListingResponse,
    ticketPayload,
    // supportTicketRaiseResponse,
    supportTicketDeletedResponse,
    createChatPayload,
    createChatResponse,
    singleTicketResponse,
    TicketRaisePayload,
    ticketUpdateResponse,
    ticketUpdatePayload,
    issueListingResponse,
    ModuleListingResponse,
    UpdateTour,
    productTourResponse,
    SupportTicketResponse,
    ConversationResponse,
    FAQ,
} from '../types/type';

export const ticketListing = async ({
    userId,
    userType,
    page,
    fromDate,
    module,
    toDate,
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
                    module,
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
        const res: SuccessGenericResponse<SupportTicketResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/others/support`,
            payload
        );
        // const { data } = res;
        return res;
    } catch (error) {
        return false;
    }
};
export const updateTicket = async (payload: ticketUpdatePayload) => {
    try {
        const { chatId } = payload;
        delete payload.chatId;
        const res: SuccessGenericResponse<ticketUpdateResponse> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/others/support/${chatId}`,
            payload
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
export const deleteTicket = async (payload: ticketPayload) => {
    try {
        const res: SuccessGenericResponse<supportTicketDeletedResponse> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/others/support/${payload.ticketId}`
        );
        // const { data } = res;
        return res;
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
export const getFaq = async (faqCategory: string) => {
    try {
        const res: SuccessGenericResponse<FAQ[]> = await ApiClient.get(
            `user/general/support/faq?category=${faqCategory}`
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
export const updateProductTour = async (payload: UserPayload & UpdateTour) => {
    try {
        const res: SuccessGenericResponse<productTourResponse> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/others/productTour`,
            payload
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const getTicketChatData = async (payload: ticketChatPayload) => {
    try {
        const res = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/support/chats/${payload.id}`
        );

        return res;
    } catch (error) {
        return false;
    }
};

export const createChatData = async ({ userType, userId, ...payload }: createChatDataPayload) => {
    try {
        const res: SuccessGenericResponse<ConversationResponse> = await ApiClient.post(
            `${userType}/${userId}/others/support/create`,
            payload
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
