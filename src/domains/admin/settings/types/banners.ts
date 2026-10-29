export type getData = {
    page: number;
    searchText: string;
    itemsPerPage: number;
    sort: string;
    deviceType: string;
    type?: string;
    sortField?: string;
};

export type updateStatus = {
    bannerId?: string | number;
    status: any;
};
export type activeResponse = {
    data: string;
};

export type Banner = {
    id: number;
    bannerTitle: string;
    bannerLink: string;
    description: string;
    highlights: string;
    bannerImage: string;
    status: number;
    deviceType: string;
    buttonText?: string;
    partnerId: string | number | null;
    position: string;
    createdAt: string;
    updatedAt: string;
    bannerType: 'SUBSCRIPTION' | 'OTHER';
};

export type BannerData = {
    count: number;
    rows: Banner[];
};
export type refresh = {
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
};

export type NewBanner = {
    id?: number;
    bannerTitle?: string;
    bannerLink?: string;
    description?: string;
    highlights?: string;
    deviceType?: string;
    bannerImage?: string;
    bannerFormat?: string;
    format?: string;
    position?: string;
    buttonText?: string;
    partnerId?: string | number | null;
    status?: boolean;
};

export type DeviceType = {
    value: string;
    label: string;
};

export type DeviceTypeData = {
    deviceType: DeviceType[];
};

export type RolePermissionAccessData = {
    view?: boolean;
    write?: boolean;
    update?: boolean;
};
