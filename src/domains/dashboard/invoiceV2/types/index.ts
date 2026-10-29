export type StatCardItem = {
    id: string;
    label: string;
    value: string;
    bgColor: string;
    icon: string;
    growthPercent?: number;
};

export type InvoiceType = 'DOMESTIC' | 'INTERNATIONAL';
