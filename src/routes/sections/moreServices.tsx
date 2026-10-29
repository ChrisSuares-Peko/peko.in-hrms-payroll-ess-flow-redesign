import { Navigate, useLocation } from 'react-router-dom';

import { toServiceRoute } from '@utils/serviceRoute';

/**
 * Services whose canonical route is TOP-LEVEL (e.g. `/corporate-cards`, `/insurance`).
 *
 * When such a service is flagged `enableMoreService`, the sidebar / More Services page
 * link to `toServiceRoute(label, true)` = `/more-services/<slug>`. We can't re-mount
 * the service's route tree under that prefix — their landing routes use absolute paths
 * (`path: paths.dashboard.*`) that React Router refuses to nest under a different
 * parent — so instead we register a redirect from `/more-services/<slug>` to the
 * canonical top-level route (the label slug equals the canonical path segment).
 *
 * Services already registered under `/more-services/*` (Business Emails, Compliance,
 * Connect, eSign, WPS, Hike, PRO service, Peko Start, Business Services, Works,
 * Zero Carbon, Business Docs, License Renewal, Document Attestation, Office Address)
 * need nothing here — those paths resolve directly in dashboard.tsx.
 *
 * Labels MUST match the serviceAccess `label` exactly. Add a label here when a
 * top-level service becomes a More Services candidate.
 */
const TOP_LEVEL_MORE_SERVICE_LABELS = [
   
    'Office Supplies',
    'Logistics',
    'Government Services'
];

// Redirects `/more-services/<rest>` → `/<rest>` (strips the prefix), preserving any
// sub-path and query. The stripped path is the service's canonical top-level route.
const StripMoreServicesPrefix = () => {
    const { pathname} = useLocation();
    return <Navigate to={pathname || '/'} replace />;
};

export const moreServiceRoutes = TOP_LEVEL_MORE_SERVICE_LABELS.map(label => ({
    // trailing `/*` so sub-paths under the alias redirect too, not just the landing.
    path: `${toServiceRoute(label, true)}/*`,
    element: <StripMoreServicesPrefix />,
}));

export default moreServiceRoutes;
