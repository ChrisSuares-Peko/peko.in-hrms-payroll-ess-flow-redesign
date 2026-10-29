import { CommonFileBuffer, SuccessGenericResponse } from '@customtypes/general';
import { UserPayload } from '@src/domains/admin/accounts/types/SelfTransferTypes';
import { ApiClient } from '@src/services/config';

import {
    AadhaarDetailsPayload,
    AadhaarLinkPayload,
    BankAccountPayload,
    CinPayload,
    DlPayload,
    EpicPayload,
    GstinBusinessPayload,
    GstinPayload,
    GstinReturnPayload,
    IfscPayload,
    PanPayload,
    PassportPayload,
    SimplePanPayload,
    VerificationPrices,
} from '../types';

export const verifyBankAccount = async (payload: BankAccountPayload) => {
    const formData = new FormData();
    formData.append('ifsc_code', payload.values.ifsc);
    formData.append('accounts', payload.values.bank_account);
    formData.append('account_name', payload.values.name);
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/verification/v2/bank-account`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        // const { data } = resp;
        return resp;
    } catch (err) {
        return false;
    }
};
export const verifyBankIfsc = async (payload: IfscPayload) => {
    const reqbody = {
        ifsc: payload.values.ifsc,
    };
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/verification/ifsc`,
            reqbody
        );
        // const { data } = resp;
        return resp;
    } catch (err) {
        return false;
    }
};
export const verifyPan = async (payload: PanPayload) => {
    const reqbody = {
        pan: payload.values.pan,
        name: payload.values.name,
        date_of_birth: payload.values.date_of_birth,
    };
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/verification/v2/pan`,
            reqbody
        );
        // const { data } = resp;
        return resp;
    } catch (err) {
        return false;
    }
};
export const verifyAdvancePan = async (payload: PanPayload) => {
    const reqbody = {
        pan: payload.values.pan,
        name: payload.values.name,
    };
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/verification/advance/pan`,
            reqbody
        );
        // const { data } = resp;
        return resp;
    } catch (err) {
        return false;
    }
};
export const verifyLicense = async (payload: DlPayload) => {
    const reqbody = {
        dl_number: payload.values.dl_number,
        dob: payload.values.dob,
    };
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/verification/driving-license`,
            reqbody
        );
        // const { data } = resp;
        return resp;
    } catch (err) {
        return false;
    }
};
export const verifyVoterId = async (payload: EpicPayload) => {
    const reqbody = {
        epic_number: payload.values.epic_number,
        name: payload.values.name,
    };
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/verification/voter-id`,
            reqbody
        );
        // const { data } = resp;
        return resp;
    } catch (err) {
        return false;
    }
};
export const verifyPassport = async (payload: PassportPayload) => {
    const reqbody = {
        name: payload.values.name,
        file_number: payload.values.file_number,
        dob: payload.values.dob,
    };
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/verification/passport`,
            reqbody
        );
        // const { data } = resp;
        return resp;
    } catch (err) {
        return false;
    }
};
export const verifyCin = async (payload: CinPayload) => {
    const reqbody = {
        cin: payload.values.cin,
    };
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/verification/cin`,
            reqbody
        );
        // const { data } = resp;
        return resp;
    } catch (err) {
        return false;
    }
};
export const verifyCorporateEntity = async (payload: CinPayload) => {
    const reqbody = {
        CIN: payload.values.cin,
    };
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/verification/v2/corporate`,
            reqbody
        );
        // const { data } = resp;
        return resp;
    } catch (err) {
        return false;
    }
};
export const verifyDirector = async (payload: CinPayload) => {
    const reqbody = {
        CIN: payload.values.cin,
    };
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/verification/v2/director/cin`,
            reqbody
        );
        // const { data } = resp;
        return resp;
    } catch (err) {
        return false;
    }
};
export const verifyDirectorDin = async (payload: any) => {
    const reqbody = {
        DIN: payload.values.din,
    };
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/verification/v2/director/din`,
            reqbody
        );
        // const { data } = resp;
        return resp;
    } catch (err) {
        return false;
    }
};
export const verifyGst = async (payload: GstinPayload) => {
    const formData = new FormData();
    formData.append('gst_in', payload.values.GSTIN);
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/verification/v2/gst-verify`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        // const { data } = resp;
        return resp;
    } catch (err) {
        return false;
    }
};
export const verifyGstPan = async (payload: SimplePanPayload) => {
    const reqbody = {
        pan_no: payload.values.pan_no,
        state_code: payload.values.state_code,
    };
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/verification/v2/gst-by-pan`,
            reqbody
        );
        // const { data } = resp;
        return resp;
    } catch (err) {
        return false;
    }
};
export const verifyBusinessGst = async (payload: GstinBusinessPayload) => {
    const reqbody = {
        gstin: payload.values.GSTIN,
        action: 'TP',
    };
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/verification/v2/gst-business`,
            {
                params: reqbody,
            }
        );
        // const { data } = resp;
        return resp;
    } catch (err) {
        return false;
    }
};
export const verifyGstReturn = async (payload: GstinReturnPayload) => {
    const reqbody = {
        gstin: payload.values.GSTIN,
        fy: payload.values.fy,
        action: 'RETTRACK',
    };
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/verification/v2/gst/return`,
            {
                params: reqbody,
            }
        );
        // const { data } = resp;
        return resp;
    } catch (err) {
        return false;
    }
};
export const generateAadhaarLink = async (payload: AadhaarLinkPayload) => {
    const reqbody = {
        email: payload.values.email,
        name: payload.values.name,
        mobile: payload.values.mobile,
    };
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/verification/v2/aadhaar/generate-link`,
            reqbody
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const getAadhaarDetails = async (payload: AadhaarDetailsPayload) => {
    const reqbody = {
        reference_number: payload.reference_number,
        transaction_id: payload.transaction_id,
    };
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/verification/v2/aadhaar/details`,
            reqbody
        );
        return resp;
    } catch (err) {
        return false;
    }
};
export const AdharOcr = async (payload: any) => {
    if (!payload.image) {
        console.error('Image is missing in the payload');
        return false;
    }

    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/verification/aadhar-masking`,
            payload.image,
            {
                headers: {
                    'Content-Type': 'multipart/form-data', // Make sure the header is set to handle form data
                },
            }
        );

        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const getFileBufferReport = async (payload: UserPayload & any) => {
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/verification/v2/verification-history/${payload.type}`,
            {
                params: {
                    sort: payload.sort,
                    searchText: payload.searchText,
                    status: payload.status,
                    to: payload.to,
                    from: payload.from,
                    // vendorId: payload.id,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getAllTransaction = async (payload: any) => {
    try {
        const res: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/verification/v2/verification-history`,
            {
                params: {
                    from: payload.from,
                    to: payload.to,
                    status: payload.status,
                    searchText: payload.searchText,
                    sort: payload.sort,
                    page: payload.page,
                    filter: payload.filter,
                    itemsPerPage: 10,
                    sortField: payload.sortField,
                },
            }
        );
        const { data } = res;

        return data;
    } catch (error) {
        return false;
    }
};
export const getAllPrices = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<VerificationPrices> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/verification/v2/get-price`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const getVerificationCount = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/verification/v2/count`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const getVerificationAddOns = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/verification/v2/add-ons`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const getVerificationAddOnHistory = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/verification/v2/add-on-history`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
