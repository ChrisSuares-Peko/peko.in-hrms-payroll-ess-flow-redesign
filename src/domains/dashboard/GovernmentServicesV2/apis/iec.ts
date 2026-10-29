import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

// Import Export Code's own API functions — kept separate from apis/index.ts (Trademark
// Registration + shared catalog/business calls) and apis/objection.ts, mirroring
// components/iec/'s own folder. Backed by purchase's
// controllers/corporate/govtServicesIecV2.js.

// Filing is a direct SmartForm submission, same as Trademark Registration/Objection — no OTP/email
// confirmation step. goods/services are sent pre-split (doc §4.2 "Split Goods and Services") since
// the page already has the live goods/services lists from getIecDropdownsApi.
export interface SubmitIecFilingPayload {
    businessApplicationId: string;
    entityType: string;
    salutation: string;
    authorizedPersonId: string;
    authorizedPerson: string;
    preferredSectors: string[];
    importDetails: string[];
    exportDetails: string[];
    importGoods: string[];
    importServices: string[];
    exportGoods: string[];
    exportServices: string[];
}

export const submitIecFilingApi = async (
    userId: string | number,
    userType: string,
    applicationRowId: number,
    formData: SubmitIecFilingPayload
): Promise<{ applicationId?: number; message: string } | null> => {
    try {
        const resp: SuccessGenericResponse<{ applicationId?: number }> = await ApiClient.post(
            `${userType}/${userId}/purchase/govt-services/v2/iec/filing`,
            { applicationRowId, formData }
        );
        return resp.data ? { ...resp.data, message: resp.message } : null;
    } catch (err) {
        const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        return message ? { message } : null;
    }
};

// Doc §4.3/§15's "Load Filing Status" — operational status records for the read-only Overview.
// Empty array means "No Status Available"; never invent stage names client-side.
export interface IecFilingStatusEntry {
    label: string;
    completedOn: string | null;
}

export const getIecFilingStatusApi = async (
    userId: string | number,
    userType: string,
    applicationRowId: number
): Promise<IecFilingStatusEntry[]> => {
    try {
        const resp: SuccessGenericResponse<{ status: IecFilingStatusEntry[] }> = await ApiClient.get(
            `${userType}/${userId}/purchase/govt-services/v2/iec/filing-status`,
            { params: { applicationRowId } }
        );
        return resp.data?.status ?? [];
    } catch {
        return [];
    }
};

// Dropdowns API (service_id=11, operation=iec_details) — the single combined (goods + services)
// list behind both Import Details and Export Details, pulled live from the vendor. Backed by
// purchase's getIecDropdowns.
export interface IecDropdownOptions {
    goods: string[];
    services: string[];
}

export const getIecDropdownsApi = async (
    userId: string | number,
    userType: string
): Promise<IecDropdownOptions | null> => {
    try {
        const resp: SuccessGenericResponse<IecDropdownOptions> = await ApiClient.get(
            `${userType}/${userId}/purchase/govt-services/v2/iec/dropdowns`
        );
        return resp.data ?? null;
    } catch {
        return null;
    }
};
