import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    ICategoryListingResponse,
    ICategoryResponse,
    bussinesDocsCategoryListing,
    getBussinesDocsCategory,
} from '../types/type';

export const getBusinessDocs = async (payload: getBussinesDocsCategory) => {
    try {
        const res: SuccessGenericResponse<ICategoryResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/edocs/categories`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const categoryListing = async (payload: bussinesDocsCategoryListing) => {
    try {
        const res: SuccessGenericResponse<ICategoryListingResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/edocs/documents?categoryName=${encodeURIComponent(payload.category)}&searchText=${payload.searchKey || ''}&page=${payload.page}&itemsPerPage=${payload.pageSize}&sort=${payload.sortType}&sortField=${payload.sortBy}`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
