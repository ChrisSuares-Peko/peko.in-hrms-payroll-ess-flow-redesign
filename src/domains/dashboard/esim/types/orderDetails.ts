export type OrderDetailsPayload = {
    userType: string;
    userId: number;
    planId: string;
    iccid: string;
    customerUid?:string
};

interface InstallationGuides {
    [key: string]: string;
}

export interface EsimPackageDetails {
    id: number;
    code: string;
    data: string;
    type: string;
    price: number;
    package: string;
    currency: string;
    quantity: string;
    validity: number;
    esim_type: string;
    created_at: string; // Assuming this is a valid date-time string
    package_id: string;
    description: null | string;
    operatorName: string;
    isRechargable: boolean;
    operatorImage: string;
    installation_guides: InstallationGuides;
    manual_installation: string;
    qrcode_installation: string;
    countries?: any[];
    packageType?: string;
    region?: string | null;
}

export interface SimDetails {
    id: number;
    lpa: string;
    iccid: string;
    imsis: null | string;
    qrcode: string;
    apn_type: string;
    apn_value: string;
    created_at: string; // Assuming this is a valid date-time string
    is_roaming: boolean;
    qrcode_url: string;
    airalo_code: null | string;
    matching_id: string;
    confirmation_code: null | string;
}

export interface EsimUsage {
    remaining: number;
    total: number;
    expired_at: string; // Assuming this is a valid date-time string
    is_unlimited: boolean;
    status: string;
    remaining_voice: number;
    remaining_text: number;
    total_voice: number;
    total_text: number;
}

export interface EsimOrderDetails {
    countryName: string;
    networks: string;
    validity: string;
    newTopupData: string;
    esim: string;
    dataBal: string;
    planName?: string;
    activationMode?: string;
    activatedAt?: string | null;
    expiresAt?: string | null;
    lastSeen?: string | null;
    esimState?: string;
    installationUrl?: string;
}
