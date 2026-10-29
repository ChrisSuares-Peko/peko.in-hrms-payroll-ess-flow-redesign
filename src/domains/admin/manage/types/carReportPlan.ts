export type CarReportPlanType = 'valuation' | 'history' | 'inspection';

export interface CarReportPlan {
    id?: number;
    reportType: CarReportPlanType;
    // Only inspection plans carry a packageId; the flat products store null.
    packageId?: string | null;
    displayName: string;
    price: number | string;
    // Droom's SKU for the eco-order booking — an inspection plan without one cannot be
    // booked and auto-refunds on purchase.
    vendorProductCode?: string | null;
    status?: boolean;
    sortOrder?: number;
    commissionMode?: 'MARGIN' | 'AGENT_MARKUP' | 'PRINCIPAL_MARKUP';
    commissionType?: 'PERCENTAGE' | 'FLAT';
    commission?: number | string;
    fixedCommissionPerTransaction?: number | string;
    isCommissionInclGST?: boolean;
    totalCommission?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface GetCarReportPlansParams {
    searchText?: string;
    page?: number;
    itemsPerPage?: number;
    sort?: string;
    sortField?: string;
    reportType?: string;
}

export const REPORT_TYPE_OPTIONS = [
    { label: 'Valuation', value: 'valuation' },
    { label: 'History', value: 'history' },
    { label: 'Inspection', value: 'inspection' },
];

export const REPORT_TYPE_COLORS: Record<string, string> = {
    valuation: 'gold',
    history: 'green',
    inspection: 'purple',
};
