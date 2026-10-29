export type ServiceClassificationTab =
    | 'with_plans'
    | 'without_plans'
    | 'peko_subscription'
    | 'peko_subscription_vendor';

export type ServiceClassification = ServiceClassificationTab | null;

export type ServiceClassificationFilter = 'all' | 'unclassified' | ServiceClassificationTab;

export interface ClassificationPartner {
    partnerPermissionId: number;
    partnerName: string | null;
}

export interface ClassifiedOperator {
    id: number;
    serviceProvider: string;
    accessKey: string;
    serviceCategory: string | null;
    serviceStatus: boolean;
    serviceImage?: string | null;
    vendor: { id: number; vendorName: string | null } | null;
    planType: ServiceClassification;
    commissionConfigured: boolean;
    liveFor: ClassificationPartner[];
}

export interface ServiceClassificationFilters {
    searchText: string;
    page: number;
    itemsPerPage: number;
    sort: 'ASC' | 'DESC' | '';
    sortField: string;
    classification: ServiceClassificationFilter;
}

export interface ServiceClassificationListResponse {
    services: ClassifiedOperator[];
    recordsTotal: number;
    page: number;
    itemsPerPage: number;
}

export interface SkippedClassificationPartner extends ClassificationPartner {
    code: 'EXISTS' | 'STALE';
    status: string | null;
}

export interface ClassifyServiceResult {
    accessKey: string;
    planType: ServiceClassification;
    previousPlanType: ServiceClassification;
    changed: boolean;
    autoApproved: ClassificationPartner[];
    skipped: SkippedClassificationPartner[];
}

export interface ClassificationOption {
    id: number;
    serviceProvider: string;
    accessKey: string;
    serviceCategory: string | null;
    vendor: { id: number; vendorName: string | null } | null;
    liveFor: ClassificationPartner[];
}

export interface ClassificationOptionsResponse {
    services: ClassificationOption[];
}

export interface ClassifyServicesResult {
    config: {
        service_with_plans: string[];
        service_without_plans: string[];
        peko_service_subscriptions: string[];
        peko_subscription_vendors: string[];
    };
    results: ClassifyServiceResult[];
}
