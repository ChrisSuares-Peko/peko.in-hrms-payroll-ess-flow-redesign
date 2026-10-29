import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    NewProduct,
    Product,
    getAllFilter,
    responseData,
    updateStatus,
    activeResponse,
    CategoryData,
    VenderData,
    search,
    productImageResp,
    ProductBulkExcelTemplatePayload,
    ProductBulkExcelTemplateResponse,
    BulkProductsUploadPayload,
    BulkProductsUploadResponse,
} from '../types/products';

export const getAllData = async (payload: UserPayload & getAllFilter) => {
    try {
        const resp: SuccessGenericResponse<responseData> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/products/all`,
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

export const createProduct = async (payload: UserPayload & NewProduct) => {
    try {
        const resp: SuccessGenericResponse<Product> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/purchase/products`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const updateProduct = async (payload: UserPayload & NewProduct) => {
    try {
        const resp: SuccessGenericResponse<Product> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/purchase/products/${payload.id}`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getUpdateStatus = async (payload: UserPayload & updateStatus) => {
    try {
        const resp: SuccessGenericResponse<activeResponse> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/purchase/products/updateStatus/${payload.prodId}`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const deleteProduct = async (payload: UserPayload & { id: number }) => {
    try {
        const resp: SuccessGenericResponse<activeResponse> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/purchase/products/${payload.id}`
        );
        // const { data } = resp;
        return resp;
    } catch (err) {
        return false;
    }
};
export const getProductImages = async (payload: UserPayload & { id: number }) => {
    try {
        const resp: SuccessGenericResponse<productImageResp> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/products/fetchAllPhotos/${payload.id}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getCategories = async (payload: UserPayload & search) => {
    try {
        const resp: SuccessGenericResponse<CategoryData> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/products/fetchAllCategories?searchText=${payload.searchCategories}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getVendors = async (payload: UserPayload & search) => {
    try {
        const resp: SuccessGenericResponse<VenderData> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/products/vendors?searchText=${payload.searchVendors}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const ProductBulkExcelTemplateApi = async (payload: ProductBulkExcelTemplatePayload) => {
    try {
        const resp: SuccessGenericResponse<ProductBulkExcelTemplateResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/products/bulk-template`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const BulkProductsExcelUploadApi = async (payload: BulkProductsUploadPayload) => {
    try {
        // Create FormData object
        const formData = new FormData();
        formData.append('file', payload.file, payload.file.name);
        const resp: SuccessGenericResponse<BulkProductsUploadResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/purchase/products/bulk-excel-upload`,
            formData
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const BulkProductsJSONUploadApi = async (payload: BulkProductsUploadPayload) => {
    try {
        // Create FormData object
        const resp: SuccessGenericResponse<BulkProductsUploadResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/purchase/products/bulk-json-upload`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
