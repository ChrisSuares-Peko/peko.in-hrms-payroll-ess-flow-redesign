export type UserPayload = {
    userId: number;
    userType: string;
};

export type SelfTransferPayload = {
    type: string;
    amount: string;
    password: string;
    credentialId?: string;
    remarks?: string;
    otp?: string;
    idempotencyKey?: string;
};

export type selfTransferPayload = SelfTransferPayload & UserPayload;

export type selfTransferResponse = {
    finalBalance: string;
};

export type transferFundsResponse = {
    corporateFinalBalance: string;
    adminFinalBalance: string;
};

export type walletDetailsResponse = {
    balance: string;
    credentialId: number;
    role: string;
    username: string;
    roleName: string;
    companyName: string;
};

export type transferFundsDetailsResponse = {
    registeredByName?: string;
    balance: string;
    credentialId: number;
    id: number;
    username: string;
    name: string;
    city: string;
    mobileNo: string;
};
export type RolePermissionAccessData = {
    view?: boolean;
    write?: boolean;
    update?: boolean;
};
