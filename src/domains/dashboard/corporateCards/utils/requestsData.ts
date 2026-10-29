import { TabItem } from './types';

/** Copy + sub-tab config for the cardholder "My Requests" view (the request tables are API-backed). */

export const MY_REQUESTS_COPY = {
    title: 'My requests',
    subtitle: 'Request a new card or a top-up on an existing one.',
};

/** In-page sub-tabs (also the "My Requests" nav dropdown children). */
export const REQUEST_TABS: TabItem[] = [
    { key: 'card-requests', label: 'Card requests' },
    { key: 'limit-increase-requests', label: 'Limit increase requests' },
    { key: 'physical-card-requests', label: 'Physical card requests' },
    { key: 'unfreeze-requests', label: 'Unfreeze requests' },
];
