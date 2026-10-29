/**
 * Poll window after a live city /search so later sellers' on_search rows appear.
 * Catalog itself is shared in the DB by city — no per-session transaction ids.
 */

const cityPollDeadline = new Map<string, number>();

export const CATALOG_POLL_MS = 2000;
// Sellers' on_search often lands well after 30s; stopping early left the page empty until a refresh.
export const CATALOG_POLL_WINDOW_MS = 120000;

export const startCityPoll = (city: string) => {
    cityPollDeadline.set(city, Date.now() + CATALOG_POLL_WINDOW_MS);
};

export const getCityPollDeadline = (city?: string | null): number => {
    if (!city) return 0;
    return cityPollDeadline.get(city) || 0;
};

export const resetCatalogSessionForTests = () => {
    cityPollDeadline.clear();
};
