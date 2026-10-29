export type CorporateRechargeData = {
    corporateId: string;
    corporateName: string;
    rechargeAmount: string;
    accountNo: string;
    service: string;
    merchantCommission: string;
    adminCommission: string;
    serviceType: string;
    transactionId: string;
    orderId: string;
    providerId: string;
    surcharge: string;
    serviceOperatorId: string;
    categoryName: string;
    remarks: string;
    otp?: string;
    idempotencyKey?: string;
};

export type corporateDatas = {
    name: string;
    id: number;
    credentialId: number;
    city: string;
    mobileNo: string;
    username: string;
    balance: string;
};

export type corporateDataResp = {
    result: corporateDatas[];
};
export type ServiceResp = {
    data: ServiceData[];
};

export type ServiceData = {
    id: number;
    serviceProvider: string;
    serviceCategory: string;
};
export type RolePermissionAccessData = {
    view?: boolean;
    write?: boolean;
    update?: boolean;
};
