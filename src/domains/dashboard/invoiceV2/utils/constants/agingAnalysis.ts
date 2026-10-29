export interface AgingFilterOption {
    key: string;
    label: string;
    color?: string;
}

export const AGING_BUCKET_CONFIG: Record<string, { label: string; color: string }> = {
    current:   { label: 'Current',    color: '#22C55E' },
    '1_to_30': { label: '1–30 days',  color: '#FACC15' },
    '31_to_60':{ label: '31–60 days', color: '#FB923C' },
    '61_to_90':{ label: '61–90 days', color: '#F97316' },
    above_90:  { label: '90+ days',   color: '#EF4444' },
};

export const AGING_BUCKET_LABEL_TO_KEY: Record<string, string> = Object.fromEntries(
    Object.entries(AGING_BUCKET_CONFIG).map(([key, { label }]) => [label, key])
);

export const AGING_FILTER_OPTIONS: AgingFilterOption[] = [
    { key: 'all', label: 'All' },
    ...Object.entries(AGING_BUCKET_CONFIG).map(([key, { label, color }]) => ({ key, label, color })),
];
