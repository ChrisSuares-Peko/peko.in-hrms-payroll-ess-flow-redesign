import { ApiClient } from '@src/services/config';

export const getDocument = async (payload: any) => {
    try {
        const res: any = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/document?key=${payload.key}`
        );

        return res.data;
    } catch (error) {
        return false;
    }
};
