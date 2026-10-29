import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { UserPayload, corporateData, corporateResponse, getOneData } from '../types/customertypes';
import {
    ApiResponse,
    DataResponse,
    getCustomers,
    getGuidelinePayload,
    guidelineRequest,
    statusPayload,
} from '../types/guidelineTypes';
import {
    BasicDetailsTypes,
    DashboardApiResponse,
    InvoiceResponse,
    UserDetailsPayload,
    downloadInvoicePayload,
    downloadInvoiceResponse,
    getAllInvoicesTypes,
    paymentlinkPayload,
    sendEmailTypes,
    userBankDetailsResponse,
    userDetailsResponse,
} from '../types/index';
import { OrderHistoryResponse } from '../types/paymentlinkType';
import { UploadInvoiceResponse, GetAgreementRespnse } from '../types/uploadInvoiceType';

export const invoice = async (
    payload: BasicDetailsTypes & { userId: number; userType: string }
) => {
    try {
        const { userId, userType, ...restPayload } = payload;
        delete restPayload.id;
        delete restPayload.updatedAt;
        delete restPayload.createdAt;
        const resp: SuccessGenericResponse<InvoiceResponse> = await ApiClient.post(
            `${userType}/${userId}/officeAndBusiness/invoices`,
            {
                ...restPayload,
                userId,
                userType,
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const getInvoice = async (payload: {
    userId: number;
    userType: string;
    invoiceId: number;
}) => {
    try {
        const { userId, userType, invoiceId } = payload;
        const resp: SuccessGenericResponse<InvoiceResponse> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/invoices/invoice/${invoiceId}`
        );
        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};
export const getAllInvoices = async (payload: {
    userId: number;
    userType: string;
    searchText: string | undefined;
    currentPage: number;
    limit: number;
}) => {
    try {
        const { userId, userType } = payload;
        const fromDate = '';
        const toDate = '';
        const page = payload.currentPage;
        const itemsPerPage = payload.limit;
        const draw = 1;
        const order = 'ASC';
        const column = 'id';
        const { searchText } = payload;
        const url = `${userType}/${userId}/officeAndBusiness/invoices/all?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&page=${page}&itemsPerPage=${itemsPerPage}&draw=${draw}&order=${order}&column=${column}&searchText=${encodeURIComponent(searchText ?? '')}`;

        const resp: SuccessGenericResponse<getAllInvoicesTypes> = await ApiClient.get(url);
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const sendEmaill = async (
    payload: sendEmailTypes & { userId: number; userType: string }
) => {
    try {
        const { userId, userType, invoiceOnly, ...restPayload } = payload;

        const resp: SuccessGenericResponse<boolean> = await ApiClient.post(
            `${userType}/${userId}/officeAndBusiness/invoices/sendEmail?invoiceOnly=${invoiceOnly}`,
            {
                ...restPayload,
                userId,
                userType,
            }
        );
        const { status } = resp;
        return status;
    } catch (err) {
        return false;
    }
};

export const sendEmail = async (payload: any) => {
    try {
        const { userId, userType, ...restPayload } = payload;
        const resp: SuccessGenericResponse<boolean> = await ApiClient.post(
            `${userType}/${userId}/officeAndBusiness/invoices/sendMail`,
            {
                ...restPayload,
                userId,
                userType,
            }
        );
        const { status } = resp;
        return status;
    } catch (err) {
        return false;
    }
};

export const downloadInvoice = async (payload: downloadInvoicePayload) => {
    try {
        const resp: SuccessGenericResponse<downloadInvoiceResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/invoices/downloadInvoice/`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const getUserDetails = async (payload: UserDetailsPayload) => {
    try {
        const resp: SuccessGenericResponse<userDetailsResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/softwares/corporateDetails`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const getBankDetails = async (payload: UserDetailsPayload) => {
    try {
        const resp: SuccessGenericResponse<userBankDetailsResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/invoices/findBankAccount`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const addGuideline = async (
    payload: guidelineRequest & { userId: number; userType: string }
) => {
    try {
        const newPayload = payload.data.map(item => {
            const newItem = { ...item };

            if (!newItem.sms) {
                delete newItem.templet.sms;
            }
            if (!newItem.email) {
                delete newItem.templet.email;
            }

            return newItem;
        });
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/invoice-guideline`,
            { data: newPayload, invoiceId: payload.invoiceId }
        );

        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getTemplate = async (payload: { userId: number; userType: string }) => {
    try {
        const resp: SuccessGenericResponse<ApiResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/invoice-templete`
        );
        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};

export const getDashboardData = async (payload: { userId: number; userType: string }) => {
    try {
        const resp: SuccessGenericResponse<DashboardApiResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/invoices/dashboard`
        );
        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};
export const statusUpdate = async (
    payload: statusPayload & { userId: number; userType: string }
) => {
    const reqbody = {
        status: payload.status,
    };
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.patch(
            `${payload.userType}/${payload.userId}/officeAndBusiness/invoices/${payload.id}`,
            reqbody
        );
        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};

export const getAllGuidelines = async (
    payload: getGuidelinePayload & { userId: number; userType: string }
) => {
    try {
        const resp: SuccessGenericResponse<DataResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/invoice-guideline/${payload.invoiceId}`
        );
        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};

export const updateGuideline = async (
    payload: guidelineRequest & { userId: number; userType: string }
) => {
    try {
        const newPayload = payload.data.map(item => {
            const newItem = { ...item };
            delete newItem.status;
            if (!newItem.sms) {
                delete newItem.templet.sms;
            }
            if (!newItem.email) {
                delete newItem.templet.email;
            }

            return newItem;
        });
        const resp: any = await ApiClient.put(
            `${payload.userType}/${payload.userId}/officeAndBusiness/invoice-guideline`,
            { data: newPayload, invoiceId: payload.invoiceId }
        );
        // const { data } = resp;
        return resp;
    } catch (err) {
        return false;
    }
};

export const updateGuideline2 = async ({ payload, userId, userType, invoiceId }: any) => {
    try {
        const resp: any = await ApiClient.put(
            `${userType}/${userId}/officeAndBusiness/invoice-guideline/update-guideline`,
            { data: payload.data, invoiceId }
        );
        // const { data } = resp;
        return resp;
    } catch (err) {
        return false;
    }
};

export const getPayentLink = async (
    payload: paymentlinkPayload & { userId: number; userType: string }
) => {
    const reqbody = { invoiceId: payload.invoiceId };
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/invoices/getLink`,
            reqbody
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getAllData = async (payload: getCustomers & { userId: number; userType: string }) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/invoice-customer`,
            {
                params: {
                    sort: payload.sort,
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    searchText: payload.searchText,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const addCustomer = async (payload: UserPayload & { userId: number; userType: string }) => {
    const reqbody = {
        name: payload.name,
        email: payload.email,
        phoneNumber: payload.phoneNumber,
        address: payload.address,
        trnNo: payload.trnNo,
        credentialId: payload.credentialId,
    };

    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/invoice-customer`,
            reqbody
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const updateCustomer = async (
    payload: UserPayload & { userId: number; userType: string }
) => {
    const reqbody = {
        name: payload.name,
        email: payload.email,
        phoneNumber: payload.phoneNumber,
        address: payload.address,
        trnNo: payload.trnNo,
        credentialId: payload.credentialId,
    };

    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/officeAndBusiness/invoice-customer/${payload.id}`,
            reqbody
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const deleteCustomer = async (
    payload: { id: number } & { userId: number; userType: string }
) => {
    // const reqbody = {
    //     name: payload.name,
    //     email: payload.email,
    //     phoneNumber: payload.phoneNumber,
    //     address: payload.address,
    //     trnNo: payload.trnNo,
    //     credentialId: payload.credentialId,
    // };
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/officeAndBusiness/invoice-customer/${payload.id}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const findAll = async (
    payload: { searchText: string } & { userId: number; userType: string }
) => {
    try {
        const resp: SuccessGenericResponse<corporateData> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/invoice-customer/all?searchText=${payload.searchText}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const findOne = async (payload: { id: number } & { userId: number; userType: string }) => {
    try {
        const resp: SuccessGenericResponse<getOneData> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/invoice-customer/details/${payload.id}`
        );
        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};

export const findCorporates = async (
    payload: { searchText: string } & { userId: number; userType: string }
) => {
    try {
        const resp: SuccessGenericResponse<corporateResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/invoice-customer/corporate?searchText=${payload.searchText}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const paymentLink = async (
    payload: any & { userId: number; userType: string; invoiceId?: number }
) => {
    try {
        const reqbody = {
            full_name: payload.full_name,
            email: payload.email,
            phone_number: payload.phone_number,
            expires_at: payload.expires_at * 60,
            amount: payload.amount,
            notification: payload.notification,
            invoiceId: payload.invoiceId,
            purpose_message: payload.purpose_message,
            // payment_link_image: payload.payment_link_image,
        };

        const resp = await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/payment-links/create-link`,
            reqbody
        );

        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};

export const getAllPaymentLinks = async (
    payload: getCustomers & { userId: number; userType: string }
) => {
    try {
        const resp: SuccessGenericResponse<OrderHistoryResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/payment-links/all`,
            {
                params: {
                    sort: payload.sort,
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    searchText: payload.searchText,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const resendPaymentLinkApi = async (payload: {
    userId: number;
    userType: string;
    paymentLinkId: number;
}) => {
    try {
        const resp: SuccessGenericResponse<OrderHistoryResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/payment-links/resend-link/${payload.paymentLinkId}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const uploadInvoiceApi = async (payload: {
    userId: number;
    userType: string;
    file: File;
}) => {
    try {
        const formData = new FormData();
        formData.append('file', payload.file);
     
        const resp: SuccessGenericResponse<UploadInvoiceResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/invoices/upload-invoice`,
            formData
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const updateSignerApi = async ({ userId, userType, payload }: any) => {
    try {
        const resp: SuccessGenericResponse<UploadInvoiceResponse> = await ApiClient.post(
            `${userType}/${userId}/officeAndBusiness/payment-links/send-agreement`,
            payload
        );

        return !!resp;
    } catch (err) {
        return false;
    }
};

export const getAgreementApi = async ({ userId, userType }: any) => {
    try {
        const resp: SuccessGenericResponse<GetAgreementRespnse> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/payment-links/get-agreement`
        );

        return resp?.data;
    } catch (err) {
        return false;
    }
};
