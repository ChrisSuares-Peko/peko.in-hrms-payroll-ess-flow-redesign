import { lazy } from 'react';

import OfficeSuppliesLayout from '@domains/dashboard/officeSupplies/components/OfficeSuppliesLayout';

import { paths } from '../paths';

const OfficeSuppliesPage = lazy(
    () => import('@domains/dashboard/officeSupplies/pages/OfficeSupplies')
);

const ProductDetailsPage = lazy(
    () => import('@domains/dashboard/officeSupplies/pages/ProductDetailsPage')
);
const ProductResultsPage = lazy(
    () => import('@domains/dashboard/officeSupplies/pages/ProductResultsPage')
);
const CartPage = lazy(() => import('@domains/dashboard/officeSupplies/pages/CartPage'));
const CheckoutPage = lazy(() => import('@domains/dashboard/officeSupplies/pages/CheckoutPage'));
const OrderedProductDetailsPage = lazy(
    () => import('@domains/dashboard/officeSupplies/pages/OrderedProductDetailsPage')
);
const OrderHistoryPage = lazy(
    () => import('@domains/dashboard/officeSupplies/pages/OrderHistoryPage')
);

const OrderPlaced = lazy(() => import('@domains/dashboard/officeSupplies/pages/OrderPlaced'));

const PlacingOrderPage = lazy(
    () => import('@domains/dashboard/officeSupplies/pages/PlacingOrderPage')
);

// -----------------------------------------------------------------------

export const officeSuppliesRoutes = [
    {
        element: <OfficeSuppliesLayout />,
        children: [
            { element: <OfficeSuppliesPage />, index: true },
            {
                element: <ProductDetailsPage />,
                path: `${paths.officeSupplies.productDetails}/:${paths.officeSupplies.id}`,
            },
            { element: <ProductResultsPage />, path: paths.officeSupplies.products },
            { element: <CartPage />, path: paths.officeSupplies.cartPage },
            { element: <CheckoutPage />, path: paths.officeSupplies.checkout },
            { element: <PlacingOrderPage />, path: paths.officeSupplies.placingOrder },
            { element: <OrderPlaced />, path: paths.officeSupplies.orderPlaced },
            { element: <OrderHistoryPage />, path: paths.officeSupplies.orderHistory },
            {
                element: <OrderedProductDetailsPage />,
                path: `${paths.officeSupplies.orderHistory}/${paths.officeSupplies.orderDetails}/:id`,
            },
        ],
    },
];
