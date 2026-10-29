export interface ReminderCardProps {
    icon: string;
    title: string;
    subTitle: number | undefined | string;
    date: string;
    type: string;
}

export interface ReminderCarouselProps {
    arr: ReminderCardProps[];
}
export interface InfoCardProps {
    icon: string;
    title: string;
    value: number | string | undefined;
    isCurrency?: boolean;
    isPercentage?: boolean;
    bgColor: string;
}

interface Reminder {
    title: string;
    subTitle: string;
    date: string;
    icon: string;
    type: string;
}

export interface GetStorageDataResponse {
    storageUsedInBytes: number;
    storageUsedInGB: number;
    storageAvailable: number;
}
export interface DashboardListingResponse {
    totalDocuments: number;
    totalSubscriptions: number;
    totalSubscriptionsSpent: number;
    remindersList: Reminder[];
    totalAssetsAndFleets: number;
}
export interface userPayload {
    userType: string;
    userId: number;
}

// export interface TaskToDoListingResponse {
//    task:ToDoData[]
// }
// interface ToDoData{
//     title: string;
//     date: string;
//     icon: string;
//     type: "FLEETS" | "ASSETS_DOCS" | "COMPANY_DOCS";
//     details: Data;
// }
// interface Data{
//     id: number;
//     documentName: string;
//     documentNumber: string;
//     documentCategory: 'COMPANY';  // Enum if you have a known set of categories
//     documentType: 'agreements';  // Enum if you have a known set of types
//     issueDate: string;
//     expireDate: string;
//     document: string;
//     createdAt: string;
//     updatedAt: string;
//     cloudAssetId: null;
//     cloudFleetId: null;
//     credentialId: number;
//     cloud_asset: null;
//     cloud_fleet: null;
// }
