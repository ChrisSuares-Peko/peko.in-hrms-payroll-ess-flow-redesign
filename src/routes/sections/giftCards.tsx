import { lazy } from 'react';

import { paths } from '@routes/paths';

const GiftCardListingPage = lazy(() => import('@src/domains/dashboard/GiftCards/pages/Listing'));
const GiftCardDetails = lazy(() => import('@src/domains/dashboard/GiftCards/pages/Details'));
const GiftCardOrderHistoryPage = lazy(
    () => import('@src/domains/dashboard/GiftCards/pages/GiftCardOrderHistory')
);
const GiftCardPaymentPage = lazy(
    () => import('@src/domains/dashboard/GiftCards/pages/PaymentPage')
);

// -----------------------------------------------------------------------

export const giftCardsRoutes = [
    {
        path: '/gift-cards',

        children: [
            { element: <GiftCardListingPage />, index: true },
            {
                element: <GiftCardDetails />,
                path: `${paths.giftcards.details}${paths.giftcards.id}`,
            },
            { element: <GiftCardPaymentPage />, path: 'payment' },
            { element: <GiftCardOrderHistoryPage />, path: paths.giftcards.orderHistory },
        ],
    },
];
