import { lazy } from 'react';

import { paths } from '../paths';

// -----------------------------------------------------------------------

const AccountingLanding = lazy(
    () => import('@domains/dashboard/accounting/pages/AccountingLanding')
);
const TransactionsLanding = lazy(
    () => import('@domains/dashboard/accounting/pages/TransactionsLanding')
);
const FinancialStatementsLanding = lazy(
    () => import('@domains/dashboard/accounting/pages/FinancialStatementsLanding')
);
const ProfitLossLanding = lazy(
    () => import('@domains/dashboard/accounting/pages/ProfitLossLanding')
);
const BalanceSheetLanding = lazy(
    () => import('@domains/dashboard/accounting/pages/BalanceSheetLanding')
);
const CashFlowLanding = lazy(() => import('@domains/dashboard/accounting/pages/CashFlowLanding'));
const ExpenseStatementLanding = lazy(
    () => import('@domains/dashboard/accounting/pages/ExpenseStatementLanding')
);
const RevenueStatementLanding = lazy(
    () => import('@domains/dashboard/accounting/pages/RevenueStatementLanding')
);
const GstSummaryLanding = lazy(
    () => import('@domains/dashboard/accounting/pages/GstSummaryLanding')
);
const AccountsReceivableLanding = lazy(
    () => import('@domains/dashboard/accounting/pages/AccountsReceivableLanding')
);
const AccountsPayableLanding = lazy(
    () => import('@domains/dashboard/accounting/pages/AccountsPayableLanding')
);
const InsightsLanding = lazy(() => import('@domains/dashboard/accounting/pages/InsightsLanding'));

// -----------------------------------------------------------------------

export const accountingRoutes = [
    { element: <AccountingLanding />, index: true },
    { element: <TransactionsLanding />, path: paths.accounting.transactions },
    { element: <FinancialStatementsLanding />, path: paths.accounting.financialStatements },
    { element: <ProfitLossLanding />, path: paths.accounting.profitLoss },
    { element: <BalanceSheetLanding />, path: paths.accounting.balanceSheet },
    { element: <CashFlowLanding />, path: paths.accounting.cashFlow },
    { element: <ExpenseStatementLanding />, path: paths.accounting.expenseStatement },
    { element: <RevenueStatementLanding />, path: paths.accounting.revenueStatement },
    { element: <GstSummaryLanding />, path: paths.accounting.gstSummary },
    { element: <AccountsReceivableLanding />, path: paths.accounting.accountsReceivable },
    { element: <AccountsPayableLanding />, path: paths.accounting.accountsPayable },
    { element: <InsightsLanding />, path: paths.accounting.insights },
];
