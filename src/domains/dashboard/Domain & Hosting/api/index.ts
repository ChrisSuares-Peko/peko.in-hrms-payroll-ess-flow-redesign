import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    AddToCartPayload,
    CommonPayload,
    DeletePlanPayload,
    DomainSearchPayload,
    GetHostingPlansPayload,
    LoginCustomerPayload,
    OrderHistoryPayload,
    OrderHistoryResponse,
    RegisterCustomerPayload,
    UpdateCartDetailsPayload,
    UpdateCartPayload,
} from '../types/index';

// ─── Domain & Hosting ─────────────────────────────────────────────────────────

export const getHostingServices = async (payload: CommonPayload) => {
    try {
        const res: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/domain-and-hosting/services`
        );
        return res.data;
    } catch (error) {
        return false;
    }
};

export const getHostingPlansByType = async (payload: GetHostingPlansPayload) => {
    const { userId, userType, planType, serverLocation } = payload;
    try {
        const res: SuccessGenericResponse<any> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/domain-and-hosting/services/plans`,
            { params: { planType, ...(serverLocation ? { serverLocation } : {}) } }
        );
        return res.data;
    } catch (error) {
        return false;
    }
};

export const searchDomains = async (payload: DomainSearchPayload) => {
    try {
        const res: SuccessGenericResponse<any> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/domain-and-hosting/search`,
            {
                domainName: payload.domainName,
            }
        );
        return res.data;
    } catch (error) {
        return false;
    }
};

export const registerCustomer = async (payload: RegisterCustomerPayload) => {
    const { userId, userType, ...body } = payload;
    try {
        const res: SuccessGenericResponse<any> = await ApiClient.post(
            `${userType}/${userId}/officeAndBusiness/domain-and-hosting/customer/register`,
            body
        );
        return res.data;
    } catch (error) {
        return false;
    }
};

export const loginCustomer = async (payload: LoginCustomerPayload) => {
    const { userId, userType, ...body } = payload;
    try {
        const res: SuccessGenericResponse<any> = await ApiClient.post(
            `${userType}/${userId}/officeAndBusiness/domain-and-hosting/customer/details`,
            body
        );
        return res.data;
    } catch (error) {
        return false;
    }
};

// ─── Service Cart ─────────────────────────────────────────────────────────────

export const getCart = async (payload: CommonPayload & { isCustomerFetch?: boolean }) => {
    try {
        const query = payload.isCustomerFetch ? '?isCustomerFetch=true' : '';
        const res: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/service-cart${query}`
        );
        return res.data;
    } catch (error) {
        return false;
    }
};

export const addToCart = async (payload: AddToCartPayload) => {
    const { userId, userType, ...body } = payload;
    try {
        const res: SuccessGenericResponse<any> = await ApiClient.post(
            `${userType}/${userId}/officeAndBusiness/service-cart/add`,
            { service: 'domainAndHosting', ...body }
        );
        return res.data;
    } catch (error) {
        return null;
    }
};

export const updateCart = async (payload: UpdateCartPayload) => {
    const { userId, userType, ...body } = payload;
    try {
        const res: SuccessGenericResponse<any> = await ApiClient.put(
            `${userType}/${userId}/officeAndBusiness/service-cart/update`,
            { service: 'domainAndHosting', ...body }
        );
        return res.data;
    } catch (error) {
        return false;
    }
};

export const removeFromCart = async (
    payload: CommonPayload & { productId: string; planId?: string | null; billingCycle?: number; productName?: string | null; itemType?: string | null }
) => {
    const { userId, userType, productId, planId, billingCycle, productName, itemType } = payload;
    const params = new URLSearchParams({ productId });
    if (planId) params.set('planId', planId);
    if (billingCycle != null) params.set('billingCycle', String(billingCycle));
    if (productName) params.set('productName', productName);
    if (itemType) params.set('itemType', itemType);
    try {
        const res: SuccessGenericResponse<any> = await ApiClient.delete(
            `${userType}/${userId}/officeAndBusiness/service-cart/remove?${params.toString()}`
        );
        return res.data;
    } catch (error) {
        return false;
    }
};

export const clearCart = async (payload: CommonPayload) => {
    try {
        const res: SuccessGenericResponse<any> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/officeAndBusiness/service-cart/clear`
        );
        return res.data;
    } catch (error) {
        return false;
    }
};

// ─── Orders ───────────────────────────────────────────────────────────────────

export const getOrderHistory = async (payload: OrderHistoryPayload) => {
    const { userId, userType, ...params } = payload;
    try {
        const res: SuccessGenericResponse<OrderHistoryResponse> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/domain-and-hosting/orders`,
            { params }
        );
        return res.data;
    } catch (error) {
        return false;
    }
};

export const downloadOrderInvoice = async (payload: CommonPayload & { corporateTxnId: string }) => {
    const { userId, userType, corporateTxnId } = payload;
    try {
        const res: SuccessGenericResponse<{ filename: string; pdfBuffer: string }> =
            await ApiClient.get(
                `${userType}/${userId}/officeAndBusiness/domain-and-hosting/orders/${corporateTxnId}/invoice`
            );
        return res.data;
    } catch (error) {
        return false;
    }
};

export const deletePlan = async (payload: DeletePlanPayload) => {
    const { userId, userType, ...body } = payload;
    try {
        const res: SuccessGenericResponse<any> = await ApiClient.post(
            `${userType}/${userId}/officeAndBusiness/domain-and-hosting/plan/delete`,
            body
        );
        return res.data;
    } catch (error) {
        return false;
    }
};

export const generateSsoLogin = async (payload: CommonPayload) => {
    const { userId, userType } = payload;
    try {
        const res: SuccessGenericResponse<{ redirectUrl: string }> = await ApiClient.post(
            `${userType}/${userId}/officeAndBusiness/domain-and-hosting/customer/sso-login`
        );
        return res.data;
    } catch (error) {
        return false;
    }
};

export const updateCartItemDetails = async (payload: UpdateCartDetailsPayload) => {
    const { userId, userType, ...body } = payload;
    try {
        const res: SuccessGenericResponse<any> = await ApiClient.put(
            `${userType}/${userId}/officeAndBusiness/service-cart/update-details`,
            { service: 'domainAndHosting', ...body }
        );
        return res.data;
    } catch (error) {
        return false;
    }
};
