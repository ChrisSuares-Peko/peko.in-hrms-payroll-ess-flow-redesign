export type CommissionMode = 'MARGIN' | 'AGENT_MARKUP' | 'PRINCIPAL_MARKUP';
export type CommissionType = 'PERCENTAGE' | 'FLAT';

export const commissionModeOptions: { value: CommissionMode; label: string }[] = [
    { value: 'MARGIN', label: 'Margin' },
    { value: 'AGENT_MARKUP', label: 'Agent Markup' },
    { value: 'PRINCIPAL_MARKUP', label: 'Principal Markup' },
];

export const commissionTypeOptions: { value: CommissionType; label: string }[] = [
    { value: 'PERCENTAGE', label: 'Percentage' },
    { value: 'FLAT', label: 'Flat' },
];

export interface MobileRechargeProviderData {
    id: number;
    providerName: string;
    displayName: string;
    commissionMode: CommissionMode;
    commissionType: CommissionType;
    commission: number;
    fixedCommissionPerTransaction?: number | null;
    isCommissionInclGST: boolean;
    status: boolean;
    createdAt: string;
}

export type createMobileRechargeProviderPayload = {
    providerName: string;
    displayName: string;
    commissionMode: CommissionMode;
    commissionType: CommissionType;
    commission: number;
    fixedCommissionPerTransaction?: number | null;
    isCommissionInclGST: boolean;
};

export type updateMobileRechargeProviderPayload = createMobileRechargeProviderPayload & {
    id: number;
};

export type updateMobileRechargeProviderStatusPayload = {
    userType: string;
    userId: number;
    id: number;
    status: boolean;
};

export interface MobileRechargeProviderResponse {
    data: MobileRechargeProviderData[]; // Array of mobile recharge providers
    recordsTotal: number; // Total number of records
}

export interface getMobileRechargeProvidersPayload {
    sort?: 'ASC' | 'DESC'; // Sorting order
    sortField?: string; // Field to sort by
    page?: number; // Current page number
    itemsPerPage?: number; // Number of items per page
    searchText?: string; // Text to search for
}

export interface activeResponse {
    success: boolean; // Whether the action was successful
    message: string; // Status message
}

export interface deleteMobileRechargeProviderPayload {
    userType: string;
    userId: number;
    providerId: number; // ID of the provider to delete
}

export type RolePermissionAccessData = {
    view?: boolean;
    write?: boolean;
    update?: boolean;
};
