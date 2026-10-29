import { useMemo } from 'react';

import { Empty, Flex, Spin } from 'antd';

import InsightsSections from './InsightsSections';
import { useAccountingInsights } from '../../hooks/useReportSummary';
import { toInsightsView } from '../../utils/insightsViewModel';
import { FINANCIAL_YEARS, fyPeriodToRange } from '../../utils/reportFilters';

const { from, to } = fyPeriodToRange(FINANCIAL_YEARS[0], 'full-year');

const UnlockedInsights = () => {
    const { insights, loading } = useAccountingInsights(from, to);
    const view = useMemo(() => (insights ? toInsightsView(insights) : null), [insights]);

    if (loading) {
        return (
            <Flex align="center" justify="center" className="min-h-[200px]">
                <Spin />
            </Flex>
        );
    }

    if (!view) {
        return (
            <Flex align="center" justify="center" className="min-h-[200px]">
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No insights yet" />
            </Flex>
        );
    }

    return <InsightsSections view={view} />;
};

export default UnlockedInsights;
