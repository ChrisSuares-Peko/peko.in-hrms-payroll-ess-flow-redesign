import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    getAttestationCategoriesPayload,
    deleteCategoryPayload,
    // FileBufferRequestPayload,
    activeResponse,
    AttestationCategoryResponse,
    createCategoryPayload,
    AttestationCategoryData,
    updateCategoryPayload,
    FileBufferRequestPayload,
} from '../types/attestationTypes';
/**
 * Fetch all attestation categories.
 */

export const getAllAttestationCategories = async (
    payload: UserPayload & getAttestationCategoriesPayload
) => {
    try {
        const resp: SuccessGenericResponse<AttestationCategoryResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/attestation/attestation-categories`,
            {
                params: {
                    sort: payload.sort,
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    searchText: payload.searchText,
                    sortField: payload.sortField,
                    from: payload.from,
                    to: payload.to,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

/**
 * Delete an attestation category.
 */
export const deleteAttestationCategory = async (
    payload: deleteCategoryPayload
): Promise<activeResponse | false> => {
    try {
        const resp: activeResponse = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/officeAndBusiness/attestation/attestation-category/${payload.categoryId}`
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const getCountriesAPI = async () => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.get(
            `/user/general/attestation/countries`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

/**
 * Create a new attestation category.
 */
export const createAttestationCategory = async (
    payload: createCategoryPayload & UserPayload
): Promise<SuccessGenericResponse<AttestationCategoryData> | false> => {
    try {
        const resp: SuccessGenericResponse<AttestationCategoryData> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/attestation/attestation-category`,
            {
                countryCode: payload.countryCode,
                label: payload.label,
                value: payload.value,
                price: payload.price,
                country: payload.country,
            }
        );
        return resp;
    } catch (err) {
        return false;
    }
};
export const updateAttestationCategory = async (
    payload: updateCategoryPayload & UserPayload
): Promise<SuccessGenericResponse<AttestationCategoryData> | false> => {
    try {
        const resp: SuccessGenericResponse<AttestationCategoryData> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/officeAndBusiness/attestation/attestation-category/${payload.id}`,
            {
                countryCode: payload.countryCode,
                label: payload.label,
                value: payload.value,
                price: payload.price,
                country: payload.country,
            }
        );
        return resp;
    } catch (err) {
        return false;
    }
};

/**
 * Download reports for attestation categories in various formats (Excel, CSV, PDF).
 */
export const getAttestationCategoryReport = async (
    payload: FileBufferRequestPayload & UserPayload
): Promise<CommonFileBuffer | false> => {
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/attestation/attestation-categories/${payload.type}`,
            {
                params: {
                    sort: payload.sort,
                    sortField: payload.sortField,
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    searchText: payload.searchText,
                    from: payload.from,
                    to: payload.to,
                },
            }
        );
        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};
