import { DropDown, SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

type IndianStatesResponse = {
    states: DropDown;
};

export const getIndianStatesApi = async () => {
    try {
        const resp: SuccessGenericResponse<IndianStatesResponse> = await ApiClient.get(
            'user/general/indian-states'
        );
        return resp.data?.states ?? [];
    } catch {
        return [];
    }
};
