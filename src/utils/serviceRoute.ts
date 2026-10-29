export const MORE_SERVICES_PREFIX = '/more-services';

/**
 * Builds a corporate service's route from its `serviceAccess` entry.
 *
 * Services flagged `enableMoreService` live under the `/more-services` prefix; all
 * others are top-level. This is the single source of truth for label → route
 * derivation used by the sidebar, the More Services page and the access guard —
 * keep the registered routes in `paths.ts` in sync with what this produces.
 */
const ROUTE_OVERRIDES: Record<string, string> = {
    'Tax & More': '/tax-more',
};

export const toServiceRoute = (label: string, enableMoreService?: boolean): string => {
    const override = ROUTE_OVERRIDES[label.trim()];
    if (override) return override;
    const slug = label.trim().toLowerCase().replace(/\s+/g, '-');
    return enableMoreService ? `${MORE_SERVICES_PREFIX}/${slug}` : `/${slug}`;
};

/**
 * The inverse of `toServiceRoute` for the leading path segment, producing the same label casing the
 * access guards compare against. Shared so a caller deciding whether a route is reachable reads the
 * route exactly as the guard will.
 */
export const serviceCategoryFromPath = (pathname: string): string =>
    pathname
        .toLowerCase()
        .split('/')[1]
        ?.split('-')
        .map(word => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ''))
        .join(' ') || '';
