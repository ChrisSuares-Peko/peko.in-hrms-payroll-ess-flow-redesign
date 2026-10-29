export interface LeaveRequestFormType {
    employeeId: string;
    typeOfLeave: string;
    leaveCount: string;
    start: string;
    end: string;
    leaveSupportingDocs: string;
    supportingDocFormat: string;
}

export type leavePayload = {
    id: string;
    userId: number;
    userType: string;
};
export type getLeavePolicyPayload = {
    userId: number;
    userType: string;
    employeeId: string;
};

export type getLeaveProfilePayload = {
    userId: number;
    userType: string;
    employeeId: string;
    page: number;
    limit: number;
    searchText: string;
};

export type addLeavePayload = {
    employeeId: string;
    userId: number;
    userType: string;
    start: string;
    end: string;
    leaveCount: string;
    typeOfLeave: string;
    leaveSupportingDocs: Docs | null | string;
    supportingDocFormat: string;
};

export type updateLeavePayload = {
    leaveId: string;
    userId: number;
    userType: string;
    start: string;
    end: string;
    leaveCount: string;
    typeOfLeave: string;
    leaveSupportingDocs: Docs | null | string;
    supportingDocFormat: string;
};

export type Docs = {
    base64: string;
    format: string;
};

export type availableLeaveResponse = {
    availableLeaves: leaves[];
};

export type leaves = {
    count: number | string;
    value: string;
    label: string;
    balance?: number;
};

export type singleLeavePayload = {
    userId: number;
    userType: string;
    leaveId?: string;
};

export type singleLeaveResponse = {
    leaveData: LeaveData;
};

export type LeaveData = {
    corporateUser: number;
    employee: string;
    managerEmail: string;
    start: string;
    end: string;
    leaveHours: number;
    leaveCount: number;
    halfDaySelection: string;
    leaveType: {
        _id: string;
        typeOfLeave: string;
    }
    createdAt: string;
    updatedAt: string;
    id: string;
    leaveSupportingDocs: string;
    leaveBalance: number;
};

export type leaveData = {
    leaveData: leaveResponse[];
    totalCount: number;
};

export type leaveResponse = {
    corporateUser: string;
    createdAt: string;
    employee: {
        fullName: string;
        id: string;
    };
    end: string;
    id: string;
    leaveCount: number;
    leaveHours: number;
    leaveSupportingDocs: string;
    managerEmail: string;
    halfDaySelection: string;
    start: string;
    // typeOfLeave: {
    //     _id: string;
    //     leaveType: string;
    // };
    updatedAt: string;
    leaveBalance: number;
    leaveType: {
        _id: string;

        typeOfLeave: string;
    };
};

export interface LeaveTableRow {
    id: string;
    employeeName: string;
    employeeId: string;
    leaveType: {
        _id: string;
        typeOfLeave: string;
    };
    from: string; // formatted start date
    to: string; // formatted end date
    totalDays: number;
    leaveBalance: number;
    halfDaySelection: string;
    action: string;
}

export type leaveListPayload = {
    userType: string;
    userId: number;
    start: number;
    length: number;
    search: string;
    year: number;
    month: number;
};

export interface LeaveTakenSummaryData {
    title: string;
    value: number;
    icon: string;
}

export type GetTakenLeavePayload = {
    userId: number;
    userType: string;
    eId: string | undefined;
};

export type GetTakenLeaveResponse = {
    takenLeaves: {
        [key: string]: number;
    };
};

export type EmployeeLeaveListingPayload = {
    userId: number;
    userType: string;
    eId: string | undefined;
    page: number;
    limit: number;
    year: number;
    month: number | string;
};

export type leaveListingResponse = {
    count: number;
    rows: LeaveData[];
};
export type leaveTableType = {
    leaveType: string;
    from: string;
    to: string;
    totalDays: number;
    file: string;
    action: any;
    id: string;
    employeeId: string;
};

export type LeaveDeletePayload = {
    userId: number;
    userType: string;
    rId: string | undefined;
};
export type leaveDataPayload = {
    userId: number;
    userType: string;
    eId: string | undefined;
};

export interface LeaveRecord {
    _id: string;
    corporateUser: string;
    employee: {
        _id: string;
    };
    typeOfLeave: {
        _id: string;
        leaveType: string;
    };
    start: string;
    end: string;
    leaveCount: number;
    createdAt: string;
    updatedAt: string;
    __v: number;
    leaveBalance: number;
}

export interface LeaveListResponse {
    status: boolean;
    responseCode: string;
    message: string;
    data: {
        totalCount: number;
        leaveData: LeaveRecord[];
    };
}

export interface LeavePolicy {
    carryOverBalance: number;
    corporateUser: string;
    employee: string | null;
    leaveType: string;
    accrualType: 'FIXED' | 'ACCRUAL' | 'MONTHLY' | string;
    accrualRate: string | null;
    maximumAccrual: string | null;
    leaveBalanceCarryover: 'ALLOWED' | 'NOT_ALLOWED' | string;
    maximumNumberOfLeaves: number;
    isGlobal: boolean;
    balanceLeaves?: number;
    globalComponentId: string | null;
    createdAt: string; // ISO date string
    updatedAt: string; // ISO date string
    id: string;
}

export interface LeaveResponse {
    totalCount: number;
    leavePolicyData: LeavePolicy[];
}

export type exportLeaveDataPayload = {
    userType: string;
    userId: number;
    month: number | string;
    year: number | string;
    searchText?: string;
};

export type exportLeaveDataResponse = {
    buffer: {
        type: 'Buffer';
        data: [];
    };
};
