export type ServiceProviderInfo = {
    id: number;
    serviceProvider: string;
    name: string;
    mobile: string;
    email: string;
    preferredMode: string;
    requirement: string;
    createdAt: string;
    updatedAt: string;
    credentialId: number;
};

export type ConnectionRequestData = {
    recordsTotal: number;
    data: ServiceProviderInfo[];
};
