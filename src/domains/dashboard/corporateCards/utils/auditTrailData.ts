import { CardAuditCategory, CardAuditEvent } from './types';

/** Static demo data for the per-card Audit Trail modal. Swap for live API data later. */

export const AUDIT_TRAIL_SUBTITLE =
    'Chronological log of every change and action performed on this card.';

/** Filter pills; 'All events' shows everything, the rest filter by category. */
export const AUDIT_FILTERS: ('All events' | CardAuditCategory)[] = [
    'All events',
    'Lifecycle',
    'Limits',
    'Controls',
    'Security',
];

export const AUDIT_EVENTS: CardAuditEvent[] = [
    {
        key: 'audit-1',
        title: 'Updated per-transaction limit',
        description: 'Changed from ₹12,000 to ₹15,000',
        timestamp: '2024-10-22 14:32',
        actor: 'Aarav Sharma (Admin)',
        category: 'Limits',
    },
    {
        key: 'audit-2',
        title: 'Added merchant restriction',
        description: 'Blocked category: ATM & Cash',
        timestamp: '2024-10-20 09:14',
        actor: 'Aarav Sharma (Admin)',
        category: 'Controls',
    },
    {
        key: 'audit-3',
        title: 'Transaction declined',
        description: 'Geo restriction — attempted use in blocked region',
        timestamp: '2024-10-18 17:05',
        actor: 'System',
        category: 'Security',
    },
    {
        key: 'audit-4',
        title: 'Card unfrozen',
        description: 'Manual action via card management',
        timestamp: '2024-10-15 11:48',
        actor: 'Rohan Mehta (Admin)',
        category: 'Lifecycle',
    },
    {
        key: 'audit-5',
        title: 'Card issued',
        description: 'Physical card assigned to Rohan Mehta',
        timestamp: '2024-10-15 11:48',
        actor: 'Rohan Mehta (Admin)',
        category: 'Lifecycle',
    },
];
