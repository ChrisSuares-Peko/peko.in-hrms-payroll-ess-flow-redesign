import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { updateChatIdPayload, updateChatIdResponse } from '../types/type';

export const updateChatId = async (payload: updateChatIdPayload) => {
    try {
        const formData = {
            restoreId: payload.restoreId,
        };
        const res: SuccessGenericResponse<updateChatIdResponse> = await ApiClient.patch(
            `${payload.userType}/${payload.userId}/others/support/chatId`,
            formData
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
