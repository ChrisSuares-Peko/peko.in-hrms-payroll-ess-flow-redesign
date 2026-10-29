import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    ICategoryProductRequestPayload,
    ICategoryProductsResponse,
    IFindCategoryQuestionsResponse,
    IProductDetailsRequestPayload,
    IProductDetailsResponse,
    ISearchProductRequestPayload,
    ISearchProductResponse,
    ISoftwareCategoryListResponse,
    IFindQuestionsRequestPayload,
    ISubmitAnswersRequestPayload,
    IFindGeneralQuestionsResponse,
    IGetAssistanceRequestPayload,
    IGetAssistanceResponse,
    IFetchOrderDetailsResponse,
    IFetchOrderDetailsPayload,
    ISubmitAnswersResponse,
    IGetRecommandationRequestPayload,
    IGetRecommandationResponse,
    ICancelPlanPayload,
    IFetchOneOrderPayload,
    IFetchOneOrderResponse,
    IRfpCategoryListResponse,
} from '../types';

export const fetchParentCategories = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<ISoftwareCategoryListResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/softwaresV2/categories`
        );
        const { data } = resp;
        return data;
    } catch (error) {
        return false;
    }
};

export const fetchRfpCategories = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<IRfpCategoryListResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/softwaresV2/rfp-categories`
        );
        const { data } = resp;
        return data;
    } catch (error) {
        return false;
    }
};

export const fetchParentCategoryProducts = async (payload: ICategoryProductRequestPayload) => {
    try {
        const resp: SuccessGenericResponse<ICategoryProductsResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/softwaresV2/categories/products/${payload.parentCategory}`,
            {
                params: {
                    page: payload.page,
                    limit: payload.limit,
                    filter: payload.filter,
                    sortBy: payload.sortBy,
                    search: payload.search,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (error: any) {
        return false;
    }
};

export const fetchSearchProducts = async (payload: ISearchProductRequestPayload) => {
    try {
        const { userType, userId, query, parentCategorySlug } = payload;

        const baseUrl = `${userType}/${userId}/purchase/softwaresV2/search`;

        const params = new URLSearchParams();
        params.set('query', query);

        if (parentCategorySlug) {
            params.set('parentCategorySlug', parentCategorySlug);
        }

        const resp: SuccessGenericResponse<ISearchProductResponse> = await ApiClient.get(
            `${baseUrl}?${params.toString()}`
        );

        return resp.data;
    } catch (error: any) {
        return false;
    }
};

export const fetchProductDetails = async (payload: IProductDetailsRequestPayload) => {
    try {
        const resp: SuccessGenericResponse<IProductDetailsResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/softwaresV2/product/details/${encodeURIComponent(
                payload.weburl
            )}`
        );
        return resp.data;
    } catch (error: any) {
        return false;
    }
};

export const fetchPopularProducts = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<ICategoryProductsResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/softwaresV2/products/popular`
        );

        return resp.data;
    } catch (error) {
        return false;
    }
};

export const fetchGeneralQuestions = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<IFindGeneralQuestionsResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/softwaresV2/questions/general`
        );

        return resp.data;
    } catch (error) {
        return false;
    }
};

export const fetchCategoryQuestions = async (payload: IFindQuestionsRequestPayload) => {
    try {
        const resp: SuccessGenericResponse<IFindCategoryQuestionsResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/softwaresV2/questions/${encodeURIComponent(
                payload.parentCategory
            )}`
        );

        return resp.data;
    } catch (error) {
        return false;
    }
};

export const submitAnswers = async (payload: ISubmitAnswersRequestPayload) => {
    try {
        const resp: SuccessGenericResponse<ISubmitAnswersResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/purchase/softwaresV2/answers`,
            payload.body
        );

        return resp;
    } catch (error) {
        return false;
    }
};
// -----------------------------------------
export const getRecommandations = async (payload: IGetRecommandationRequestPayload) => {
    try {
        const { userType, userId, toolkitId } = payload;

        const resp: SuccessGenericResponse<IGetRecommandationResponse> = await ApiClient.get(
            `${userType}/${userId}/purchase/softwaresV2/recommandations/${encodeURIComponent(toolkitId)}`
        );

        return resp;
    } catch (error) {
        return false;
    }
};

export const getAssistance = async (payload: IGetAssistanceRequestPayload) => {
    try {
        const resp: SuccessGenericResponse<IGetAssistanceResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/softwaresV2/purchaseAssistance/${encodeURIComponent(
                payload.productName
            )}`
        );
        return resp;
    } catch (error) {
        return false;
    }
};

export const fetchOrderDetails = async (payload: IFetchOrderDetailsPayload) => {
    try {
        const { userType, userId, from, to, searchText, page, limit } = payload;

        const baseUrl = `${userType}/${userId}/purchase/softwaresV2/orderDetails`;

        const params = new URLSearchParams();

        if (from) {
            params.set('from', from);
        }

        if (to) {
            params.set('to', to);
        }
        params.set('searchText', searchText);
        params.set('page', String(page));
        params.set('limit', String(limit));

        const resp: SuccessGenericResponse<IFetchOrderDetailsResponse> = await ApiClient.get(
            `${baseUrl}?${params.toString()}`
        );
        return resp;
    } catch (error) {
        return false;
    }
};

export const fetchOneOrder = async (payload: IFetchOneOrderPayload) => {
    try {
        const { userType, userId, orderId } = payload;
        const resp: SuccessGenericResponse<IFetchOneOrderResponse> = await ApiClient.get(
            `${userType}/${userId}/purchase/softwaresV2/orderDetails/${orderId}`
        );
        return resp.data;
    } catch (error) {
        return false;
    }
};

export const cancelPlan = async (payload: ICancelPlanPayload) => {
    try {
        const { userType, userId, orderId } = payload;
        // when the backend api updates the response type also need to be updated
        const resp: SuccessGenericResponse<null> = await ApiClient.post(
            `${userType}/${userId}/purchase/softwaresV2/cancelPlan`,
            { orderId }
        );
        return resp;
    } catch (error) {
        return false;
    }
};