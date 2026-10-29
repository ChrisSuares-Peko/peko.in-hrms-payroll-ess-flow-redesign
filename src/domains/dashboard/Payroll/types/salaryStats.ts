export interface SalaryStatsRecord {
    key: string;
    empId: string;
    name: string;
    salaries: Record<string, number>;
}

export interface SalaryStatsPayload {
    userId: number | string;
    userType: string;
    year: string | number;
    status: 'ACTIVE' | 'PAST' | 'INACTIVE';
    page: number;
    limit: number;
    searchText?: string;
}

interface SalaryStatsApiRow {
    employeeId: string;
    employeeCode?: string | null;
    employeeName: string;
    salaries: { month: number; amount: number }[];
}

export interface SalaryStatsResponse {
    count: number;
    rows: SalaryStatsApiRow[];
}
