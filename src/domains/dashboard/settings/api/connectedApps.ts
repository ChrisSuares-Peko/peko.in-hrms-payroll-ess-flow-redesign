import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { ConnectedApp, ConnectedAppsResponse } from '../types/connectedApps';

export const getConnectedApps = async (): Promise<ConnectedApp[] | false> => {
    try {
        const resp: SuccessGenericResponse<ConnectedAppsResponse> =
            await ApiClient.get('user/consents');
        return resp.data.apps;
    } catch (err) {
        return false;
    }
};

export const revokeConnectedApp = async (id: number) => {
    try {
        const res: SuccessGenericResponse<{}> = await ApiClient.delete(`user/consents/${id}`);
        return res;
    } catch (err) {
        return false;
    }
};
