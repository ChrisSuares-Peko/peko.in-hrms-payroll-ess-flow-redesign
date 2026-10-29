export type NotificationData = {
    id: number;
    notificationTitle: string;
    notificationBrief: string;
    notificationCategory: string;
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
};
