import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { BulkEmployeeUploadResponse, excelTemplatePayload } from '../../types/types';

export const GetForm24ExcelTemplate = async (payload: excelTemplatePayload) => {
    try {
        const resp = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/reports/form24q-template`
        );

        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};

export const UploadForm24Api = async (payload: {
    file: File;
    userId: number;
    userType: string;
    quarter: string;
}) => {
    // Create FormData object
    const formData = new FormData();
    formData.append('file', payload.file, payload.file.name); // Append the file with its name
    formData.append('quarter', payload.quarter);

    try {
        const resp: SuccessGenericResponse<BulkEmployeeUploadResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/payroll/reports/form24q`,
            formData // Pass FormData as payload
        );

        const { data } = resp;
        console.log('Response from Form24 API:', data);

        return data;
    } catch (err) {
        return false;
    }
};

export const GetForm24Forms = async (payload: { userId: number; userType: string; year?: string; search?: string }) => {
    try {
        const queryParams: Record<string, string> = {};
        if (payload.year) queryParams.year = payload.year;
        if (payload.search) queryParams.search = payload.search;

        const resp = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/reports/form24q/all`,
            { params: queryParams }
        );
        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};
