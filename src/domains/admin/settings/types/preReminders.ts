export type reminderPyload = {
    day: number;
    scheduledTime: string;
    name: string;
};

export type Data = {
    id: number;
    name: string;
    details: number[]; // Array of numbers for the days
    createdAt: string; // Use string for ISO date format, or Date if you want to convert it later
    updatedAt: string; // Same as above
};

export type days = {
    day: number;
    scheduledTime: string;
};

export type fetchData = {
    days: days[];
    totalCount: number;
    currentPage: number;
    itemsPerPage: number;
};
export type RolePermissionAccessData = {
    view?: boolean;
    write?: boolean;
    update?: boolean;
};
