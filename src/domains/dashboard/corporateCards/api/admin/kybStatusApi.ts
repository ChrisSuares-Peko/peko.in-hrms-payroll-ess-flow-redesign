import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

/**
 * Backend kybStatus (see corporateCard constants/corporateCardApplication.js):
 * PENDING with no row / no kybReference = not yet submitted; PENDING with a kybReference = the
 * corporate has submitted and it's awaiting our team to forward the documents to the KYB vendor;
 * SUBMITTED = our team has forwarded them to the vendor (set manually via the admin Manage drawer);
 * UNDER_REVIEW = the vendor/reviewer is actively assessing it; VERIFIED/REJECTED = reviewer's
 * decision; COMPLETED = fully provisioned (card scheme + SVC + virtual account all set by an admin) —
 * the only status that unlocks the dashboard without an interstitial.
 */
export type KybApiStatus =
    | 'PENDING'
    | 'SUBMITTED'
    | 'UNDER_REVIEW'
    | 'VERIFIED'
    | 'REJECTED'
    | 'COMPLETED';

export interface KybApplicationApiShape {
    corporateId: number;
    kybStatus: KybApiStatus;
    kybReference: string | null;
    businessType: string | null;
    rejectionReason: string | null;
    verifiedAcknowledged: boolean;
    /** The corporate has read the rejection and asked to start over; the status stays REJECTED until they
     *  resubmit, so this is what separates "not seen yet" from "back in progress". */
    rejectionAcknowledged?: boolean;
    updatedAt: string | null;
}

interface KybStatusResponse {
    application: KybApplicationApiShape | null;
}

/** One checklist row. `documentName` is the key the upload endpoint stores it under. */
export interface KybChecklistDocument {
    key: string;
    documentName: string;
    label: string;
    uploadLabel: string;
    hint: string;
    required: boolean;
    maxSizeKb?: number;
}

export interface KybBusinessTypeChecklist {
    value: string;
    label: string;
    documents: KybChecklistDocument[];
}

interface KybChecklistResponse {
    businessTypes: KybBusinessTypeChecklist[];
}

export const getKybDocumentChecklist = async (userType: string, userId: number) => {
    try {
        const res: SuccessGenericResponse<KybChecklistResponse> = await ApiClient.get(
            `${userType}/${userId}/corporate-cards/kyb-status/document-checklist`
        );
        return res;
    } catch (error) {
        return false;
    }
};

export const getKybStatus = async (userType: string, userId: number) => {
    try {
        const res: SuccessGenericResponse<KybStatusResponse> = await ApiClient.get(
            `${userType}/${userId}/corporate-cards/kyb-status`
        );
        return res;
    } catch (error) {
        return false;
    }
};

export const saveKybBusinessType = async (
    userType: string,
    userId: number,
    businessType: string
) => {
    try {
        const res: SuccessGenericResponse<KybStatusResponse> = await ApiClient.put(
            `${userType}/${userId}/corporate-cards/kyb-status/business-type`,
            { businessType }
        );
        return res;
    } catch (error) {
        return false;
    }
};

export const initiateKyb = async (userType: string, userId: number, businessType?: string) => {
    try {
        const res: SuccessGenericResponse<KybStatusResponse> = await ApiClient.post(
            `${userType}/${userId}/corporate-cards/kyb-status/initiate`,
            businessType ? { businessType } : {}
        );
        return res;
    } catch (error) {
        return false;
    }
};

export const reopenKyb = async (userType: string, userId: number) => {
    try {
        const res: SuccessGenericResponse<KybStatusResponse> = await ApiClient.post(
            `${userType}/${userId}/corporate-cards/kyb-status/reopen`
        );
        return res;
    } catch (error) {
        return false;
    }
};

export const completeKyb = async (userType: string, userId: number) => {
    try {
        const res: SuccessGenericResponse<KybStatusResponse> = await ApiClient.post(
            `${userType}/${userId}/corporate-cards/kyb-status/complete`
        );
        return res;
    } catch (error) {
        return false;
    }
};

export interface KybDocumentUpload {
    documentName: string;
    fileBase: string;
    fileFormat: string;
    fileName?: string;
    expiryDate?: string | null;
}

const documentsPath = (userType: string, userId: number) =>
    `${userType}/${userId}/corporate-cards/kyb-documents`;

export const uploadKybDocuments = async (
    userType: string,
    userId: number,
    documents: KybDocumentUpload[]
) => {
    try {
        const res: SuccessGenericResponse<{ savedDocuments: string[] }> = await ApiClient.post(
            documentsPath(userType, userId),
            { documents }
        );
        return res;
    } catch (error) {
        return false;
    }
};

export interface KybUploadedDocument {
    fileName: string | null;
    documentType: string | null;
    expiryDate: string | null;
    status: string | null;
    uploadedAt: string | null;
}

interface KybUploadedDocumentsResponse {
    corporateDocuments: Record<string, KybUploadedDocument>;
}

export const getUploadedKybDocuments = async (userType: string, userId: number) => {
    try {
        const res: SuccessGenericResponse<KybUploadedDocumentsResponse> = await ApiClient.get(
            documentsPath(userType, userId)
        );
        return res;
    } catch (error) {
        return false;
    }
};

export const deleteKybDocuments = async (
    userType: string,
    userId: number,
    documentNames: string[]
) => {
    try {
        const res: SuccessGenericResponse<{ savedDocuments: string[] }> = await ApiClient.post(
            documentsPath(userType, userId),
            { documents: [], deleteDoclist: documentNames }
        );
        return res;
    } catch (error) {
        return false;
    }
};

export interface CorporateAgreementValues {
    entityName: string;
    regAddress: string;
    regCity: string;
    regState: string;
    regPinCode: string;
    regTelephone: string;
    regEmail: string;
    billSameAsRegistered: boolean;
    billAddress: string;
    billCity: string;
    billState: string;
    billPinCode: string;
    gstNumber: string;
    panNumber: string;
    cinLlpNumber: string;
    tanNumber: string;
    addressProofSameAsGst: boolean;
    bankName: string;
    bankBranch: string;
    bankAccountNumber: string;
    bankIfsc: string;
    bankCity: string;
    officialContactName: string;
    officialContactMobile: string;
    officialContactEmail: string;
    salespersonName: string;
    salespersonMobile: string;
    salespersonEmail: string;
    signatoryName: string;
    signatoryContact: string;
    signatoryEmail: string;
    signatoryIsPep: boolean;
}

interface AgreementResponse {
    agreement: (CorporateAgreementValues & { isDraft: boolean }) | null;
    signMethod: string | null;
    esignStatus: string | null;
    esignSigningLink: string | null;
    esignSentAt: string | null;
    esignSignedAt: string | null;
    esignFailureReason: string | null;
    templateAvailable: boolean;
}

const agreementPath = (userType: string, userId: number) =>
    `${userType}/${userId}/corporate-cards/kyb-status/agreement`;

export const getCorporateAgreement = async (userType: string, userId: number) => {
    try {
        const res: SuccessGenericResponse<AgreementResponse> = await ApiClient.get(
            agreementPath(userType, userId)
        );
        return res;
    } catch (error) {
        return false;
    }
};

export const saveCorporateAgreement = async (
    userType: string,
    userId: number,
    values: Partial<CorporateAgreementValues>
) => {
    try {
        const res: SuccessGenericResponse<unknown> = await ApiClient.put(
            agreementPath(userType, userId),
            values
        );
        return res;
    } catch (error) {
        return false;
    }
};

export const setAgreementSignMethod = async (
    userType: string,
    userId: number,
    signMethod: string
) => {
    try {
        const res: SuccessGenericResponse<unknown> = await ApiClient.post(
            `${agreementPath(userType, userId)}/sign-method`,
            { signMethod }
        );
        return res;
    } catch (error) {
        return false;
    }
};

export const sendAgreementForEsign = async (
    userType: string,
    userId: number,
    values: Partial<CorporateAgreementValues>
) => {
    try {
        const res: SuccessGenericResponse<{
            esignStatus: string;
            esignSigningLink: string | null;
        }> = await ApiClient.post(`${agreementPath(userType, userId)}/send-for-esign`, values);
        return res;
    } catch (error) {
        return false;
    }
};

export const downloadAgreementTemplate = async (userType: string, userId: number) => {
    try {
        const res = (await ApiClient.get(`${agreementPath(userType, userId)}/template`, {
            responseType: 'blob',
        })) as unknown as Blob;
        return res;
    } catch (error) {
        return false;
    }
};
