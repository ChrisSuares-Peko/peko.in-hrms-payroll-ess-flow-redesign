import { lazy } from 'react';

const Settings = lazy(() => import('@src/domains/dashboard/settings/pages/Settings'));

// -----------------------------------------------------------------------

export const settingsRoutes = [{ element: <Settings />, index: true }];
