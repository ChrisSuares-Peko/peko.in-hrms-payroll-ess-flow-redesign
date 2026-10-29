 import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    DailyLogEntry,
    DailyLogPagination,
    DailyLogParams,
    DashboardPayload,
    DisputeEntry,
    DisputeParams,
    EventData,
    HolidaysListEntry,
    HolidaysListParams,
    LeaveRequestEntry,
    LeaveRequestParams,
    MonthlySummaryEntry,
    MonthlySummaryParams,
    OvertimeEntry,
    OvertimeParams,
    ShiftScheduleApiEntry,
    ShiftScheduleApiParams,
    ShiftSchedulePeriod,
    TodayAttendanceCounts,
    UpdateDisputeStatusPayload,
    UpdateLeaveStatusPayload,
    UpdateOvertimePayload,
    UpdateOvertimeStatusPayload,
    calendarActivitiesResponse,
    chartPayload,
    chartResponse,
    dashboardResponse,
    downloadPayslipPayload,
    emailPayload,
    employeeCountResponse,
    employeePayload,
    employeeResponse,
    getHolidayResponse,
    holidayDeletePayload,
    holidayDeleteResponse,
    holidayPaload,
    holidayPayload,
    holidayUpdatePayload,
    holidayUpdateResponse,
    progressResponse,
    upcomingActivitiesResponse,
} from '../types/dashboardTypes';

export const getDashboardDetails = async (payload: DashboardPayload) => {
    try {
        const resp: SuccessGenericResponse<dashboardResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/dashBoard`
        );

        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const chartDetails = async (payload: chartPayload) => {
    try {
        const resp: SuccessGenericResponse<chartResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/dashBoard/chart?year=${payload.year}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const sendEmail = async (payload: emailPayload) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/payroll/holiday/sendEmail/${payload.holidayId}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getEmployees = async (payload: employeePayload) => {
    try {
        // const resp: SuccessGenericResponse<employeeResponse> = await ApiClient.get(
        //     `${payload.userType}/${payload.userId}/payroll/employee/current-employees?searchText=`
        // );
        const { userType, userId, month, year } = payload;
        const params: any = {
            searchText: '',
        };
        if (month !== undefined && year !== undefined) {
            params.month = month;
            params.year = year;
        }

        const resp: SuccessGenericResponse<employeeResponse> = await ApiClient.get(
            `${userType}/${userId}/payroll/employee/current-employees`,
            {
                params,
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const upcomingActivities = async (payload: DashboardPayload) => {
    try {
        const resp: SuccessGenericResponse<upcomingActivitiesResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/calendarActivities/upcoming?limit=7`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const calendarActivities = async (payload: DashboardPayload) => {
    try {
        const resp: SuccessGenericResponse<calendarActivitiesResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/calendarActivities`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const holiday = async (payload: holidayPayload) => {
    const reqbody = {
        title: payload.title,
        isAllDay: payload.isAllDay,
        start: payload.start,
        end: payload.end,
        category: payload.category,
        sendPriorEmailDate: payload.sendPriorEmailDate,
    };
    try {
        const resp: SuccessGenericResponse<EventData> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/payroll/holiday`,
            reqbody
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const progress = async (payload: DashboardPayload) => {
    try {
        const resp: SuccessGenericResponse<progressResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/dashBoard/progress`
        );

        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getHoliday = async (payload: holidayPaload) => {
    try {
        const resp: SuccessGenericResponse<getHolidayResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/holiday?start=${payload.start}&end=${payload.end}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const deleteHoliday = async (payload: holidayDeletePayload) => {
    try {
        const res: SuccessGenericResponse<holidayDeleteResponse> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/payroll/holiday/${payload.holidayId}`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
export const holidayUpdate = async (payload: holidayUpdatePayload) => {
    try {
        const resp: SuccessGenericResponse<holidayUpdateResponse> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/payroll/holiday/${payload.holidayId}`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getEmployeeCount = async ({ userType, userId }: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<employeeCountResponse> = await ApiClient.get(
            `${userType}/${userId}/payroll/employee/count`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const getEmployeePayslip = async (payload: downloadPayslipPayload) => {
    try {
        const resp: SuccessGenericResponse<holidayUpdateResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/payroll-slips/download/${payload.employeeId}`,
            {
                params: {
                    year: payload.year,
                    month: payload.month,
                    sendEmail: payload.sendEmail,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getHolidaysList = async ({ userType, userId, ...rest }: HolidaysListParams) => {
    const params = Object.fromEntries(
        Object.entries(rest).filter(([, v]) => v !== undefined && v !== '')
    );
    try {
        const resp: { data: { holidays: HolidaysListEntry[] }; pagination: DailyLogPagination } =
            await ApiClient.get(`${userType}/${userId}/payroll/holidays/list`, { params });
        return { holidays: resp.data?.holidays ?? [], pagination: resp.pagination };
    } catch (err) {
        return null;
    }
};

export const getMonthlySummary = async ({ userType, userId, ...rest }: MonthlySummaryParams) => {
    try {
        const query = new URLSearchParams();
        Object.entries(rest).forEach(([k, v]) => { if (v != null) query.set(k, String(v)); });
        const resp: { data: MonthlySummaryEntry[]; pagination: DailyLogPagination } =
            await ApiClient.get(`${userType}/${userId}/payroll/attendance-record/monthly-summary?${query}`);
        return { entries: resp.data, pagination: resp.pagination };
    } catch (err) {
        return null;
    }
};

export const getTodayAttendanceCounts = async ({ userType, userId }: DashboardPayload) => {
    try {
        const resp: { data: TodayAttendanceCounts } = await ApiClient.get(
            `${userType}/${userId}/payroll/attendance-record/today-summary`
        );
        return resp.data;
    } catch (err) {
        return null;
    }
};

export const getShiftSchedule = async ({ userType, userId, ...rest }: ShiftScheduleApiParams) => {
    try {
        const query = new URLSearchParams();
        Object.entries(rest).forEach(([k, v]) => { if (v != null && v !== '') query.set(k, String(v)); });
        const resp: { period: ShiftSchedulePeriod; data: ShiftScheduleApiEntry[]; pagination: DailyLogPagination } =
            await ApiClient.get(`${userType}/${userId}/payroll/attendance-record/shift-schedule?${query}`);
        return { entries: resp.data ?? [], pagination: resp.pagination, period: resp.period };
    } catch (err) {
        return null;
    }
};

export const getDailyAttendanceLog = async (payload: DailyLogParams) => {
    const { userType, userId, ...rest } = payload;
    const params = Object.fromEntries(
        Object.entries(rest).filter(([, v]) => v !== undefined && v !== '')
    );
    try {
        const resp: { data: DailyLogEntry[]; pagination: DailyLogPagination } = await ApiClient.get(
            `${userType}/${userId}/payroll/attendance-record/daily-log`,
            { params }
        );
        return { entries: resp.data, pagination: resp.pagination };
    } catch (err) {
        return false;
    }
};

export type MarkAttendancePayload = {
    userType: string;
    userId: number;
    employee: string;
    date: string;
    checkIn: string;
    checkOut: string;
    status: string;
    notes?: string;
};

export type UpdateAttendancePayload = {
    userType: string;
    userId: number;
    attendanceId: string;
    status: string;
    checkIn?: string;
    checkOut?: string;
    lateMinutes?: number;
    notes?: string;
};

export const updateAttendance = async ({ userType, userId, attendanceId, ...body }: UpdateAttendancePayload) => {
    try {
        await ApiClient.put(`${userType}/${userId}/payroll/attendance-record/${attendanceId}`, body);
        return { success: true };
    } catch (err: any) {
        const message = err?.response?.data?.message ?? err?.message ?? 'Failed to update attendance';
        return { success: false, errorMessage: message };
    }
};

export const markAttendance = async ({ userType, userId, ...body }: MarkAttendancePayload) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${userType}/${userId}/payroll/attendance-record/mark`,
            body
        );
        return { success: true, data: resp.data };
    } catch (err: any) {
        return { success: false, errorMessage: err?.response?.data?.message ?? 'Failed to mark attendance' };
    }
};

export const getDisputeRequests = async ({ userType, userId, ...rest }: DisputeParams) => {
    const params = Object.fromEntries(
        Object.entries(rest).filter(([, v]) => v !== undefined && v !== '')
    );
    try {
        const resp: { data: { records: DisputeEntry[]; total: number; page: number; limit: number } } =
            await ApiClient.get(`${userType}/${userId}/payroll/disputes`, { params });
        const { records, total, page, limit } = resp.data;
        return {
            entries: records ?? [],
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    } catch (err) {
        return null;
    }
};

export const updateDisputeStatus = async ({ userType, userId, disputeId, status, remarks }: UpdateDisputeStatusPayload) => {
    try {
        await ApiClient.put(`${userType}/${userId}/payroll/disputes/${disputeId}/review`, { status, remarks });
        return { success: true };
    } catch (err: any) {
        const message = err?.response?.data?.message ?? err?.message ?? 'Failed to update dispute';
        return { success: false, errorMessage: message };
    }
};

export const getOvertime = async ({ userType, userId, status, page, limit }: OvertimeParams) => {
    try {
        const query = new URLSearchParams();
        if (status) query.set('status', status);
        if (page) query.set('page', String(page));
        if (limit) query.set('limit', String(limit));
        const resp: { data: { totalCount: number; overTimeData: OvertimeEntry[] } } =
            await ApiClient.get(`${userType}/${userId}/payroll/overtime/?${query}`);
        return { entries: resp.data.overTimeData ?? [], totalCount: resp.data.totalCount ?? 0 };
    } catch (err) {
        return null;
    }
};

export const updateOvertimeStatus = async ({ userType, userId, overtimeId, status, notes }: UpdateOvertimeStatusPayload) => {
    try {
        await ApiClient.patch(`${userType}/${userId}/payroll/overtime/${overtimeId}/status`, { status, notes });
        return { success: true };
    } catch (err: any) {
        const message = err?.response?.data?.message ?? err?.message ?? 'Failed to update overtime status';
        return { success: false, errorMessage: message };
    }
};

export const updateOvertime = async ({ userType, userId, overtimeId, ...body }: UpdateOvertimePayload) => {
    try {
        await ApiClient.put(`${userType}/${userId}/payroll/overtime/${overtimeId}`, { overtimeId, ...body });
        return { success: true };
    } catch (err: any) {
        const message = err?.response?.data?.message ?? err?.message ?? 'Failed to update overtime';
        return { success: false, errorMessage: message };
    }
};

export const getOvertimeDetails = async ({ userType, userId, overtimeId }: { userType: string; userId: number; overtimeId: string }) => {
    try {
        const resp: { data: OvertimeEntry } = await ApiClient.get(`${userType}/${userId}/payroll/overtime/overtime-details/${overtimeId}`);
        return resp.data;
    } catch (err) {
        return null;
    }
};

export const getLeaveRequests = async ({ userType, userId, ...rest }: LeaveRequestParams) => {
    try {
        const query = new URLSearchParams();
        Object.entries(rest).forEach(([k, v]) => { if (v != null && v !== '') query.set(k, String(v)); });
        const resp: { data: LeaveRequestEntry[]; pagination: DailyLogPagination } =
            await ApiClient.get(`${userType}/${userId}/payroll/leave-application/leave-requests?${query}`);
        return { entries: resp.data, pagination: resp.pagination };
    } catch (err) {
        return null;
    }
};

export const updateLeaveStatus = async ({ userType, userId, leaveId, status, notes }: UpdateLeaveStatusPayload) => {
    try {
        await ApiClient.patch(`${userType}/${userId}/payroll/leave-application/${leaveId}/status`, { status, notes });
        return { success: true };
    } catch (err: any) {
        const message = err?.response?.data?.message ?? err?.message ?? 'Failed to update leave status';
        return { success: false, errorMessage: message };
    }
};

export const getBusinessDocs = async (payload: any) => {
    try {
        const res: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/payrollDocs/templates`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const categoryListing = async (payload: any) => {
    try {
        const res: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/payrollDocs/documents?categoryName=${encodeURIComponent(payload.category)}&searchText=${payload.searchKey || ''}&page=${payload.page}&itemsPerPage=${payload.pageSize}&sort=${payload.sortType}&sortField=${payload.sortBy}`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
