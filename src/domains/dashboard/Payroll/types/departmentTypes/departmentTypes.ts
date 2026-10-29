export type createDepartmentSuccess = {
    corporateUser: number;
    createdAt: Date;
    updatedAt: Date;
    id: string;
};

type departmentData = {
    corporateUser: number;
    departmentName: string;
    departmentCode: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
    id: string;
};
export type departmentListing = {
    totalCount: number;
    departmentData: departmentData[];
};

export type departmentTableData = {
    key: number;
    date: string;
    name: string;
    code: string;
    description: string;
    id: string;
};

export type departmentSelect = {
    key: number;
    value: string;
    label: string;
};

export type departmentPayload = {
    id: string | number;
    role: string;
};

export type departmentEditPayload = {
    userId?: number;
    userType?: string;
    id?: string;
    departmentName: string;
    departmentCode: string;
    description: string;
};
