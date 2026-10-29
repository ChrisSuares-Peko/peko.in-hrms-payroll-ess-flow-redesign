import { TabItem } from './types';
/**
 * Demo data for the Corporate Cards dashboards that has no backend yet. The KPI tiles, spend charts, card
 * utilisation, wallet figures, card lists and statement are all API-backed now; what remains here is the tab
 * config, the Recent Transactions panel (kept as demo by product decision), the not-yet-wired Approval
 * Requests tables, and the daily-spend chart colour.
 */

/** Bar/series colours — hex mirrors Tailwind tokens (red → textLightRed, green → savingsTagLightText). */
const BAR = { red: '#FF4F4F', green: '#43B75D', chart: '#F4B6B6' } as const;

/* ------------------------------------------------------------------ *
 * In-page tab bars
 * ------------------------------------------------------------------ */
export const CORPORATE_TABS: TabItem[] = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'cards', label: 'Cards' },
    { key: 'transactions', label: 'Card Transactions' },
    { key: 'my-requests', label: 'My Requests' },
];

export const ADMIN_TABS: TabItem[] = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'wallet', label: 'Pre Funding Wallet' },
    { key: 'cards', label: 'Cards' },
    { key: 'people', label: 'People' },
    { key: 'transactions', label: 'Card Transactions' },
    { key: 'account-statement', label: 'Account Statement' },
    { key: 'approval-requests', label: 'Approval Requests' },
    { key: 'settings', label: 'Settings' },
];

/** Daily-spend chart bar colour, consumed by DailySpendChart. */
export const DAILY_SPEND_CHART_COLOR = BAR.chart;

export const formatAmountAsK = (value: number): string => {
    if (value === 0) return '₹0';
    if (value < 1000) return `₹${Math.round(value).toLocaleString('en-IN')}`;
    const kValue = Math.round(value / 1000);
    return `₹${kValue}K`;
};