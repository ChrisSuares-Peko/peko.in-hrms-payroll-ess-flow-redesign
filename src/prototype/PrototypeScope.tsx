// PROTOTYPE-SETUP: isolates the prototype to Payroll, ESS and Onboarding by redirecting any other
// service route to /payroll. Other modules' routes and code stay in place; they are only unreachable.
import { ReactNode } from 'react';

import { Navigate, useLocation } from 'react-router-dom';

import { paths } from '@src/routes/paths';

// First path segments that stay reachable inside the dashboard layout.
const ALLOWED_SEGMENTS = new Set(['payroll', 'ess', 'onboarding']);

export const isPrototypeRoute = (pathname: string) =>
    ALLOWED_SEGMENTS.has(pathname.toLowerCase().split('/')[1] ?? '');

const PrototypeScope = ({ children }: { children: ReactNode }) => {
    const { pathname } = useLocation();
    if (!isPrototypeRoute(pathname)) {
        return <Navigate to={paths.dashboard.payroll} replace />;
    }
    return <>{children}</>;
};

export default PrototypeScope;
