type ShareholderDocumentKeys =
    | 'idofOwner'
    | 'ownername'
    | 'documentofOwner'
    | 'designationofOwner'
    | 'nationalityofOwner'
    | 'percentageSharesofOwner';

type Shareholder = {
    [key in `${ShareholderDocumentKeys}_${number}`]: string;
};

export type CorporateRecord = {
    id: number;
    icRegNumber: string;
    companyName: string;
    tradeName: string;
    offWebsite: string;
    offEmail: string;
    contactPersonName: string;
    phoneNumber: string;
    legalStatus: string;
    OtherlegalStatus: string | null;
    natureOfBusiness: string;
    countryOfIncorporation: string;
    dateOfIncorporation: string;
    TLNumber: string;
    TLIssuingAuthority: string;
    expiryDateofTL: string;
    VATTRN: string;
    tradeLicense: string;
    corporateAddress: {
        city: string;
        poBox: string;
        country: string;
        streetName: string;
        buildingName: string;
    };
    shareholders: Shareholder[];
    status: string;
    remarks: string;
    authorizedPersonName: string;
    authorizedPersonNationality: string;
    authorizedPersonID: string;
    hasPresenceInIranOrNorthKorea: number;
    createdAt: string;
    updatedAt: string;
    credentialId: number;
    credential: {
        id: number;
        name: string;
        username: string;
    };
};

export type CorporateRecordsResponse = {
    recordsTotal: number;
    rows: CorporateRecord[];
};

export type UserPayload = {
    userId: number;
    userType: string;
};

export type GetAllKybDetailsPayload = {
    searchText: string;
    page: number;
    itemsPerPage: number;
    pageSize: number;
    sort: string;
    sortField: string;
    to?: string;
    from: string;
};

export type VendorPayout = UserPayload & GetAllKybDetailsPayload;

export type Records = {
    id: number;
    companyName: string;
    // tradeLicenseDoc: DocumentData[];
    corporateGovernanceDoc: string;
    emiratesIDDoc: string;
    passportDoc: string;
    taxPeriod: string;
    contactPerson: string;
    phoneNumber: string;
    email: string;
    selfDeclaration: number;
    amount: string;
    quantity: number | null;
    status: string;
    remarks: string | null;
    taxCertificateDoc: string | null;
    createdAt: string;
    updatedAt: string;
    credentialId: number;
    credential: Credential;
};

export type StatusPayload = {
    status?: string;
    remarks?: string;
    kybId?: number;
};

export type vendorPayload = {
    type: string;
    searchText?: string;
};

export type RolePermissionAccessData = {
    view?: boolean;
    write?: boolean;
    update?: boolean;
};
