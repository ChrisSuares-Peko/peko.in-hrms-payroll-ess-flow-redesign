import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { stepPayload } from '../types';
import {
    BankListResponse,
    ExistingDocumentsListResponse,
    KybDocumentPayload,
} from '../types/paymentlinkType';

export const createSupplierApi = async (payload: UserPayload & any) => {
    try {
        const { userId, userType } = payload;

        const formData = {
            bankname: payload.bankname,
            bankAccountHolderName: payload.accountHolderName,
            bankAccount: payload.accountNumber,
            ifsc: payload.ifsc,
        };

        const resp: SuccessGenericResponse<{}> = await ApiClient.post(
            `${userType}/${userId}/officeAndBusiness/payment-links/create-supplier`,
            formData
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const uploadKybDocs = async (payload: UserPayload & KybDocumentPayload) => {
    try {
        const {
            userId,
            userType,
            documentName,
            file,
            websiteLink,
            natureOfBusiness,
            userConsent = false,
            isFinalUpload = false,
        } = payload;
        const formData = new FormData();

        if (file && documentName) {
            formData.append('documentName', documentName);
            formData.append('document', file);
        }
        if (websiteLink) {
            formData.append('websiteLink', websiteLink);
        }
        if (natureOfBusiness) {
            formData.append('natureOfBusiness', natureOfBusiness);
        }

        formData.append('userConsent', userConsent.toString());
        formData.append('isFinalUpload', isFinalUpload.toString());

        const resp: SuccessGenericResponse<{ documentUrl: string }> = await ApiClient.post(
            `${userType}/${userId}/officeAndBusiness/payment-links/upload-supplier-documents`,
            formData
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getBankList = async (payload: UserPayload) => {
    try {
        const { userId, userType } = payload;

        const resp: SuccessGenericResponse<BankListResponse> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/payment-links/bank-list`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getExistingDocuments = async (payload: UserPayload) => {
    try {
        const { userId, userType } = payload;

        const resp: SuccessGenericResponse<ExistingDocumentsListResponse> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/payment-links/uploaded-documents`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const KYBStepsUpdate = async (
    payload: stepPayload & { userId: number; userType: string }
) => {
    const reqbody = {
        isFirstStepCompleted: payload.isFirstStepCompleted,
        businessType: payload.businessType,
    };
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/payment-links/complete-kyb`,
            reqbody
        );
        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};
