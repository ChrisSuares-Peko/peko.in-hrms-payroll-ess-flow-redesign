export type Referral = {
    id: number;
    referralCode: string;
    contactPersonName: string;
    contactPersonPhone: string;
    status: number;
    createdAt: string;
    updatedAt: string;
    partnerId: number;
};
export type DownloadReferral = {
    id: number;
    referralCode: string;
    fromDate: string;
    toDate: string;
    status: number;
    createdAt: string;
    updatedAt: string;
    partnerId: number;
};

export type ReferalResponse = {
    recordsTotal: number;
    data: Referral[];
};

export type refresh = {
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
};
export type updateStatus = {
    referalId?: string | number;
    status: any;
};
export type activeResponse = {
    data: string;
};
export type getData = {
    page: number;
    searchText: string;
    itemsPerPage: number;
    sort: string;
    type?: string;
    sortField?: string;
};

export type newReferal = {
    id?: number;
    referralCode: string;
    contactPersonName: string;
    contactPersonPhone: string;
};

export type ReferralReportPayload = {
    userType: string;
    userId: number;
    fromDate: string;
    toDate: string;
    partnerId: number | undefined;
    referralCode: string;
};

export type RolePermissionAccessData = {
    view?: boolean;
    write?: boolean;
    update?: boolean;
};

export type ReferaRewardlResponse = {
    reward: string | number;
};
