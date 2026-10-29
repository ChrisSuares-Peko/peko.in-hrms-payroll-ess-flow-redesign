export type getData = {
    page: number;
    searchText: string;
    itemsPerPage: number;
    sort: string;
    sortField?: string;
    from?: string;
    to?: string;
    id?: string | number;
    category?: string | number;
    type?: string;
    partnerId?: string | number;
    status?: string;
    journalKey?: string;
};
export type APIPayload = {
    userType: string;
    userId: number;
};
export type DownloadTicketPayload = APIPayload & {
    orderId: number | string;
};

export type ExcelCsvtype = {
    searchText: string;
    sort: string;
    sortField: string;
    type: string;
};
export type useFilterCommon = {
    searchText: string;
    page: number;
    itemsPerPage: number;
    partnerId?: string | number;
    sort?: 'ASC' | 'DESC';
    sortField?: string;
    from?: string;
    to?: string;
    corporateId?: string | number;
    category?: string | number;
};

export type OrderUpdatePayload = {
    id: number;
    workspaceOrderStatus: string;
};

export type UpdateData = {
    id: number;
    workspaceOrderStatus: string;
};

export type HandleUpdateBtnType = (
    title: string,
    emailIds: string[] | false | undefined,
    scheduledTime: string | false | undefined,
    scheduledDay: string | false | undefined,
    isActive: boolean | undefined
) => void;

export type AllShedulerTypes = {
    title: string;
    email: string[] | undefined | false;
    isActive: boolean | undefined;
    scheduledTime: string | false | undefined;
    scheduledDay: string | false | undefined;
    handleUpdateBtn: HandleUpdateBtnType;
    accessPermission?:any
};

export type SchedulerResponse = {
    name: string;
    email: string;
    dailyReport: {
        email: string[];
        isActive: boolean;
        scheduledTime: string;
        scheduledDay?: string;
    };
    weeklyReport: {
        email: string[];
        isActive: boolean;
        scheduledTime: string;
        scheduledDay: string;
    };
    monthlyReport: {
        email: string[];
        isActive: boolean;
        scheduledTime: string;
        scheduledDay?: string;
    };
};

export type SchedulerPayload = {
    userId: number;
    userType: string;
};

export type updateSchedulerPayload = shedulerTypes & {
    userId: number;
    userType: string;
    route: string;
};

export type updateSchedulerResponse = {
    data: {};
    success: boolean;
};

export type shedulerTypes = {
    email: string[] | undefined | false;
    isActive: boolean | undefined;
    scheduledTime: string | false | undefined;
    scheduledDay: string | false | undefined;
};
