import { lazy } from 'react';

import { paths } from '@routes/paths';

const BDocsCategory = lazy(() => import('@src/domains/dashboard/BusinessDocs/pages/BDocsCategory'));
const CategoryDetailed = lazy(
    () => import('@src/domains/dashboard/BusinessDocs/pages/CategoryDetailed')
);

// -----------------------------------------------------------------------

export const bussinessDocsRoutes = [
    { element: <BDocsCategory />, index: true },
    { element: <CategoryDetailed />, path: `${paths.businessDocs.category}` },
];
