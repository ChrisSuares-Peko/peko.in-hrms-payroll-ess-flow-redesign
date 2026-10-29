import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

export const SendReferralMail = async (payload: UserPayload & { email: string }) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.patch(
            `${payload.userType}/${payload.userId}/others/profile/refer`,
            { email: payload.email }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
