import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    FinancialDocListingPayload,
    FinancialDocListingResponse,
    FinancialDocCreatePayload,
    FinancialDocCreateResponse,
    FinancialDocDeletePayload,
    FinancialDocUpdatePayload,
    ChequeBookListingPayload,
    ChequeBookListingResponse,
    SingleChequeBookPayload,
    SingleChequeBookResponse,
    CreateChequeBookPayload,
    CreateChequeBookResponse,
    ChequeBookUpdatePayload,
    ChequeBookDeletePayload,
    ChequeLeavesListingPayload,
    ChequeLeavesListingResponse,
    SingleChequeLeafPayload,
    SingleChequeLeafResponse,
    ChequeLeafDeletePayload,
    ChequeLeafUpdatePayload,
    userPayload,
    FinancialInfoResponse,
} from '../types/financials/index';

export const listFinancialDoc = async (payload: FinancialDocListingPayload) => {
    try {
        const res: SuccessGenericResponse<FinancialDocListingResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/financial-docs`,
            {
                params: {
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    searchText: payload.searchText,
                },
            }
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
export const createFinancialDoc = async (payload: FinancialDocCreatePayload) => {
    try {
        const res: SuccessGenericResponse<FinancialDocCreateResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/financial-docs`,
            payload
        );

        return res;
    } catch (error) {
        return false;
    }
};

export const updateFinancialDoc = async (payload: FinancialDocUpdatePayload) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/financial-docs/${payload.docId}`,
            payload
        );

        return resp;
    } catch (err) {
        return false;
    }
};

export const deleteFinancialDoc = async (payload: FinancialDocDeletePayload) => {
    try {
        const res: SuccessGenericResponse<any> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/financial-docs/${payload.docId}`
        );

        return res;
    } catch (error) {
        return false;
    }
};
export const listChequeBooks = async (payload: ChequeBookListingPayload) => {
    try {
        const res: SuccessGenericResponse<ChequeBookListingResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/cheque-books`,
            {
                params: {
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    searchText: payload.searchText,
                },
            }
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
export const AllChequeBooks = async (payload: userPayload) => {
    try {
        const res: SuccessGenericResponse<ChequeBookListingResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/cheque-books/all`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
export const getSingleChequeBook = async (payload: SingleChequeBookPayload) => {
    try {
        const res: SuccessGenericResponse<SingleChequeBookResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/cheque-books/${payload.chequeBookId}`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
export const createChequeBook = async (payload: CreateChequeBookPayload) => {
    try {
        const res: SuccessGenericResponse<CreateChequeBookResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/cheque-books`,
            payload
        );

        return res;
    } catch (error) {
        return false;
    }
};

export const updateChequeBook = async (payload: ChequeBookUpdatePayload) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/cheque-books/${payload.chequeBookId}`,
            payload
        );

        return resp;
    } catch (err) {
        return false;
    }
};

export const deleteChequeBook = async (payload: ChequeBookDeletePayload) => {
    try {
        const res: SuccessGenericResponse<any> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/cheque-books/${payload.chequeBookId}`
        );

        return res;
    } catch (error) {
        return false;
    }
};
export const listChequeLeaves = async (payload: ChequeLeavesListingPayload) => {
    try {
        const res: SuccessGenericResponse<ChequeLeavesListingResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/cheque-leaves`,
            {
                params: {
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    searchText: payload.searchText,
                    chequeBookId: payload.chequeBookId,
                },
            }
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
export const getSingleChequeLeaf = async (payload: SingleChequeLeafPayload) => {
    try {
        const res: SuccessGenericResponse<SingleChequeLeafResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/cheque-leaves/${payload.chequeLeafId}`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
export const createChequeLeaf = async (payload: CreateChequeBookPayload) => {
    try {
        const res: SuccessGenericResponse<CreateChequeBookResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/cheque-leaves`,
            payload
        );

        return res;
    } catch (error) {
        return false;
    }
};

export const updateChequeLeaf = async (payload: ChequeLeafUpdatePayload) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/cheque-leaves/${payload.chequeLeafId}`,
            payload
        );

        return resp;
    } catch (err) {
        return false;
    }
};

export const deleteChequeLeaf = async (payload: ChequeLeafDeletePayload) => {
    try {
        const res: SuccessGenericResponse<any> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/cheque-leaves/${payload.chequeLeafId}`
        );

        return res;
    } catch (error) {
        return false;
    }
};
export const getFinancialInfo = async (payload: userPayload) => {
    try {
        const res: SuccessGenericResponse<FinancialInfoResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/financial-docs/info`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
