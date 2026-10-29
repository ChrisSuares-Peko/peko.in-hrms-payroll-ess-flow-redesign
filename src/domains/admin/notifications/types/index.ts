import { CorporateUser } from '../../settings/types/disabledTypes';

export type NotificationData = {
    id: number;
    notificationTitle: string;
    notificationBrief: string;
    notificationCategory: string;
    notificationTo: string;
    createdAt: string;
    flag: boolean;
};

export type NotificationsResponse = {
    data: NotificationData[];
    recordsTotal: number;
};

export type filterState = {
    searchText: string;
    page: number;
    itemsPerPage: number;
    from: string;
    to: string;
    sort?: string;
    sortField?: string;
};

export type CorporateListResponse = {
    result: CorporateUser[];
};

export interface UserPayload {
    userId: number;
    userType: string;
}

export type NotificationDataWithoutId = Omit<NotificationData, 'id'>;
export type NotificationId = Pick<NotificationData, 'id'>;

export type RolePermissionAccessData = {
    view?: boolean;
    write?: boolean;
    update?: boolean;
};
