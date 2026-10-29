import FAQ from '@src/domains/dashboard/needHelp/pages/FAQ';
import Reports from '@src/domains/dashboard/Reports/pages/Reports';

import { paths } from '../paths';

// -----------------------------------------------------------------------

export const reportsRoutes = [
    { element: <Reports />, index: true },
    { element: <FAQ />, path: paths.needHelp.faq },
];
