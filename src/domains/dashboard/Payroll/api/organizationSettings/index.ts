import { isCancel } from 'axios';

import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    AllSalaryComponentListResponse,
    BankDetailsType,
    BankListResponse,
    CompanyUserData,
    createDeductionComponentPayload,
    createDeductionComponentResponse,
    createSalaryComponentPayload,
    createSalaryComponentResponse,
    DeductionComponentListResponse,
    existingOrganizationSettings,
    GetBankDetailsType,
    GetCompanyProfileType,
    GetDeductionComponent,
    GetPayrollSettingsType,
    GetSalaryComponent,
    PayrollSettingsType,
    SalaryComponentListResponse,
    updateDeductionComponentPayload,
    updateSalaryCompoentPayload,
} from '../../types/organizationSettings';

export const companyProfileApi = async (
    payload: GetCompanyProfileType & { userId: number; userType: string }
) => {
    try {
        const { userId, userType, ...restPayload } = payload;
        const resp: SuccessGenericResponse<GetCompanyProfileType> = await ApiClient.post(
            `${userType}/${userId}/payroll/organization-settings/company-profile`,
            restPayload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const payrollSettingsApi = async (
    payload: GetPayrollSettingsType & { userId: number; userType: string }
) => {
    try {
        const { userId, userType, ...restPayload } = payload;
        const resp: SuccessGenericResponse<PayrollSettingsType> = await ApiClient.post(
            `${userType}/${userId}/payroll/organization-settings/payroll-settings`,
            restPayload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const skipDashboard = async (payload: {
    isSkipDasboard: boolean;
    userId: number;
    userType: string;
}) => {
    try {
        const { userId, userType, ...restPayload } = payload;
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${userType}/${userId}/payroll/dashBoard/dashboardStatus`,
            restPayload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const bankDetailsApi = async (
    payload: GetBankDetailsType & { userId: number; userType: string }
) => {
    try {
        const { userId, userType, ...restPayload } = payload;
        const resp: SuccessGenericResponse<BankDetailsType> = await ApiClient.post(
            `${userType}/${userId}/payroll/organization-settings/bank-details`,
            restPayload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getOrganizationSettingsApi = async (payload: UserPayload) => {
    try {
        const { userId, userType } = payload;
        const resp: SuccessGenericResponse<existingOrganizationSettings> = await ApiClient.get(
            `${userType}/${userId}/payroll/organization-settings`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        // PROTOTYPE-SETUP: requests the tokenless prototype cancels on purpose are not logged as errors.
        if (!isCancel(err)) console.error(err, 'error');
        return false;
    }
};
export const getCorporateorporateDetails = async (payload: UserPayload) => {
    try {
        const { userId, userType } = payload;
        const resp: SuccessGenericResponse<CompanyUserData> = await ApiClient.get(
            `${userType}/${userId}/payroll/organization-settings/corporate-details`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const getBanks = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<BankListResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/profile/bank`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getSalaryComponent = async (
    payload: GetSalaryComponent & { userId: number; userType: string }
) => {
    try {
        const res: SuccessGenericResponse<SalaryComponentListResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/salary-component`,
            {
                params: {
                    page: payload.page,
                    limit: payload.limit,
                    searchText: payload.searchText,
                },
            }
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
export const getAllSalaryComponent = async (payload: {
    userId: number;
    userType: string;
    eId: string;
}) => {
    try {
        const res: SuccessGenericResponse<AllSalaryComponentListResponse> = await ApiClient.get(
            // Only used while adding an employee: unassignedOnly leaves out the components of a
            // past employee with the same email (a rehire), which the new record doesn't get.
            `${payload.userType}/${payload.userId}/payroll/salary-component/salary-component-listByEmail/${payload.eId}?unassignedOnly=true`,
            {}
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
export const getCurrentSalaryComponent = async (payload: { userId: number; userType: string }) => {
    try {
        const resp: SuccessGenericResponse<AllSalaryComponentListResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/salary-component/currentGlobalComponent`
        );
        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};
export const getCurrentEmployeeSalaryComponent = async (payload: {
    userId: number;
    userType: string;
    eId: string;
}) => {
    try {
        const resp: SuccessGenericResponse<AllSalaryComponentListResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/salary-component/currentEmployeeComponent/${payload.eId}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const createEmployeeSalaryComponent = async (
    payload: createSalaryComponentPayload & UserPayload
) => {
    try {
        const { userId, userType, ...restPayload } = payload;
        const res: SuccessGenericResponse<createSalaryComponentResponse> = await ApiClient.post(
            `${userType}/${userId}/payroll/salary-component/employee`,
            restPayload
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const updateEmployeeSalaryComponent = async (
    payload: updateSalaryCompoentPayload & UserPayload
) => {
    try {
        const { userId, userType, ...restPayload } = payload;
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${userType}/${userId}/payroll/salary-component/employee`,
            restPayload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const createSalaryComponent = async (
    payload: createSalaryComponentPayload & UserPayload
) => {
    try {
        const { userId, userType, ...restPayload } = payload;
        const res: SuccessGenericResponse<createSalaryComponentResponse> = await ApiClient.post(
            `${userType}/${userId}/payroll/salary-component`,
            restPayload
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const updateSalaryComponent = async (payload: updateSalaryCompoentPayload & UserPayload) => {
    try {
        const { userId, userType, ...restPayload } = payload;
        const resp: SuccessGenericResponse<any> = await ApiClient.put(
            `${userType}/${userId}/payroll/salary-component/${restPayload.id}`,
            restPayload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const deleteSalaryComponent = async (payload: UserPayload & { id: string }) => {
    try {
        const { userId, userType } = payload;
        const res: SuccessGenericResponse<{}> = await ApiClient.delete(
            `${userType}/${userId}/payroll/salary-component/${payload.id}`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
export const redistributeBasicSalaryApi = async (
    payload: UserPayload & {
        employeeId: string;
        calculationType: 'FIXED' | 'PERCENTAGE';
        amountPercentage: number;
        // Which base a PERCENTAGE Basic resolves against — the backend defaults to
        // GROSS_SALARY when omitted. Meaningless for FIXED.
        calculationBasis?: 'GROSS_SALARY' | 'CTC';
    }
) => {
    try {
        const {
            userId,
            userType,
            employeeId,
            calculationType,
            amountPercentage,
            calculationBasis,
        } = payload;
        const res: SuccessGenericResponse<{
            basicSalary: number;
            specialAllowance: number;
            grossSalary: number;
        }> = await ApiClient.post(
            `${userType}/${userId}/payroll/salary-component/employee/${employeeId}/redistribute-basic`,
            { calculationType, amountPercentage, calculationBasis }
        );
        const { data } = res;
        return { success: true, data };
    } catch (err: any) {
        return {
            success: false,
            errorMessage: err?.response?.data?.message || 'Failed to update Basic Salary',
        };
    }
};

export const redistributeEarningComponentApi = async (
    payload: UserPayload & {
        employeeId: string;
        componentId: string;
        calculationType: 'FIXED' | 'PERCENTAGE';
        amountPercentage: number;
        // Which base a PERCENTAGE edit resolves against — defaults server-side to
        // BASIC_SALARY when omitted, so an existing '% of Gross' component (e.g.
        // Conveyance Allowance) can stay resolvable against Gross instead of silently
        // being forced onto Basic. Meaningless for FIXED.
        calculationBasis?: 'GROSS_SALARY' | 'BASIC_SALARY' | 'CTC';
    }
) => {
    try {
        const {
            userId,
            userType,
            employeeId,
            componentId,
            calculationType,
            amountPercentage,
            calculationBasis,
        } = payload;
        const res: SuccessGenericResponse<{
            componentName: string;
            componentAmount: number;
            specialAllowance: number;
            grossSalary: number;
        }> = await ApiClient.post(
            `${userType}/${userId}/payroll/salary-component/employee/${employeeId}/redistribute-component`,
            { componentId, calculationType, amountPercentage, calculationBasis }
        );
        const { data } = res;
        return { success: true, data };
    } catch (err: any) {
        return {
            success: false,
            errorMessage: err?.response?.data?.message || 'Failed to update component',
        };
    }
};

export interface ReviseSalaryResult {
    basicSalary: number;
    grossSalary: number;
    specialAllowance: number;
    version: { annualCTC: number; previousAnnualCTC: number | null; effectiveFrom: string };
    arrears: { amount: number; payoutMonth: number; payoutYear: number } | null;
    esiNote: string | null;
}

export const reviseSalaryApi = async (
    payload: UserPayload & {
        employeeId: string;
        newAnnualCTC: number;
        effectiveMonth: number;
        effectiveYear: number;
        reason?: string;
        // Set when this call is recording a brand-new hire's first-ever committed CTC
        // (Add Employee / New Hire), not an actual salary revision — skips computing a
        // "previous CTC" that can't be reliably reconstructed for an employee only just
        // created, so Revision History doesn't show a misleading jump from some garbage
        // figure instead of reading as the employee's starting salary.
        isInitialHire?: boolean;
    }
) => {
    try {
        const {
            userId,
            userType,
            employeeId,
            newAnnualCTC,
            effectiveMonth,
            effectiveYear,
            reason,
            isInitialHire,
        } = payload;
        const res: SuccessGenericResponse<ReviseSalaryResult> = await ApiClient.post(
            `${userType}/${userId}/payroll/salary-component/employee/${employeeId}/revise-salary`,
            { newAnnualCTC, effectiveMonth, effectiveYear, reason, isInitialHire }
        );
        const { data } = res;
        return { success: true, data };
    } catch (err: any) {
        return {
            success: false,
            errorMessage: err?.response?.data?.message || 'Failed to revise salary',
        };
    }
};

export interface SalaryRevisionHistoryEntry {
    id: string;
    effectiveFrom: string;
    annualCTC: number;
    previousAnnualCTC: number | null;
    reason: string | null;
    createdBy: string | null;
    createdAt: string;
    arrears: { amount: number; payoutMonth: number; payoutYear: number; status: string } | null;
}

export const getRevisionHistoryApi = async (payload: UserPayload & { employeeId: string }) => {
    try {
        const { userId, userType, employeeId } = payload;
        const res: SuccessGenericResponse<SalaryRevisionHistoryEntry[]> = await ApiClient.get(
            `${userType}/${userId}/payroll/salary-component/employee/${employeeId}/revision-history`
        );
        const { data } = res;
        return { success: true, data };
    } catch (err: any) {
        return {
            success: false,
            errorMessage: err?.response?.data?.message || 'Failed to fetch revision history',
        };
    }
};

export const undoRevisionApi = async (payload: UserPayload & { employeeId: string }) => {
    try {
        const { userId, userType, employeeId } = payload;
        const res: SuccessGenericResponse<{
            undone: boolean;
            restoredBasicSalary: number | null;
            restoredSpecialAllowance: number | null;
            // true when this revision predated the previousEarnings snapshot and the
            // restored amounts were re-solved from its previousAnnualCTC against today's
            // global rules instead of replayed exactly as they were.
            reconstructed?: boolean;
        }> = await ApiClient.post(
            `${userType}/${userId}/payroll/salary-component/employee/${employeeId}/undo-revision`,
            {}
        );
        const { data } = res;
        return { success: true, data };
    } catch (err: any) {
        return {
            success: false,
            errorMessage: err?.response?.data?.message || 'Failed to undo revision',
        };
    }
};

export const getDeductionComponent = async (payload: GetDeductionComponent & UserPayload) => {
    try {
        const res: SuccessGenericResponse<DeductionComponentListResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/deduction-component`,
            {
                params: {
                    page: payload.page,
                    limit: payload.limit,
                    searchText: payload.searchText,
                    includePf: payload.includePf,
                },
            }
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const createDeductionComponent = async (
    payload: createDeductionComponentPayload & UserPayload
) => {
    try {
        const { userId, userType, ...restPayload } = payload;
        const res: SuccessGenericResponse<createDeductionComponentResponse> = await ApiClient.post(
            `${userType}/${userId}/payroll/deduction-component`,
            restPayload
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const updateDeductionComponent = async (
    payload: updateDeductionComponentPayload & UserPayload
) => {
    try {
        const { userId, userType, ...restPayload } = payload;
        const resp: SuccessGenericResponse<any> = await ApiClient.put(
            `${userType}/${userId}/payroll/deduction-component/${payload.id}`,
            restPayload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const deleteDeductionComponent = async (payload: UserPayload & { id: string }) => {
    try {
        const { userId, userType } = payload;
        const res: SuccessGenericResponse<{}> = await ApiClient.delete(
            `${userType}/${userId}/payroll/deduction-component/${payload.id}`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
export const getCompanyProfile = async (payload: UserPayload) => {
    try {
        const { userId, userType } = payload;
        const resp: SuccessGenericResponse<GetCompanyProfileType> = await ApiClient.get(
            `${userType}/${userId}/payroll/organization-settings/companyProfile`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        // PROTOTYPE-SETUP: requests the tokenless prototype cancels on purpose are not logged as errors.
        if (!isCancel(err)) console.error(err, 'error');
        return false;
    }
};
export const getPayrollCycle = async (payload: UserPayload) => {
    try {
        const { userId, userType } = payload;
        const resp: SuccessGenericResponse<GetPayrollSettingsType> = await ApiClient.get(
            `${userType}/${userId}/payroll/organization-settings/payrollCycle`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        // PROTOTYPE-SETUP: requests the tokenless prototype cancels on purpose are not logged as errors.
        if (!isCancel(err)) console.error(err, 'error');
        return false;
    }
};

export const getPayrollActiveYears = async (payload: UserPayload) => {
    try {
        const { userId, userType } = payload;
        const resp = await ApiClient.get(
            `${userType}/${userId}/payroll/organization-settings/active-years`
        );
        const { data } = resp;
        return data;
    } catch (err: any) {
        // PROTOTYPE-SETUP: requests the tokenless prototype cancels on purpose are not logged as errors.
        if (!isCancel(err)) console.error(err, 'hello error');
        return { status: false, errorMessage: err?.response?.data?.message };
    }
};
