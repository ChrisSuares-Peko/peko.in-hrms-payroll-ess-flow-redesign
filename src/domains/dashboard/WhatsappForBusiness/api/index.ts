import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { userPayload } from '../../plans/types';
import { SsoResponse, WhatsappDetailsResponse } from '../types/index';
import {
    ActiveSubscriptionResponse,
    botBuilderAmount,
    businessProfile,
    downloadInvoicePayload,
    downloadResponse,
    GenerateURLResponse,
    ISubscriptionDetailsPayload,
    PlanDetailsResponse,
    Project,
    // ProjectBillingResponse,
    projectPayload,
    projectPayloadWithId,
    // projectPayloadWithIds,
    shopifyIntegrationAmount,
    SubscriptionDetailsResponse,
    // updateWccPayload,
} from '../types/types';

export const getPlanDetails = async (payload: UserPayload) => {
    try {
        const endpoint = `${payload.userType}/${payload.userId}/officeAndBusiness/whatsapp-business/planFamilies`;
        const resp: SuccessGenericResponse<PlanDetailsResponse> = await ApiClient.get(endpoint);
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const getAllProjects = async (payload: UserPayload) => {
    try {
        const endpoint = `${payload.userType}/${payload.userId}/officeAndBusiness/whatsapp-business/projects`;
        const resp: SuccessGenericResponse<Project[]> = await ApiClient.get(endpoint);
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const checkProjectExist = async (payload: UserPayload) => {
    try {
        const endpoint = `${payload.userType}/${payload.userId}/officeAndBusiness/whatsapp-business/checkProjectExist`;
        const resp: SuccessGenericResponse<{}> = await ApiClient.post(endpoint);
        return resp;
    } catch (err) {
        return false;
    }
};
export const createProjectAPI = async (payload: projectPayload) => {
    try {
        const endpoint = `${payload.userType}/${payload.userId}/officeAndBusiness/whatsapp-business/createProjects`;
        const resp: SuccessGenericResponse<Project> = await ApiClient.post(endpoint, {
            name: payload.projectName,
        });
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const stopBillingProject = async (payload: projectPayloadWithId) => {
    try {
        const endpoint = `${payload.userType}/${payload.userId}/officeAndBusiness/whatsapp-business/stopPlanBilling`;
        const resp: SuccessGenericResponse<{}> = await ApiClient.patch(endpoint, {
            id: payload.id,
        });
        return resp;
    } catch (err) {
        return false;
    }
};
// export const stopWhatsAppBilling = async (payload: projectPayloadWithIds) => {
//     try {
//         const endpoint = `${payload.userType}/${payload.userId}/officeAndBusiness/whatsapp-business/stopWhatsAppBilling`;
//         const resp: SuccessGenericResponse<ProjectBillingResponse[]> =
//             await ApiClient.patch(endpoint);
//         const { status } = resp;
//         return status;
//     } catch (err) {
//         return false;
//     }
// };
export const reactivateBillingProject = async (payload: projectPayloadWithId) => {
    try {
        const endpoint = `${payload.userType}/${payload.userId}/officeAndBusiness/whatsapp-business/reactivateProjectBilling`;
        const resp: SuccessGenericResponse<{}> = await ApiClient.patch(endpoint, {
            id: payload.id,
        });
        return resp;
    } catch (err) {
        return false;
    }
};
export const createBusinessProfile = async (payload: UserPayload) => {
    try {
        const endpoint = `${payload.userType}/${payload.userId}/officeAndBusiness/whatsapp-business/businessProfile`;
        const resp: SuccessGenericResponse<businessProfile> = await ApiClient.post(endpoint);
        return resp;
    } catch (err) {
        return false;
    }
};
export const generateEmbeddedSignupURL = async (
    payload: projectPayloadWithId
): Promise<GenerateURLResponse | false> => {
    try {
        const endpoint = `${payload.userType}/${payload.userId}/officeAndBusiness/whatsapp-business/generateEmbeddedSignupURL`;

        // Here we specify that the response's data will be of type GenerateURLResponse
        const resp: SuccessGenericResponse<GenerateURLResponse> = await ApiClient.post(endpoint, {
            id: payload.id,
        });

        return resp.data; // This will be of type GenerateURLResponse
    } catch (err) {
        return false;
    }
};
// export const updateWccCredit = async (payload: updateWccPayload) => {
//     try {
//         const endpoint = `${payload.userType}/${payload.userId}/officeAndBusiness/whatsapp-business/businessProfile`;
//         const resp: SuccessGenericResponse<Project> = await ApiClient.patch(endpoint, {
//             id: payload.id,
//             amount: payload.amount,
//             action: 'ADD',
//         });
//         return resp;
//     } catch (err) {
//         return false;
//     }
// };

export const ssoLoginApi = async (payload: UserPayload) => {
    try {
        const endpoint = `${payload.userType}/${payload.userId}/officeAndBusiness/whatsapp-business/ssoLogin`;
        const resp: SuccessGenericResponse<SsoResponse> = await ApiClient.get(endpoint);
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const activeSubscriptionApi = async (payload: UserPayload & { isExpiry?: boolean }) => {
    try {
        const params: Record<string, any> = {};

        if (payload.isExpiry) {
            params.isExpiry = payload.isExpiry;
        }

        const endpoint = `${payload.userType}/${payload.userId}/officeAndBusiness/whatsapp-business/activeSubscription`;
        const resp: SuccessGenericResponse<ActiveSubscriptionResponse> = await ApiClient.get(
            endpoint,
            { params }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getPurchaseDetailsApi = async ({
    accessKey,
    userId,
    userType,
}: ISubscriptionDetailsPayload & UserPayload) => {
    try {
        const params = {
            accessKey,
        };
        const res: SuccessGenericResponse<SubscriptionDetailsResponse> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/whatsapp-business/plans`,
            { params }
        );
        const { data } = res;
        return data;
    } catch (err) {
        return false;
    }
};

export const getBotBuilderAmount = async (payload: UserPayload) => {
    try {
        const endpoint = `${payload.userType}/${payload.userId}/officeAndBusiness/whatsapp-business/getBotBuilderAmount`;
        const resp: SuccessGenericResponse<botBuilderAmount> = await ApiClient.get(endpoint);
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const activeBotBuilderApi = async (payload: UserPayload & { isExpiry?: boolean }) => {
    try {
        const params: Record<string, any> = {};

        if (payload.isExpiry) {
            params.isExpiry = payload.isExpiry;
        }
        const endpoint = `${payload.userType}/${payload.userId}/officeAndBusiness/whatsapp-business/activeBotBuilder`;
        const resp: SuccessGenericResponse<ActiveSubscriptionResponse> = await ApiClient.get(
            endpoint,
            { params }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const stopBotBuilderBilling = async (payload: projectPayloadWithId) => {
    try {
        const endpoint = `${payload.userType}/${payload.userId}/officeAndBusiness/whatsapp-business/stopBotBuilder`;
        const resp: SuccessGenericResponse<{}> = await ApiClient.patch(endpoint, {
            id: payload.id,
        });
        return resp;
    } catch (err) {
        return false;
    }
};

export const getShopifyIntegrationAmount = async (payload: UserPayload) => {
    try {
        const endpoint = `${payload.userType}/${payload.userId}/officeAndBusiness/whatsapp-business/getShopifyIntegrationAmount`;
        const resp: SuccessGenericResponse<shopifyIntegrationAmount> =
            await ApiClient.get(endpoint);
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const activeShopifyIntegrationApi = async (
    payload: UserPayload & { isExpiry?: boolean }
) => {
    try {
        const params: Record<string, any> = {};

        if (payload.isExpiry) {
            params.isExpiry = payload.isExpiry;
        }
        const endpoint = `${payload.userType}/${payload.userId}/officeAndBusiness/whatsapp-business/activeShopifyIntegration`;
        const resp: SuccessGenericResponse<ActiveSubscriptionResponse> = await ApiClient.get(
            endpoint,
            { params }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const stopShopifyIntegrationBilling = async (payload: projectPayloadWithId) => {
    try {
        const endpoint = `${payload.userType}/${payload.userId}/officeAndBusiness/whatsapp-business/stopShopifyIntegration`;
        const resp: SuccessGenericResponse<{}> = await ApiClient.patch(endpoint, {
            id: payload.id,
        });
        return resp;
    } catch (err) {
        return false;
    }
};

export const downloadInvoice = async (payload: downloadInvoicePayload) => {
    try {
        const res: SuccessGenericResponse<downloadResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/transactions/subscriptionOrdersDownload/${payload.transactionID}/${payload.type}`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const fetchWhatsappDetails = async (
    payload: userPayload
): Promise<WhatsappDetailsResponse | false> => {
    try {
        const res: SuccessGenericResponse<WhatsappDetailsResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/whatsapp-business/last-whatsapp-subscription`
        );

        const { data } = res;

        return data;
    } catch (error) {
        return false;
    }
};

export const initializeBundledWhatsAppProject = async (
    payload: userPayload
): Promise<{ initialized: boolean; projectId?: string } | false> => {
    try {
        const res: SuccessGenericResponse<{ initialized: boolean; projectId?: string }> =
            await ApiClient.post(
                `${payload.userType}/${payload.userId}/payment-gateway/subscriptions/whatsapp-bundle/init`
            );
        return res.data;
    } catch (error) {
        return false;
    }
};
