import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    AgreementApiItem,
    CreateAgreementPayload,
    CreateAgreementResponse,
    GetAllAgreementsPayload,
    GetAllAgreementsResponse,
    SendSignRequestPayload,
    UpdateAgreementPayload,
} from '../types/agreement';

export const getAllAgreementsApi = async (
    payload: GetAllAgreementsPayload & { userId: number; userType: string }
) => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<GetAllAgreementsResponse> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/agreement/all`,
            { params }
        );
        return resp;
    } catch {
        return false;
    }
};

export const createAgreementApi = async (
    payload: CreateAgreementPayload & { userId: number; userType: string }
) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<CreateAgreementResponse> = await ApiClient.post(
            `${userType}/${userId}/officeAndBusiness/agreement`,
            body
        );
        return resp;
    } catch {
        return false;
    }
};


export const getAgreementByIdApi = async (
    agreementId: number | string,
    payload: { userId: number; userType: string }
) => {
    try {
        const { userId, userType } = payload;
        const resp: SuccessGenericResponse<AgreementApiItem> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/agreement/${agreementId}`
        );
        return resp;
    } catch {
        return false;
    }
};

export const updateAgreementApi = async (
    agreementId: number | string,
    payload: UpdateAgreementPayload & { userId: number; userType: string }
) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<{}> = await ApiClient.put(
            `${userType}/${userId}/officeAndBusiness/agreement/${agreementId}`,
            body
        );
        return resp;
    } catch {
        return false;
    }
};

export const sendSignRequestApi = async (
    payload: SendSignRequestPayload & { userId: number; userType: string }
) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<{}> = await ApiClient.post(
            `${userType}/${userId}/officeAndBusiness/e-sign/sign-request`,
            body
        );
        return resp;
    } catch {
        return false;
    }
};

export const uploadDocumentApi = async (
    agreementId: number | string,
    payload: { documentBase64: string } & { userId: number; userType: string }
) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<{}> = await ApiClient.put(
            `${userType}/${userId}/officeAndBusiness/agreement/${agreementId}/uploadDocument`,
            body
        );
        return resp;
    } catch {
        return false;
    }
};

export const resendESignInvitationApi = async (
    eSignId: number,
    payload: { email: string; name: string } & { userId: number; userType: string }
) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<{}> = await ApiClient.post(
            `${userType}/${userId}/officeAndBusiness/e-sign/resend-invitation?id=${eSignId}`,
            body
        );
        return resp;
    } catch {
        return false;
    }
};

export const getAgreementDocumentApi = async (
    agreementId: number | string,
    payload: { userId: number; userType: string }
): Promise<Blob | false> => {
    try {
        const { userId, userType } = payload;
        const blob: Blob = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/agreement/${agreementId}/document`,
            { responseType: 'blob' }
        );
        return blob;
    } catch {
        return false;
    }
};

export const deleteAgreementApi = async (
    agreementId: number | string,
    payload: { userId: number; userType: string }
) => {
    try {
        const { userId, userType } = payload;
        const resp: SuccessGenericResponse<{}> = await ApiClient.delete(
            `${userType}/${userId}/officeAndBusiness/agreement/${agreementId}`
        );
        return resp;
    } catch {
        return false;
    }
};
