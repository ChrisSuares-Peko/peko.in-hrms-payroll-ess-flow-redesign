import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

/**
 * The users service is proxied at `/api/v1/user` (api-gateway routes.js) — it takes NO :userType/:userId
 * segments, unlike the per-service `/api/v1/:userType/:userId/<service>` routes. The controller reads the
 * caller from `req.user` and the `sessionid` header, so there is nothing to put in the path anyway.
 */
const BASE = 'user/active-role';

export interface OwnerCardholderDetails {
    name: string;
    mobileNo: string;
}

/**
 * Creates the account owner's own employee row without switching to it, so the People screen can list them
 * and they can start KYC while staying on the Corporate account.
 *
 * Idempotent, and it needs no input: the server builds the row from the personal name and OTP-verified
 * mobile captured at registration. Sending `details` only matters when registration left nothing usable,
 * which the server reports as `needsDetails`.
 */
export const createOwnerCardholderProfile = async (details?: OwnerCardholderDetails) => {
    try {
        const res: SuccessGenericResponse<{
            id: string | null;
            name?: string;
            mobileNo?: string;
            role?: string;
            created: boolean;
            needsDetails?: boolean;
        }> = await ApiClient.post(`${BASE}/cardholder-profile`, details ?? {});
        return res;
    } catch {
        return false;
    }
}
