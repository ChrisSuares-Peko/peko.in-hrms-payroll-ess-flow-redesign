import { TabItem } from './types';

/** Copy for the admin "People" page. Members come from the card-users API, never from here. */

/* ------------------------------------------------------------------ *
 * Page copy
 * ------------------------------------------------------------------ */
export const PEOPLE_COPY = {
    title: 'People',
    subtitle: 'Manage your team, roles, KYC status, and team structure.',
    inviteMember: 'Invite member',
    rolesNote: 'What each role can do is listed in Settings → Roles & Permissions.',
} as const;

/* Department + Role are fixed while the fields are hidden from the invite form. */
export const DEFAULT_MEMBER_DEPARTMENT = 'IT';
export const DEFAULT_MEMBER_ROLE = 'Employee';

/* ------------------------------------------------------------------ *
 * Page sub-tabs
 * ------------------------------------------------------------------ */
export const PEOPLE_TABS: TabItem[] = [
    { key: 'members', label: 'Members' },
    { key: 'membership-requests', label: 'Request for Membership' },
];
