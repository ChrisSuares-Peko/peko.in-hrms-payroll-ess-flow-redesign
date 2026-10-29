import { Suspense, lazy } from 'react';

import { Navigate, Outlet } from 'react-router-dom';

import AccountingLayout from '@layouts/AccountingLayout';
import { paths } from '@routes/paths';
import { ACCOUNTING_MENU } from '@src/domains/admin/accounting/config/accountingMenu';
import AuthGuard from '@src/guard/AuthGuard';
import RoleGuard from '@src/guard/RoleGuard';
import SystemUserGuard from '@src/guard/SystemUserGuard';

const AccountingDashboard = lazy(
    () => import('@src/domains/admin/accounting/pages/AccountingDashboard')
);
const Transactions = lazy(() => import('@src/domains/admin/accounting/pages/Transactions'));
const FeeDetails = lazy(() => import('@src/domains/admin/accounting/pages/FeeDetails'));
const OtherSales = lazy(() => import('@src/domains/admin/accounting/pages/OtherSales'));
const SubscriptionDetails = lazy(
    () => import('@src/domains/admin/accounting/pages/SubscriptionDetails')
);
const ThirdPartySales = lazy(() => import('@src/domains/admin/accounting/pages/ThirdPartySales'));

export const accountingAdminRoutes = [
    {
        path: '',
        element: (
            <AuthGuard>
                <SystemUserGuard>
                    <AccountingLayout>
                        <RoleGuard>
                            <Suspense>
                                <Outlet />
                            </Suspense>
                        </RoleGuard>
                    </AccountingLayout>
                </SystemUserGuard>
            </AuthGuard>
        ),
        children: [
            {
                path: paths.systemUser.accounting,
                children: [
                    { element: <AccountingDashboard />, index: true },
                    // Not in the sidebar menu — reached only via a dashboard KPI card
                    // (Transaction Entries / Transactions Count / GMV), same as clicking
                    // through to any other drill-down page.
                    { path: paths.accountingAdmin.transactions, element: <Transactions /> },
                    // Same treatment — reached only via the Commission / Platform Fee
                    // dashboard cards, not a sidebar item.
                    {
                        path: paths.accountingAdmin.commissionDetails,
                        element: <FeeDetails feeType="commission" />,
                    },
                    {
                        path: paths.accountingAdmin.platformFeeDetails,
                        element: <FeeDetails feeType="platformFee" />,
                    },
                    // Also moved out of the sidebar — reached only via the Other Sales card.
                    { path: paths.accountingAdmin.otherSales, element: <OtherSales /> },
                    {
                        path: `${paths.accountingAdmin.thirdPartySales}/:kind?`,
                        element: <ThirdPartySales />,
                    },
                    // Backs all 3 Subscriptions cards — billingType comes from the query string.
                    {
                        path: paths.accountingAdmin.subscriptionDetails,
                        element: <SubscriptionDetails />,
                    },
                    ...ACCOUNTING_MENU.flatMap(group =>
                        group.leaves.map(leaf =>
                            leaf.children
                                ? {
                                      path: leaf.slug,
                                      children: [
                                          { index: true, element: leaf.element },
                                          ...leaf.children,
                                      ],
                                  }
                                : { path: leaf.slug, element: leaf.element }
                        )
                    ),
                    { path: '*', element: <Navigate to="/404" replace /> },
                ],
            },
        ],
    },
];
