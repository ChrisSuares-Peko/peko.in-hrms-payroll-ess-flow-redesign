import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

interface KycLink {
    linkExpiryDateTime: string;
    webLink: string;
    mobileLink: string;
}

interface InitiateKycResponse {
    kycLink?: KycLink;
    alreadyCompleted?: boolean;
    state?: string;
}

/**
 * Backend-derived KYC state (single source of truth — see corporateCard deriveKycState):
 * COMPLETED = Full KYC done + video KYC approved; IN_REVIEW = video KYC completed, review pending
 * (vendor videoKYC status 4); IN_PROGRESS = VKYC call under way; REJECTED / ACTION_REQUIRED = user must act.
 */
export type KycDerivedState =
    | 'COMPLETED'
    | 'IN_REVIEW'
    | 'IN_PROGRESS'
    | 'REJECTED'
    | 'ACTION_REQUIRED';

interface KycStatusResponse {
    kyc: {
        state: KycDerivedState;
        isCompleted: boolean;
        refId: string | null;
        submittedOn: string | null;
        requestStatus: { code: number; label: string } | null;
        fullKyc: {
            requestStatus: { code: number; label: string };
            kycLink: {
                webLink: string;
                mobileLink: string;
                linkExpiryDateTime: string;
            } | null;
        } | null;
    };
}

export const getKycStatus = async (userType: string, userId: number) => {
    try {
        const res: SuccessGenericResponse<KycStatusResponse> = await ApiClient.get(
            `${userType}/${userId}/corporate-cards/kyc/status`
        );
        return res;
    } catch (error) {
        return false;
    }
};

export const initiateKycFull = async (userType: string, userId: number) => {
    try {
        const res: SuccessGenericResponse<InitiateKycResponse> = await ApiClient.post(
            `${userType}/${userId}/corporate-cards/kyc/initiate`
        );
        return res;
    } catch (error) {
        return false;
    }
};
