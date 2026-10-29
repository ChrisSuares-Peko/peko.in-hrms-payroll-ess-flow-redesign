import { useCallback, useEffect, useState } from 'react';

import { Navigate, useLocation } from 'react-router-dom';

import { isRouteAllowedInEmployeeMode } from '@src/domains/dashboard/corporateCards/utils/activeRole';
import CorporateAccessDenied from '@src/domains/failed/pages/CorporateAccessDenied';
import { useAppSelector } from '@src/hooks/store';
// import { paths } from '@src/routes/paths';
import { checkServiceAccessAndSubService } from '@utils/checkAccess';
import { serviceCategoryFromPath, toServiceRoute } from '@utils/serviceRoute';

import CorporateAccessLoadingSkeleton from './CorporateAccessLoadingSkeleton';

type CorporateAccessGuardProps = {
    children: React.ReactNode;
};

const whitelabeledRoutes = [
    'payments',
    'service not available',
    'plans',
    'profile',
    'peko club',
    'notifications',
    'early access',
    'service down',
    'peko credit',
    'procure',
    'more services',
    'session expired',
    'compliance',
    'tax more', // TODO: remove once admin enables "Tax More" service access
    // Interim: the Corporate Cards service has no backend accessKey yet, so it can't pass the
    // subscription check. Allow the route while the UI is in development; remove once the
    // backend ships the accessKey + subscription entitlement.
    'corporate cards',
];

// Corporate travel sub-routes not yet in backend services config — grant access if parent service is accessible
const whitelabeledCorpTravelSubRoutes = ['bus'];

export default function CorporateAccessGuard({ children }: CorporateAccessGuardProps) {
    const { roleName } = useAppSelector(state => state.reducer.auth);
    const { services, servicesLoadFailed } = useAppSelector(state => state.reducer.services);
    // The Employee account is its own identity, so a corporate session is never restricted to it.
    const employeeModeOnly = false;
    const location = useLocation();
    const currentPath = location.pathname.toLowerCase();

    const [grantAccess, setGrantAccess] = useState<boolean | null>(null);

    const serviceCategory = serviceCategoryFromPath(currentPath);

    const subService =
        currentPath
            .split('/')[2]
            ?.split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ') || '';
    let hasAccess = false;

    if (whitelabeledRoutes.includes(serviceCategory.toLowerCase())) {
        hasAccess = true;
    } else if (
        serviceCategory.toLowerCase() === 'corporate travel' &&
        whitelabeledCorpTravelSubRoutes.includes(currentPath.split('/')[2] || '')
    ) {
        hasAccess = checkServiceAccessAndSubService(serviceCategory, '');
    } else {
        hasAccess = checkServiceAccessAndSubService(serviceCategory, subService);
    }

    // More Services items are flattened into top-level serviceAccess entries, each
    // with its own hasAccess. For a `/more-services/<slug>` route the real service
    // is the 2nd path segment, so enforce that promoted service directly instead of
    // the "More Services" umbrella entry (whose subServices are empty and would
    // otherwise grant every child route). The bare `/more-services` landing page has
    // no 2nd segment, so it still falls through to the umbrella check.
    const isMoreServiceRoute = serviceCategory.toLowerCase() === 'more services';
    const accessGranted =
        isMoreServiceRoute && subService
            ? checkServiceAccessAndSubService(subService)
            : checkServiceAccessAndSubService(serviceCategory, subService);

    hasAccess = services?.data?.length
        ? whitelabeledRoutes.includes(serviceCategory.toLowerCase()) || accessGranted
        : false;

    if (employeeModeOnly && !isRouteAllowedInEmployeeMode(serviceCategory)) {
        hasAccess = false;
    }

    const checkRole = useCallback(() => {
        if (hasAccess) {
            setGrantAccess(true);
        } else setGrantAccess(false);
    }, [hasAccess]);

    useEffect(() => {
        checkRole();
    }, [checkRole]);
    // A failed services fetch says nothing about entitlement. Refusing on it turned every transient error —
    // and a privacy policy the account has not accepted yet — into "you do not have permission", which is
    // both wrong and unactionable: the real error has already been surfaced as a toast or a modal.
    if (grantAccess === null || !services || servicesLoadFailed) {
        return <CorporateAccessLoadingSkeleton />;
    }

    if (serviceCategory.toLowerCase() === 'dashboard' && grantAccess === false) {
        if (roleName === 'corporate sub user') {
            const firstRoute = services?.data.find(obj => obj.hasAccess === true);
            if (firstRoute?.label) {
                return (
                    <Navigate to={toServiceRoute(firstRoute.label, firstRoute.enableMoreService)} />
                );
            }
        }
    }
    if (grantAccess === false) {
        return <CorporateAccessDenied />;
    }
    if (grantAccess === null) {
        return null;
    }

    return <>{children}</>;
}
