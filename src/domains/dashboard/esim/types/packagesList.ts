interface Image {
    width: number;
    height: number;
    url: string;
}

interface Network {
    name: string;
    types: string[];
}

interface Coverage {
    name: string;
    networks: Network[];
}

export interface Package {
    id: string;
    type: string;
    price: number;
    amount: number;
    day: number;
    is_unlimited: boolean;
    title: string;
    data: string;
    esimType?: string;
    short_info: null | string;
    qr_installation: string;
    manual_installation: string;
    voice: null | string;
    text: null | string;
    net_price: number;
}

export interface Country {
    country_code: string;
    title: string;
    image: Image;
}

export type Operator = {
    id: string;
    style: string;
    gradient_start: string;
    gradient_end: string;
    type: string;
    is_prepaid: boolean;
    title: string;
    esim_type: string;
    warning: null | string;
    apn_type: string;
    apn_value: string;
    is_roaming: boolean;
    info: null | string;
    image: Image;
    plan_type: string;
    activation_policy: string;
    is_kyc_verify: boolean;
    rechargeability: boolean;
    other_info: null | string;
    coverages: Coverage[];
    packages: Package[];
    countries: Country[];
};

export type PackageListItem = {
    slug: string;
    country_code: string;
    title: string;
    image: Image;
    operators: Operator[];
};

export type PackageList = {
    packages: PackageListItem[];
    usdToINR: number;
};

export type PackageListPayload = {
    userType: string;
    userId: number;
    esimType: string;
    countryCode: string;
};

export type IPackageCard = {
    image: string;
    voice: string | null;
    data: string;
    coverage: Country[];
    sms: string | null;
    validity: number;
    price: number;
    conversionRate: number;
    title: string;
    id: string;
};
