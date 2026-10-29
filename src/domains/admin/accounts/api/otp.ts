import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

// F-OTH-18: Transfer Funds, Create Transaction, and Self Transfer now require an OTP on the
// backend — this requests one via the same email-OTP endpoint the refund flow already uses
// (not purpose-bound to a specific action yet, so any of these three can share it).
export const getOtpOthers = async ({ userType, userId }: UserPayload) => {
    try {
        const res: SuccessGenericResponse<{}> = await ApiClient.get(
            `${userType}/${userId}/others/orders/get-otp?scope=email`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
