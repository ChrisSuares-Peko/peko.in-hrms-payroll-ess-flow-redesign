export type StatCardItem = {
    id: string;
    label: string;
    value: string;
    bgColor: string;
    icon: string;
    badge?: 'growth' | 'text';
    badgeValue?: string;
};