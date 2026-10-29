import { lazy } from 'react';

import SoftwareLayout from '@src/domains/dashboard/softwares/layout/SoftwareLayout';

import { paths } from '../paths';

// import SubscriptionCompanyDetails from '@src/domains/dashboard/Subscriptions/pages/SubscriptionCompanyDetails';

// const SubscriptionsListingPage = lazy(
//     () => import('@src/domains/dashboard/Subscriptions/pages/SubscriptionsListing')
// );
// const SubscriptionsDetailedView = lazy(
//     () => import('@src/domains/dashboard/Subscriptions/pages/SubscriptionsDetailedView')
// );

// const SubscriptionOrderHistory = lazy(
//     () => import('@src/domains/dashboard/Subscriptions/pages/SubscriptionOrderHistory')
// );

const HomePage = lazy(() => import('@src/domains/dashboard/softwares/pages/Home'));
const CategoryPage = lazy(() => import('@src/domains/dashboard/softwares/pages/Category'));
const ProductPage = lazy(() => import('@src/domains/dashboard/softwares/pages/Product'));
const FindProductPage = lazy(() => import('@src/domains/dashboard/softwares/pages/FindProduct'));
const FindProductSuccessPage = lazy(
    () => import('@src/domains/dashboard/softwares/pages/FindProductSuccess')
);
const OrderHistoryPage = lazy(() => import('@src/domains/dashboard/softwares/pages/OrderHistory'));
const ManagePlanPage = lazy(() => import('@src/domains/dashboard/softwares/pages/ManagePlan'));

const SubscriptionPlan = lazy(
    () => import('@src/domains/dashboard/softwares/pages/SubscriptionPlan')
);

const SearchResultsPage = lazy(
    () => import('@src/domains/dashboard/softwares/pages/SearchResults')
);

const GetAssistanceSuccess = lazy(
    () => import('@src/domains/dashboard/softwares/pages/GetAssistanceSuccess')
);

export const subscriptionRoutes = [
    // { element: <SubscriptionsListingPage />, index: true },
    // {
    //     element: <SubscriptionsDetailedView />,
    //     path: `${paths.subscriptions.details}${paths.subscriptions.id}`,
    // },
    // {
    //     element: <SubscriptionCompanyDetails />,
    //     path: `${paths.subscriptions.details}${paths.subscriptions.id}/${paths.subscriptions.companyDetails}${paths.subscriptions.id}`,
    // },

    // { element: <SubscriptionOrderHistory />, path: paths.subscriptions.orderHistory },
    {
        element: <SoftwareLayout />,
        children: [
            { element: <HomePage />, index: true },
            { element: <CategoryPage />, path: `${paths.softwares.category}` },
            // PRODUCT PAGE --------------
            { element: <ProductPage />, path: `${paths.softwares.product}` },
            {
                element: <ProductPage />,
                path: `${paths.softwares.category}/${paths.softwares.product}`,
            },
            {
                element: <ProductPage />,
                path: `${paths.softwares.searchResults}/${paths.softwares.product}`,
            },
            {
                element: <ProductPage />,
                path: `${paths.softwares.category}/${paths.softwares.searchResults}/${paths.softwares.product}`,
            },
            {
                element: <ProductPage />,
                path: `${paths.softwares.findSoftware}/${paths.softwares.success}/${paths.softwares.product}`,
            },
            // SUBSCRIPTION PLAN ---------------
            {
                element: <SubscriptionPlan />,
                path: `${paths.softwares.product}/${paths.softwares.viewPlans}`,
            },
            {
                element: <SubscriptionPlan />,
                path: `${paths.softwares.category}/${paths.softwares.product}/${paths.softwares.viewPlans}`,
            },
            {
                element: <SubscriptionPlan />,
                path: `${paths.softwares.searchResults}/${paths.softwares.product}/${paths.softwares.viewPlans}`,
            },
            {
                element: <SubscriptionPlan />,
                path: `${paths.softwares.category}/${paths.softwares.searchResults}/${paths.softwares.product}/${paths.softwares.viewPlans}`,
            },
            {
                element: <SubscriptionPlan />,
                path: `${paths.softwares.findSoftware}/${paths.softwares.success}/${paths.softwares.product}/${paths.softwares.viewPlans}`,
            },
            // SEARCH RESULT --------------------
            {
                element: <SearchResultsPage />,
                path: `${paths.softwares.searchResults}`,
            },
            {
                element: <SearchResultsPage />,
                path: `${paths.softwares.category}/${paths.softwares.searchResults}`,
            },
            // GET ASSISTANCE SUCCESS -------------
            {
                element: <GetAssistanceSuccess />,
                path: `${paths.softwares.product}/${paths.softwares.getAssistanceSuccess}`,
            },
            {
                element: <GetAssistanceSuccess />,
                path: `${paths.softwares.category}/${paths.softwares.product}/${paths.softwares.getAssistanceSuccess}`,
            },
            {
                element: <GetAssistanceSuccess />,
                path: `${paths.softwares.searchResults}/${paths.softwares.product}/${paths.softwares.getAssistanceSuccess}`,
            },
            {
                element: <GetAssistanceSuccess />,
                path: `${paths.softwares.category}/${paths.softwares.searchResults}/${paths.softwares.product}/${paths.softwares.getAssistanceSuccess}`,
            },
            {
                element: <GetAssistanceSuccess />,
                path: `${paths.softwares.findSoftware}/${paths.softwares.success}/${paths.softwares.product}/${paths.softwares.getAssistanceSuccess}`,
            },
            {
                element: <GetAssistanceSuccess />,
                path: `${paths.softwares.product}/${paths.softwares.viewPlans}/${paths.softwares.getAssistanceSuccess}`,
            },
            {
                element: <GetAssistanceSuccess />,
                path: `${paths.softwares.category}/${paths.softwares.product}/${paths.softwares.viewPlans}/${paths.softwares.getAssistanceSuccess}`,
            },
            {
                element: <GetAssistanceSuccess />,
                path: `${paths.softwares.searchResults}/${paths.softwares.product}/${paths.softwares.viewPlans}/${paths.softwares.getAssistanceSuccess}`,
            },
            {
                element: <GetAssistanceSuccess />,
                path: `${paths.softwares.category}/${paths.softwares.searchResults}/${paths.softwares.product}/${paths.softwares.viewPlans}/${paths.softwares.getAssistanceSuccess}`,
            },
            {
                element: <GetAssistanceSuccess />,
                path: `${paths.softwares.findSoftware}/${paths.softwares.success}/${paths.softwares.product}/${paths.softwares.viewPlans}/${paths.softwares.getAssistanceSuccess}`,
            },

            //-------------------------------------
            { element: <FindProductPage />, path: `${paths.softwares.findSoftware}` },
            {
                element: <FindProductSuccessPage />,
                path: `${paths.softwares.findSoftware}/${paths.softwares.success}`,
            },
            {
                element: <OrderHistoryPage />,
                path: paths.softwares.orderHistory,
            },
            {
                element: <ManagePlanPage />,
                path: `${paths.softwares.orderHistory}/${paths.softwares.managePlan}/:orderId`,
            },
        ],
    },
];
