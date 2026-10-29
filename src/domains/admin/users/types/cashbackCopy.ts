export type PriceOrDiscount = {
    monthly?: number | string | null;
    annually?: number | string | null;
};

export type CopyPackage = {
    id: number;
    packageName: string;
    aliasName: string | null;
    packageType: string | null;
    accessCode: string | null;
    partnerId: string | null;
    type: string | null;
    status: boolean | number;
    packagePrices?: PriceOrDiscount | null;
    discount?: PriceOrDiscount | null;
};

export type CopyCashback = {
    id: number;
    packageId: number;
    serviceOperatorId: number;
    cashbackType: string;
    cashback: string;
    surcharge: string;
    surchargeType: string;
    unitPrice: string;
    baseLimit: string;
    serviceStatus: boolean | number;
    package: { id: number; packageName: string; aliasName?: string | null };
    serviceOperator: {
        id: number;
        serviceProvider: string;
        serviceCategory?: string;
        accessKey?: string;
    };
};

export type CopyComparePayload = {
    from: { packages: CopyPackage[]; cashbacks: CopyCashback[] };
    to: { packages: CopyPackage[]; cashbacks: CopyCashback[] };
};

export type AddCashbacksPayload = {
    toPackageId: number;
    sourceCashbackIds: number[];
};

export type AddCashbacksResult = {
    created: CopyCashback[];
    createdCount: number;
    skippedDuplicates: { sourceCashbackId: number; serviceOperatorId: number }[];
};

export type ClonePackagePayload = {
    fromPackageId: number;
    toPartnerId: string;
    overrides?: {
        packageName?: string;
        aliasName?: string;
        packagePrices?: PriceOrDiscount;
        discount?: PriceOrDiscount;
    };
};
