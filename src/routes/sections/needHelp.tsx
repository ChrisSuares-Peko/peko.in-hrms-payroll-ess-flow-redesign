import FAQ from '@src/domains/dashboard/needHelp/pages/FAQ';
import NeedHelp from '@src/domains/dashboard/needHelp/pages/NeedHelp';

import { paths } from '../paths';

// -----------------------------------------------------------------------

export const needHelpRoutes = [
    { element: <NeedHelp />, index: true },
    { element: <FAQ />, path: paths.needHelp.faq },
];
