export type AccountScope = 'internal';

export const ACCOUNT_SCOPE_PARAM = 'accounts';

export const ACCOUNT_SCOPE_LABEL = 'Accounts';

export const INTERNAL_ACCOUNTS_LABEL = 'Internal purchase accounts';

export const ACCOUNT_SCOPE_OPTIONS = [
    { value: '', label: 'All accounts' },
    { value: 'internal', label: INTERNAL_ACCOUNTS_LABEL },
];

export const accountScopeOf = (value: string | null | undefined): AccountScope | '' =>
    value === 'internal' ? 'internal' : '';

export const withAccountScope = (url: string | undefined, scope?: AccountScope | '') =>
    url && scope ? `${url}&${ACCOUNT_SCOPE_PARAM}=${scope}` : url;
