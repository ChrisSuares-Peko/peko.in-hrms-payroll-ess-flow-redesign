import { type HostingPlan } from '../hooks/useHostingPlans';

export const ACRONIS_PRICE_PER_GB = null;

export const SERVER_LOCATION_MAP: Record<string, string> = { india: 'in', us: 'us' };

export const OS_ICON_MAP: Record<string, { label: string; src: string }> = {};

export const CONTROL_PANEL_OPTIONS = [
    { label: 'None', value: 'none' },
    { label: 'cPanel / WHM', value: 'cpanel' },
    { label: 'Plesk', value: 'plesk' },
];

export const formatControlPanel = (value?: string): string => {
    if (!value) return '';
    return value
        .split('_')
        .map(word => word.toLowerCase() === 'cpanel' ? 'cPanel' : word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

export const formatMb = (mb: number): string => {
    if (mb >= 1048576) return `${(mb / 1048576).toFixed(0)} TB`;
    if (mb >= 1024) return `${(mb / 1024).toFixed(0)} GB`;
    return `${mb} MB`;
};

export const tenureLabel = (months: number): string => {
    if (months < 12) return `${months} Month${months > 1 ? 's' : ''}`;
    if (months === 12) return '1 Year';
    return `${months / 12} Years`;
};

export const getTenureOptions = (plan: HostingPlan) =>
    Object.keys(plan.pricingDetails?.add ?? {})
        .map(Number)
        .sort((a, b) => a - b)
        .map(months => ({ value: months, label: tenureLabel(months) }));

export const getDefaultTenure = (plan: HostingPlan): number => {
    const keys = Object.keys(plan.pricingDetails?.add ?? {})
        .map(Number)
        .sort((a, b) => a - b);
    return keys[keys.length - 1] ?? 12;
};

export const getPriceForTenure = (plan: HostingPlan, tenure: number): number | null =>
    plan.pricingDetails?.add?.[String(tenure)] ?? plan.price ?? null;
