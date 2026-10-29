export type country = {
    name: string;
    id: string;
};

export type countryList = {
    country: string;
    code?: string;
};

export type regionList = {
    code: string;
    region: string;
    countries: Array<{ code: string; name: string }>;
};

export type TravelType = 'single' | 'regional' | 'multi';

type DataOption = {
    planId: string;
    dataGB: string;
    validityDays: string;
};

export type DataOptions = Array<DataOption>;

export type PlanData = {
    planId: string;
    amount: number;
    name: string;
    country: string;
    dataMBs: string | number;
    periodDays: string | number;
};
