import { lazy } from 'react';

const InsuranceList = lazy(() => import('@src/domains/dashboard/insurance/pages/InsuranceList'));

const HealthInsurance = lazy(
    () => import('@src/domains/dashboard/insurance/pages/health/HealthInsurance')
);
const HealthInsuranceList = lazy(
    () => import('@src/domains/dashboard/insurance/pages/health/HealthInsuranceList')
);
const HealthInsuranceDetails = lazy(
    () => import('@src/domains/dashboard/insurance/pages/health/HealthInsuranceDetails')
);

const CarInsurance = lazy(() => import('@src/domains/dashboard/insurance/pages/car/CarInsurance'));
const CarInsuranceList = lazy(
    () => import('@src/domains/dashboard/insurance/pages/car/InsuranceList')
);
const CarInsuranceDetails = lazy(
    () => import('@src/domains/dashboard/insurance/pages/car/DetailPage')
);

const BikeInsurance = lazy(
    () => import('@src/domains/dashboard/insurance/pages/bike/BikeInsurance')
);
const BikeInsuranceList = lazy(
    () => import('@src/domains/dashboard/insurance/pages/bike/InsuranceList')
);
const BikeInsuranceDetails = lazy(
    () => import('@src/domains/dashboard/insurance/pages/bike/DetailPage')
);

const TaxiInsurance = lazy(
    () => import('@src/domains/dashboard/insurance/pages/taxi/TaxiInsurance')
);
const TaxiInsuranceList = lazy(
    () => import('@src/domains/dashboard/insurance/pages/taxi/InsuranceList')
);
const TaxiInsuranceDetails = lazy(
    () => import('@src/domains/dashboard/insurance/pages/taxi/DetailPage')
);

// -----------------------------------------------------------------------

export const insuranceRoutes = [
    { element: <InsuranceList />, index: true },
    {
        path: 'health',
        children: [
            { index: true, element: <HealthInsurance /> },
            { path: 'list', element: <HealthInsuranceList /> },
            { path: 'details', element: <HealthInsuranceDetails /> },
        ],
    },
    {
        path: 'car',
        children: [
            { index: true, element: <CarInsurance /> },
            { path: 'list', element: <CarInsuranceList /> },
            { path: 'details', element: <CarInsuranceDetails /> },
        ],
    },
    {
        path: 'bike',
        children: [
            { index: true, element: <BikeInsurance /> },
            { path: 'list', element: <BikeInsuranceList /> },
            { path: 'details', element: <BikeInsuranceDetails /> },
        ],
    },
    {
        path: 'taxi',
        children: [
            { index: true, element: <TaxiInsurance /> },
            { path: 'list', element: <TaxiInsuranceList /> },
            { path: 'details', element: <TaxiInsuranceDetails /> },
        ],
    },
];
