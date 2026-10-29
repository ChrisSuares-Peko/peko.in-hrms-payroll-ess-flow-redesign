export interface TopUpPlan {
    id: string;
    type: string;
    price: number;
    amount: number;
    day: number;
    is_unlimited: boolean;
    title: string;
    data: string;
    short_info: string;
    voice: null | string;
    text: null | string;
    net_price: number;
}

export type TopUpPlanList = {
    planList: TopUpPlan[];
    usdToINR: number;
};

export type TopUpPayload = {
    userType: string;
    userId: number;
    iccid: string;
};

type DataOption = {
    country: string;
    dataGB: string;
    validityDays: string;
    periodDays: string;
    planId?: string;
    price?: number;
    currency?: string;
};

export type getPlanDetailsResponse = Array<DataOption>;
