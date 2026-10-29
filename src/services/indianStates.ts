import { DropDown, SuccessGenericResponse } from '@customtypes/general';

import { ApiClient } from './config';

type IndianStatesResponse = {
    states: DropDown;
};

export const getIndianStates = async (): Promise<DropDown> => {
    try {
        const resp: SuccessGenericResponse<IndianStatesResponse> = await ApiClient.get(
            'user/general/indian-states'
        );
        return resp.data?.states ?? [];
    } catch {
        return [];
    }
};
