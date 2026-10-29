export interface IPayload {
    userId: number;
    userType: string;
}

export interface IAnnouncementsPayload {
    userId: number;
    userType: string;
    page: number;
    limit: number;
    search: string;
    month: number | string;
    year: number;
}

export type IAnnouncement = {
    corporateUser: string;
    subject: string;
    details: string;
    status: 'PENDING' | 'MAILED';
    excludedEmployees: {
        personalInformation: {
            fullName: string;
            email: string;
        };
        id: string;
    }[];
    createdAt: string;
    updatedAt: string;
    id: string;
};

export type IAnnouncementData = {
    count: number;
    rows: IAnnouncement[];
};

export type IModalData = {
    key: number;
    date: string;
    subject: string;
    status: string;
    details: string;
    excludedEmployees: {
        personalInformation: {
            fullName: string;
            email: string;
        };
        id: string;
    }[];
};

export type IEmployeeList = {
    employees: [
        {
            personalInformation: {
                fullName: string;
            };
            id: string;
        },
    ];
};

export type IAnnouncementPostData = {
    details: string;
    subject: string;
    excludedEmployees?: string[];
};

export interface ICreateAnnouncementPayload {
    userId: number;
    userType: string;
    postData: IAnnouncementPostData;
}
