export type filterState = {
    searchText: string;
    page: number;
    itemsPerPage: number;
    from: string;
    to: string;
    // Optional override of the API page size (list APIs default to 10). Used by screens that
    // render everything without paging controls, e.g. Document Center.
    pageSize?: number;
    // sort:string;
    // filter: string;
    // sortField: string;
};
export type verifyPayload = {
    doc_identity_no: string;
    type: string;
    dob?: string;
    userId: number;
    userType: string;
    vehicleId?:number;
};

export interface UserPayload {
    userId: number;
    userType: string;
}

export type AddressSplit = {
    district: string[];
    state: [string, string][];
    city: string[];
    pincode: string;
    country: [string, string];
    address_line: string;
};

export type AddressItem = {
    complete_address: string;
    type: string;
    split_address: AddressSplit;
};

export type DLValidity = {
    non_transport: {
        to: string;
        from: string;
    };
    hazardous_valid_till: string | null;
    transport: {
        to: string | null;
        from: string | null;
    };
    hill_valid_till: string | null;
};

export type DLEntryDetails = {
    date_of_issue: string;
    date_of_last_transaction: string | null;
    status: string | null;
    last_transacted_at: string | null;
    name: string;
    father_or_husband_name: string;
    address_list: AddressItem[];
    address: string;
    photo: string;
    split_address: AddressSplit;
    cov_details: any[];
};

export type RawDLData = {
    verification_id: string;
    badge_details: any;
    dl_validity: DLValidity;
    details_of_driving_licence: DLEntryDetails;
};

export type DLData = {
    dlNumber: string;
    name: string;
    fatherName: string;
    dob: string;
    address: string;
    permanentAddress: string;
    photoUrl: string;
    nonTransportValidFrom: string;
    nonTransportValidTo: string;
    transportValidFrom: string | null;
    transportValidTo: string | null;
    hazardousValidTill: string | null;
    hillValidTill: string | null;
    dateOfIssue: string;
    verificationStatus: string;
    referenceId: number;
    rawData: RawDLData;
};

export type DLAddressV2Split = {
    district: string[];
    state: [string, string][];
    city: string[];
    pincode: string;
    country: [string, string];
    address_line: string;
};

export type DLAddressV2Item = {
    complete_address: string;
    type: string;
    split_address: DLAddressV2Split;
};

export type DLValidityV2 = {
    non_transport: {
        to: string;
        from: string;
    };
    hazardous_valid_till: string | null;
    transport: {
        to: string | null;
        from: string | null;
    };
    hill_valid_till: string | null;
};

export type DLDetailsV2 = {
    date_of_issue: string;
    date_of_last_transaction: string | null;
    status: string | null;
    last_transacted_at: string | null;
    name: string;
    father_or_husband_name: string;
    address_list: DLAddressV2Item[];
    address: string;
    photo: string;
    split_address: DLAddressV2Split;
    cov_details: any[]; // You can replace `any` with a defined structure if available
};

export type DLRawDataV2 = {
    verification_id: string;
    badge_details: any;
    dl_validity: DLValidityV2;
    details_of_driving_licence: DLDetailsV2;
};

export type DrivingLicenseResponseV2 = {
    createdAt: string;
    updatedAt: string;
    status: boolean;
    id: number;
    dlNumber: string;
    name: string;
    fatherName: string;
    dob: string;
    address: string;
    permanentAddress: string;
    photoUrl: string;
    nonTransportValidFrom: string;
    nonTransportValidTo: string;
    transportValidFrom: string | null;
    transportValidTo: string | null;
    hazardousValidTill: string | null;
    hillValidTill: string | null;
    dateOfIssue: string;
    verificationStatus: string;
    referenceId: number;
    rawData: DLRawDataV2;
    credentialId: number;
};
export type assignPayload = {
    vehicleId: number;
    driverId: number;
    userId: number;
    userType: string;
    reassign?: boolean;
};
export type updatePayload = {
    vehicleId: number;
    driverId: number;
    userId: number;
    userType: string;
    docId:number
};
export type AssignmentData = {
    assignmentType: 'Assigned' | 'Unassigned'; // assuming these are the possible values
    assignedAt: string; // ISO date string
    id: number;
    vehicleId: number;
    driverId: number;
    updatedAt: string; // ISO date string
    createdAt: string; // ISO date string
};
export type VehicleData = {
    id: number;
    vehicleNumber: string;
    manufacturer: string;
    model: string;
    fuelType: string;
    rcStatus: string;
    insuranceValidUpto: string;
    pucValidUpto: string;
    permitValidUpto: string | null;
    blacklistStatus: boolean;
    engineNumber: string;
    chassisNumber: string;
    regDate: string;
    regAuthority: string;
    presentAddress: string;
    permanentAddress: string;
    manufacturingDate: string;
    insuranceCompany: string;
    policyNumber: string;
    ownerName: string;
    isCommercial: boolean;
    rawData: {
        class: string;
        status: string;
        body_type: string;
        wheelbase: string;
        non_use_to: string | null;
        norms_type: string;
        noc_details: any;
        owner_count: string;
        permit_type: string | null;
        pucc_number: string;
        rc_financer: string;
        non_use_from: string | null;
        reference_id: number;
        status_as_on: string;
        mobile_number: string | null;
        permit_number: string | null;
        non_use_status: string | null;
        rc_expiry_date: string;
        unladen_weight: string;
        vehicle_colour: string;
        challan_details: any;
        rc_standard_cap: string;
        verification_id: string;
        vehicle_category: string;
        vehicle_tax_upto: string | null;
        blacklist_details: any;
        owner_father_name: string;
        permit_issue_date: string | null;
        permit_valid_from: string | null;
        gross_vehicle_weight: string;
        national_permit_upto: string | null;
        vehicle_cylinders_no: string;
        split_present_address: {
            city: string[];
            state: [string, string][];
            country: string[];
            pincode: string;
            district: string[];
            address_line: string;
        };
        vehicle_seat_capacity: string;
        national_permit_number: string | null;
        vehicle_cubic_capacity: string;
        split_permanent_address: {
            city: string[];
            state: [string, string][];
            country: string[];
            pincode: string;
            district: string[];
            address_line: string;
        };
        vehicle_sleeper_capacity: string;
        national_permit_issued_by: string | null;
        vehicle_standing_capacity: string;
    };
    fasttagBalance: number | null;
    insuranceExpiry: string;
    lastRefreshedAt: string | null;
    createdAt: string;
    status: boolean;
    isDeleted: boolean;
    updatedAt: string;
    credentialId: number;
    subCorporateUserId: number | null;
};

// Ticket 31321. `refreshed: false` means the weekly window has not elapsed — `nextRefreshOn` says when.
export type RefreshFleetData = {
    refreshed: boolean;
    lastRefreshedAt: string | null;
    nextRefreshOn: string | null;
    fleet?: VehicleData;
};
