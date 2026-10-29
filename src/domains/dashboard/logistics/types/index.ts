export interface RequestPayload {
    userId: number;
    userType: string;
}
export interface DataType {
    key: number;
    trackingNo: string | number;
    shipper: {
        Line1: string;
        Line2: string;
        Line3: string;
        City: string;
    };
    receiver: {
        Line1: string;
        Line2: string;
        Line3: string;
        City: string;
    };
    type: string;
    serviceType: string;
    weight: string;
    totalAmount: number | string;
    status?: string;
    OnTriggerChangeStatus: (value: string) => void;
    isLoading: boolean;
    handleModalTrigger: (isOpen: boolean, title: string, triggerFor: string) => void;
    handleUpdateModal: (record: DataType) => void;
}

export interface UpdateOrder {
    customerMobileNo: string;
    customerAddress: string;
}

export type logisticsCountryListing = {
    userId: number;
    userType: string;
    searchText: string;
};

export type logisticsStateListing = {
    userId: number;
    userType: string;
    searchText: string;
};

type ICountryListing = {
    name: string;
    alpha2Code: string;
};

export type ICountryListingResponse = {
    countries: ICountryListing[];
};

type IStateListing = {
    option: string;
    value: string;
};

export type IStateListingResponse = {
    states: IStateListing[];
};

export type commonSelectType = {
    oName: string;
    oValue: string;
};

export type defaultSelectType = {
    label: string;
    value: string;
};

export type logisticsCityListing = {
    userId: number;
    userType: string;
    searchText: string;
    countryCode: string;
};

export type ICityListingResponse = {
    Cities: string[];
};

export type logisticsServiceTypeListing = {
    userId: number;
    userType: string;
    itemType: string;
    shipmentType: string;
};

type IServiceTypeListing = {
    id: string;
    name: string;
    code: string;
};

export type IServiceTypeListingResponse = {
    serviceType: IServiceTypeListing[];
};

// calculateRate API types
export interface Address {
    id?: number;
    Line1: string;
    Line2: string;
    Line3: string;
    City: string;
    State?: string;
    PostCode?: string;
    CountryCode: string;
    Description: string;
    POBox?: string | null;
    Remark?: string;
    saveSenderAddress?: boolean;
}

export interface MerchantProfile {
    profileName: string;
    merchantEmail: string;
    merchantMobileNo: string;
    merchantAddress: string;
    merchantCity: string;
    merchantPinCode?: string;
    merchantRemarks?: string;
    saveSenderAddress: boolean;
}

export interface shipmentDetailsMin {
    packageWeight: string;
    serviceType: string;
    orderCategory: string;
    recieveSMS: boolean;
    orderDate: string;
}

export interface shippingAmount {
    charges: number;
    city: string;
}
export interface calculateRatePayload extends shipmentDetailsMin {
    userType: string;
    userId: number;
    originPinCode: string;
    destinationPinCode: string;
}

export type ICalculateRateResponse = {
    charges: number;
    city: string;
};

// logistics payment type

export interface trackShipmentPayload {
    userType: string;
    userId: number;
    providerId: string;
}

export type ShipmentDetailForm = {
    totalWeight: string;
    serviceType: string;
    pickupDate: string;
    recieveSMS: boolean;
    orderCategory: string;
};
