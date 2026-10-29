import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

export interface ServiceConfig {
    id: string;
    name: string;
    description: string;
    price: number;
    isActive: boolean;
}

export interface IncorporationConfig {
    incorporationFee: number;
    estimatedTime: string;
    steps: string[];
    services: ServiceConfig[];
}

export const fetchIncorporationConfig = async (payload: { userId: number; userType: string }) => {
    try {
        const resp: SuccessGenericResponse<IncorporationConfig> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/company-incorporation/config`
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const saveIncorporationConfig = async (
    payload: { userId: number; userType: string } & Pick<
        IncorporationConfig,
        'incorporationFee' | 'services'
    >
) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<IncorporationConfig> = await ApiClient.put(
            `${userType}/${userId}/officeAndBusiness/company-incorporation/config`,
            body
        );
        return resp.data;
    } catch {
        return false;
    }
};
