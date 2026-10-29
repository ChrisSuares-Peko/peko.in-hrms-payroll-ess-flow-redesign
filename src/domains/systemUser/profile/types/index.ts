export type UserData = {
    id: number;
    email: string;
    mobileNo: string | null;
    isActive: boolean;
    registeredBy: string;
    portalUrl: string | null;
    createdAt: string;
    updatedAt: string;
    credentialId: number;
    balance: string;
    'credential.username': string;
    'credential.name': string;
};

export type updateProfile = {
    mobileNo: string | number;
    email: string;
    id?: number;
    username: string;
};
export type updatePassword = {
    oldPassword: string;
    newPassword: string;
};
