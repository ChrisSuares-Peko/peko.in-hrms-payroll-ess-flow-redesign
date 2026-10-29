import dayjs, { Dayjs } from 'dayjs';

// Ticket 31321: a refresh re-pulls the RC from a paid vendor API, so it is capped at one per vehicle
// per week. The backend enforces the same window; this is the client-side copy that stops a repeat
// click from ever reaching (and being billed by) the vendor.
export const REFRESH_COOLDOWN_DAYS = 7;

const REFRESH_DATE_FORMAT = 'DD MMM YYYY';

export const getNextRefreshOn = (lastRefreshedAt?: string | null): Dayjs | null =>
    lastRefreshedAt ? dayjs(lastRefreshedAt).add(REFRESH_COOLDOWN_DAYS, 'day') : null;

/** A vehicle that has never been refreshed is always allowed. */
export const isRefreshAllowed = (lastRefreshedAt?: string | null): boolean => {
    const nextRefreshOn = getNextRefreshOn(lastRefreshedAt);
    return !nextRefreshOn || !nextRefreshOn.isAfter(dayjs());
};

export const formatRefreshDate = (date?: string | Dayjs | null): string =>
    date ? dayjs(date).format(REFRESH_DATE_FORMAT) : '';

export const nextRefreshMessage = (date?: string | Dayjs | null): string => {
    const formatted = formatRefreshDate(date);
    // No date to quote (an unexpected server payload) — say the useful half rather than a blank date.
    return formatted
        ? `Next refresh available on ${formatted}`
        : 'This vehicle was refreshed recently. Please try again later.';
};

export const lastRefreshedMessage = (lastRefreshedAt?: string | null): string =>
    lastRefreshedAt ? `Last refreshed on: ${formatRefreshDate(lastRefreshedAt)}` : '';
