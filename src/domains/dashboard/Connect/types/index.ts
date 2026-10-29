export type ServiceProvider = {
    id: number;
    serviceProvider: string;
    tagline: string;
    address: string;
    category: string;
    description: string;
    offerings: string;
    email: string;
    website: string;
    mobileNo: string;
    rewards: string;
    logo: string;
    status: boolean;
    createdAt: string;
    updatedAt: string;
};

export type ConnectPayload = {
    userId: number;
    userType: string;
};

export type ConnectListResponse = {
    data: ServiceProvider[];
};

export type ConnectTableData = {
    id: number;
    name: string;
    image: string;
    tagline: string;
    offer: string;
}[];

export type ConnectDetailPayload = ConnectPayload & {
    serviceID?: string;
};

export type ConnectDetails = {
    id: number;
    serviceProvider: string;
    tagline: string;
    address: string;
    category: string;
    description: string;
    offerings: string;
    services: string[];
    email: string;
    website: string;
    mobileNo: string;
    rewards: string;
    logo: string;
};

export type ConnectDetailResponse = {
    data: ConnectDetails;
};

export type ConnectRequestResponse = {
    id: number;
    serviceProvider: string;
    credentialId: string;
    name: string;
    mobile: string;
    email: string;
    requirement: string;
    preferredMode: string;
    updatedAt: string;
    createdAt: string;
};

export type ConnectRequestPayload = {
    name: string;
    email: string;
    mobile: string;
    preferredMode: string;
    requirement: string;
    userType?: string;
    credentialId?: number;
    connectId?: number;
};
