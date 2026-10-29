export type getData = {
    page: number;
    searchText: string;
    itemsPerPage: number;
    sort: string;
    type?: string;
};
export type Service = {
    Id: number;
    serviceStatus: number;
    credentialId: number;
    serviceOperatorId: number;
    serviceOperator: {
        serviceProvider: string;
    };
    credential: {
        name: string;
        username: string;
        subPartner: {
            name: string;
            username: string;
        };
        registeredByCredential: {
            name: string;
            username: string;
        };
    };
};

export type ServiceData = {
    recordsTotal: number;
    data: Service[];
};

export type updateStatus = {
    serviceId?: string | number;
    serviceStatus: any;
};
export type activeResponse = {
    data: string;
};
export type refresh = {
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
};

export type ServiceProvider = {
    id: number;
    serviceProvider: string;
};

export type ServiceProviderData = {
    data: ServiceProvider[];
};

export type CorporateUser = {
    id: number;
    email: string;
    mobileNo: string;
    name: string;
    firstName: string;
    lastName: string;
    designation: string;
    website: string | null;
    country: string;
    city: string;
    sector: string;
    poBox: string;
    countryCode: string;
    contactPersonName: string;
    companyName: string;
    companySize: string;
    contactPersonEmail: string | null;
    contactPersonPhone: string | null;
    tradeLicenseNo: string;
    activity: string;
    tradeLicenseDoc: string;
    trnCertificate: string;
    trnNo: string;
    issuingAuthority: string;
    referralCode: string | null;
    kycRemarks: string | null;
    kycStatus: string;
    latLng: string | null;
    logo: string;
    isActive: boolean;
    registeredBy: string | null;
    isMFA: number;
    sendMfaCodeToEmail: number;
    sendMfaCodeToPhone: number;
    sendMfaCodeToAuthApp: number;
    totpSecret: string;
    landlineNo: string;
    route: string;
    userId: number;
    userType: string;
    scheduledDay: boolean;
    scheduledTime: string;
    eidDoc: string | null;
    trnExpiry: string | null;
    packageId: number;
    credentialId: number;
    role: string;
    username: string;
    password: string;
    passwordResetToken: string;
    balance: string;
    registeredByName?: string;
};

export type CorporateUserData = { result: CorporateUser[] };

export type createDisabledService = {
    serviceOperatorIds: (number | string)[];
    credentialId: number | string | undefined;
};
export type search = {
    searchOperator?: number | string | undefined;
    searchCorporate?: number | string | undefined;
};
export type RolePermissionAccessData = {
    view?: boolean;
    write?: boolean;
    update?: boolean;
};
