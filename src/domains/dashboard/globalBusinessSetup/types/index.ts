import { Country, Provider } from './globalBusinessSetup';

export type companyPayload = {
    locationType: string;
    emirate: string | null;
    activity: string[];
    userId: number;
    userType: string;
};

export type LicenceFee = {
    licenceFee: number;
    establishmentCard: number;
    serviceFee: number;
};

export type DocumentRequired = {
    passportCopy: boolean;
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

export type Licence = {
    _id: string;
    name: string;
    description: string;
    heading?: string;
    activities: string[];
    shareHolderPricing: number;
    activitiesPricing: number;
    freeshareHolders: number;
    freeActivities: number;
    licenceType: string; // can be narrowed to "freezone" | "mainland"
    logo: string;
    emirate: string;
    fee: LicenceFee;
    featuresIncluded: string[];
    documentRequired: DocumentRequired;
    partner: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
    status: string;
};

export type LicenceListResponse = {
    data: Licence[];
};

export interface PackagePrices {
    monthly: string;
    annually: string;
}

export enum PlanType {
    Monthly = 'monthly',
    Annually = 'annually',
}

export enum SubscriptionType {
    Current = 'CURRENT',
    Upgrade = 'UPGRADE',
    Downgrade = 'DOWNGRADE',
}

interface Discount {
    monthly: number;
    annually: number;
}

export interface ServicePackage {
    id: number;
    packageName: string;
    packagePrices: PackagePrices;
    description: string;
    serviceList: string;
    discount: Discount;
    services: string[];
    priorityLevel: number;
    packageLogo: string;
    individualPackages: {
        [key: string]: string;
    };
}

export interface PackagesData {
    packages: ServicePackage[];
    currentPackageId: number;
    currentPlanPriorityLevel: number;
}

export type ShareHolderDetails = {
    typeOfOwner: string;
    country?: string;
    shareHolderFullName: string;
    nationality: string;
    ownershipPercentage: number;
    designation: string;
    passportNumber: string;
    passportCopy: string;
    passportSizePhotographs: string;
    visaCopies: string;
    noc: string;
    certificateOfIncorporation: string;
    memorandum: string;
    boardResolution: string;
    shareCertificate: string;
    goodStandingCertificate: string;
    tradeLicense: string;
    passportAuthorisedSignatory: string;
    proofOfAddressCompany: string;
    ownerType: string;
};

export type ShareHoldersPayload = {
    shareHoldersDetails: ShareHolderDetails[];
};

export type UltimateBeneficialOwner = {
    name: string;
    dob: string; // ISO date string (e.g., "2007-06-18T00:00:00.000Z")
    nationality: string;
    passportNumber: string;
    passportExpiryDate: string; // ISO date string
    dateOfBecomingUBO: string; // ISO date string
    uboDeclaration: string;
    passportCopy: string;
};

export type UltimateBeneficialOwnerPayload = {
    ultimateBeneficialOwner: UltimateBeneficialOwner[];
};

export type FileDetails = {
    _id?: string;
    name: string;
    type: string;
    size: number;
    extension: string;
    url?: string;
};

export type FieldType = {
    field: string;
    label: string;
    name: string;
    value: any;
    type: string;
    option_label?: string | string[];
};

export type InstanceType = {
    fields: FieldType[];
};

export type SectionType = {
    section: string;
    title: string;
    instances: InstanceType[];
};

export type PageType = {
    page: string;
    title: string;
    description?: string;
    sections: SectionType[];
};

export type FormData = {
    form: string;
    title: string;
    pages: PageType[];
    amount_paid: number;
};

export type CompanyFull = Omit<Company, 'form_data'> & {
    form_data: FormData;
};

export interface CompanyCredential {
    _id?: string;
    name?: string;
    email?: string;
}

export interface Company {
    _id?: string;
    application_id?: string;
    reference_id?: string;
    tracking_id?: string;

    country: Country;
    agent: CompanyCredential;
    operator?: CompanyCredential;
    client_name: string;
    proposed_name: string;

    type?: string;
    freezone?: string;

    lead?: string;

    status: 'draft' | 'ongoing' | 'saved' | 'assigned' | 'submitted' | 'closed' | 'rejected';
    is_paid: boolean;

    provider?: Provider;

    metrics: {
        visa: number;
        activity: number;
        shareholder: number;
    };

    form_data: string;

    is_active: boolean;

    logo?: string;
    license_number?: string;
    created_at: string;
    updated_at: string;
    approved_date?: string;
}
