import { Flex } from 'antd';

import AccountBreakdown from './AccountBreakdown';
import AttentionRequired from './AttentionRequired';
import CashFlow from './CashFlow';
import CategorizedHealth from './CategorizedHealth';
import IncomeExpenseDonut from './IncomeExpenseDonut';
import MonthSummary from './MonthSummary';
import RecurringExpenses from './RecurringExpenses';
import TopExpenseCategories from './TopExpenseCategories';
import TopVendors from './TopVendors';
import TransactionSources from './TransactionSources';
import WeeklyTrendChart from './WeeklyTrendChart';
import { InsightsView } from '../../utils/insightsViewModel';

interface InsightsSectionsProps {
    view: InsightsView;
}

const InsightsSections = ({ view }: InsightsSectionsProps) => (
    <Flex vertical gap={24}>
        <MonthSummary data={view.monthSummary} />
        <AttentionRequired data={view.attention} />
        <IncomeExpenseDonut data={view.incomeExpense} />
        <WeeklyTrendChart data={view.trend} />
        <TopExpenseCategories data={view.topCategories} />
        <CategorizedHealth data={view.categorized} />
        <TransactionSources data={view.sources} />
        <TopVendors data={view.topVendors} />
        <RecurringExpenses data={view.recurring} />
        <AccountBreakdown data={view.accounts} />
        <CashFlow data={view.cashFlow} />
    </Flex>
);

export default InsightsSections;
