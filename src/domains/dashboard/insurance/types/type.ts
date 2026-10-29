export interface IconCardProps {
    icon: string;
    title: string;
    path: string;
}

export interface personList {
    id?: number;
    personName: string;
    isIncrease: boolean;
}

export interface insuranceType {
    id: number;
    logo: string;
    name: string;
    claimRate: number;
    cover: string;
    cashlessHospitals: string;
    benefits: string[];
    price: number;
    period: string;
    emiStart: number;
}

export interface policyPeriodType {
    id?: number;
    duration: string;
    price: number;
    discount?: number;
}

export interface policyOptionsType {
    value: string;
    price: string;
    duration: string;
}

export interface tabDetailsSectionType {
    title: string;
    description: string;
}

export interface FeaturesDetailsProps {
    icon: string;
    details: tabDetailsSectionType[];
    needRedLine?: boolean;
    width?: number;
}

export interface AddonsDataType {
    title: string;
    description: string;
    price?: number;
}
