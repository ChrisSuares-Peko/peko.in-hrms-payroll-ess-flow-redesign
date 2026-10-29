import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    LossOfPayRequestBase,
    LossOfPaySheet,
    SaveLossOfPayPayload,
} from '../../../types/salaryProfileTypes/lossOfPayTypes';

export const getLossOfPaySheet = async (payload: LossOfPayRequestBase) => {
    try {
        const resp: SuccessGenericResponse<LossOfPaySheet> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/loss-of-pay`,
            { params: { month: payload.month, year: payload.year } }
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const saveLossOfPaySheet = async (payload: SaveLossOfPayPayload) => {
    try {
        const resp: SuccessGenericResponse<LossOfPaySheet> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/payroll/loss-of-pay`,
            { month: payload.month, year: payload.year, entries: payload.entries }
        );
        return resp;
    } catch (err) {
        return false;
    }
};
