export type DashboardPayload = {
    userType: string;
    userId: number;
};

export type chartPayload = {
    userType: string;
    userId: number;
    year: string;
};
export type emailPayload = {
    userType: string;
    userId: number;
    holidayId: string;
};

export type chartResponse = {
    chartData: chartData[];
};
export type chartData = {
    id: number;
    month: string;
    totalSalary: number;
};

export type holidayPayload = {
    userType: string;
    userId: number;
    title: string;
    isAllDay: boolean;
    start: string;
    end: string;
    category: string;
    sendPriorEmailDate: string;
    isEmailSent: boolean;
};

export type getHoliday = {
    userType: string;
    userId: number;
    start: string;
    end: string;
};
export type deductionSummaryType = {
    epf: number;
    esi: number;
    tds: number;
    lwf: number;
    totalDeduction: number;
};

export type dashboardResponse = {
    totalSalary: number;
    lastMonthSalary: number;
    activeEmployees: number;
    nextMonthSalary: number;
    upcomingActivities: activities[];
    deductionSummary: [deductionSummaryType];
};
export type activities = {
    title: string;
    body: string;
    start: string;
    type: string;
};

export type upcomingActivitiesResponse = {
    upcomingActivities: upcoming[];
};
export type upcoming = {
    title: string;
    start: string;
    end: string;
    id: string;
    sendPriorEmail: boolean;
    isEmailSent: boolean;
    activityType: string;
};
export type calendarActivitiesResponse = {
    calendarActivities: calendarActivitiesType[];
};
export type calendarActivitiesType = {
    title: string;
    isAllDay: boolean;
    start: string; // Assuming this is a string representation of date
    end: string; // Assuming this is a string representation of date
    category: string;
    id: string;
    activityType: string;
};
export type EventData = {
    corporateUser: string;
    title: string;
    isAllDay: boolean;
    start: string;
    end: string;
    category: string;
    sendPriorEmail: boolean;
    isEmailSent: boolean;
    createdAt: string;
    updatedAt: string;
    id: string;
};

export type employeeResponse = {
    employees: employeeTypes[];
};

export type employeeTypes = {
    personalInformation: {
        fullName: string;
        dateOfBirth: string;
        gender: string;
        mobileNo: string;
        email: string;
        country: string;
        state: string;
        emergencyContactNo: string;
        emergencyContactName: string;
        emergencyContactRelation: string;
    };
    label: string;
    value: string;
    employeeInformation: {
        dateOfJoin: string;
        employeeId: string;
        department: string;
        designation: string;
        reportingStaff: string | null;
        workingDays: number;
        timeSchedule: string;
        workingHours: number;
        contractType: string;
        status: string;
        employeeStatus: string;
        probationPeriod: string | null;
        employeeGrade: string;
    };
    employeeDocuments: any[]; // Assuming an array of any for now
    offBoardingInformation:{
        lastWorkingDay:string;
        offBoardingType:string;
    }
    id: string;
};

export type employeePayload = {
    userId: number;
    userType: string;
    month?: string;
    year?: string;
};

export type progressResponse = {
    departmentAndEmployees: boolean;
    progress: string;
    holidays: boolean;
    hrSettings: boolean;
    setUpWps: boolean;
    hasBasicSalaryComponent: boolean;
    basicSalaryAmount: number;
    hasCompanyProfile: boolean;
    hasPayrollSettings: boolean;
    hasSalaryComponent: boolean;
    hasDeductionComponents: boolean;
    // null for corporate accounts that predate this field — treated as exempt (existing user).
    hasSalaryRolloutSetup: boolean | null;
    onBoardStatus: number;
    isSkippedDasboard: boolean;
    numberOfDaysWorking: number;
};

export type holidayPaload = {
    userId: number;
    userType: string;
    start: string;
    end: string;
};

export type getHolidayResponse = {
    holidays: allHolidays[];
};

export type allHolidays = {
    corporateUser: number;
    title: string;
    isAllDay: boolean;
    start: string;
    end: string;
    category: string;
    sendPriorEmail: boolean;
    isEmailSent: boolean;
    createdAt: string;
    updatedAt: string;
    id: string;
};
export type holidayDeletePayload = {
    userId: number;
    userType: string;
    holidayId: string | undefined;
};
type HolidayData = {
    corporateUser: string;
    title: string;
    isAllDay: boolean;
    start: string; // Date in ISO 8601 format
    end: string; // Date in ISO 8601 format
    category: string;
    sendPriorEmail: boolean;
    isEmailSent: boolean;
    createdAt: string; // Date in ISO 8601 format
    updatedAt: string; // Date in ISO 8601 format
    id: string;
};

export type holidayDeleteResponse = {
    status: boolean;
    responseCode: string;
    message: string;
    data: HolidayData;
};
export type holidayUpdatePayload = {
    userId?: number;
    userType?: string;
    holidayId?: string | undefined;
    title: string;
    isAllDay: boolean;
    start: string;
    end: string;
    category: string;
    sendPriorEmail: boolean;
};
export type holidayUpdateResponse = {
    corporateUser: string;
    title: string;
    isAllDay: boolean;
    start: string;
    end: string;
    category: string;
    sendPriorEmail: boolean;
    isEmailSent: boolean;
    createdAt: string;
    updatedAt: string;
    id: string;
};
export type announcementDeletePayload = {
    userId: number;
    userType: string;
    announcementId: string | undefined;
};
export type announcementDeleteResponse = {
    status: boolean;
    responseCode: string;
    message: string;
    data: {};
};

export interface employeeCountResponse {
    count: number;
    lastEmployeeAddedDate: string;
}
export type downloadPayslipPayload = {
    userId?: number;
    userType?: string;
    employeeId?: string | undefined;
    sendEmail: boolean;
    month: string;
    year: string;
};

export type DailyLogPagination = {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};

export type DailyLogShift = {
    startTime: string;
    endTime: string;
    breakTimeHrs: number;
};

export type DailyLogEmployeeInfo = {
    _id: string;
    employeeId: string;
    fullName: string;
    email: string | null;
    profileImage?: string | null;
    designation: string;
    shift?: string;
};

export type DailyLogEntry = {
    _id: string;
    employee: DailyLogEmployeeInfo;
    date: string;
    checkIn?: string;
    checkOut?: string;
    lateMinutes?: number;
    totalHours?: number;
    otHours?: number;
    status: string;
    notes?: string | null;
};

export type DailyLogParams = {
    userType: string;
    userId: number;
    date?: string;
    from?: string;
    to?: string;
    employee?: string;
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
};

export type HolidaysListParams = {
    userType: string;
    userId: number;
    page?: number;
    limit?: number;
    start?: string;
    end?: string;
    search?: string;
    category?: string;
};

export type HolidaysListEntry = {
    _id: string;
    title: string;
    isAllDay: boolean;
    start: string;
    end: string;
    category: string;
    sendPriorEmailDate: string;
    isEmailSent: boolean;
};

export type MonthlySummaryEmployee = {
    _id: string;
    employeeId: string;
    fullName: string;
    email: string;
    profileImage?: string;
    designation: string;
};

export type MonthlySummaryEntry = {
    employee: MonthlySummaryEmployee;
    present: number;
    late: number;
    absent: number;
    onLeave: number;
    halfDay: number;
    totalHours: number;
    totalLateMinutes: number;
    otHours: number;
    attendancePercentage: number;
};

export type MonthlySummaryParams = {
    userType: string;
    userId: number;
    month?: string;
    employee?: string;
    search?: string;
    page?: number;
    limit?: number;
};

export type TodayAttendanceCounts = {
    present: number;
    late: number;
    absent: number;
    onLeave: number;
};

export type ShiftScheduleEmployeeInfo = {
    _id: string;
    employeeId: string;
    fullName: string;
    email: string;
    profileImage: string | null;
    department: string;
};

export type ShiftScheduleDayEntry = {
    date: string;
    dayName: string;
    isOff: boolean;
    scheduledStart: string;
    scheduledEnd: string;
    checkIn: string | null;
    checkOut: string | null;
    totalHours: number;
    lateMinutes: number;
    status: string;
};

export type ShiftScheduleApiEntry = {
    employee: ShiftScheduleEmployeeInfo;
    scheduledStart: string;
    scheduledEnd: string;
    breakTimeHrs: number;
    totalHours: number;
    days: ShiftScheduleDayEntry[];
};

export type ShiftSchedulePeriod = {
    from: string;
    to: string;
};

export type ShiftScheduleApiParams = {
    userType: string;
    userId: number;
    from?: string;
    to?: string;
    employee?: string;
    search?: string;
    page?: number;
    limit?: number;
};

export type DisputeEmployeeInfo = {
    _id: string;
    employeeId: string;
    fullName: string;
    email: string;
    profileImage?: string;
    designation?: string;
};

export type DisputeCheckInOut = {
    time?: string;
    method?: string;
};

export type DisputeAttendance = {
    _id: string;
    date: string;
    status: string;
    checkIn: DisputeCheckInOut | null;
    checkOut: DisputeCheckInOut | null;
};

export type UpdateDisputeStatusPayload = {
    userType: string;
    userId: number;
    disputeId: string;
    status: 'approved' | 'rejected';
    remarks?: string;
};

export type DisputeEntry = {
    _id: string;
    employee: DisputeEmployeeInfo;
    attendance: DisputeAttendance;
    disputeType: string;
    reason: string;
    supportingDocs?: string | null;
    status: string;
    remarks?: string | null;
    createdAt: string;
};

export type OvertimeEmployeeInfo = {
    _id: string;
    employeeId: string;
    fullName: string;
    email?: string;
    profileImage?: string;
    designation?: string;
};

export type OvertimeEntry = {
    id: string;
    corporateUser: string;
    employee: string;
    employeeDetails?: OvertimeEmployeeInfo;
    overTimeDate: string;
    extraHours: number;
    overTimeRate: number;
    overTimeAmount: number;
    totalWorkingHours: number;
    hourlyRate: number;
    paymentStatus: string;
    status: string;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
};

export type OvertimeParams = {
    userType: string;
    userId: number;
    status?: string;
    page?: number;
    limit?: number;
};

export type UpdateOvertimeStatusPayload = {
    userType: string;
    userId: number;
    overtimeId: string;
    status: 'approved' | 'rejected';
    notes?: string;
};

export type UpdateOvertimePayload = {
    userType: string;
    userId: number;
    overtimeId: string;
    overTimeDate: string;
    extraHours: number;
    overTimeRate: string;
    totalWorkingHours: number;
    hourlyRate: string;
    overTimeAmount: string;
    notes?: string;
};

export type DisputeParams = {
    userType: string;
    userId: number;
    page?: number;
    limit?: number;
    from?: string;
    to?: string;
    status?: string;
    employee?: string;
    search?: string;
    reason?: string;
};

export type LeaveRequestEmployee = {
    _id: string;
    employeeId: string;
    fullName: string;
    email: string;
    profileImage?: string;
    designation: string;
};

export type LeaveRequestEntry = {
    _id: string;
    employee: LeaveRequestEmployee;
    // { _id, leaveType } for a real (configurable) leave type, or a synthetic
    // { _id: 'UNPAID', leaveType: 'Unpaid Leave' } entry — never a fixed string enum.
    typeOfLeave: { _id: string; leaveType: string } | null;
    start: string;
    end: string;
    leaveCount: number;
    halfDaySelection: string | null;
    reason: string | null;
    status: string;
    createdAt: string;
};

export type LeaveRequestParams = {
    userType: string;
    userId: number;
    employee?: string;
    from?: string;
    to?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
};

export type UpdateLeaveStatusPayload = {
    userType: string;
    userId: number;
    leaveId: string;
    status: string;
    notes?: string;
};