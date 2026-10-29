import { useMemo } from 'react';

import { Col, Flex, Row } from 'antd';

import CashFlowSummary from './CashFlowSummary';
import InsightsTabState from './InsightsTabState';
import TrendChart from './TrendChart';
import { useCashFlowOverview, useFreeCashFlow } from '../../hooks/useReportSummary';
import { toCashBalanceView, toFreeCashFlowTrend } from '../../utils/insightsCashFlowViewModel';

interface CashFlowTabProps {
    from: string;
    to: string;
}

const CashFlowTab = ({ from, to }: CashFlowTabProps) => {
    const { cashFlowOverview, loading: overviewLoading } = useCashFlowOverview({ from, to });
    const { freeCashFlow, loading: fcfLoading } = useFreeCashFlow({ from, to });

    const cashView = useMemo(
        () => (cashFlowOverview ? toCashBalanceView(cashFlowOverview) : null),
        [cashFlowOverview]
    );
    const fcfTrend = useMemo(
        () => (freeCashFlow ? toFreeCashFlowTrend(freeCashFlow) : null),
        [freeCashFlow]
    );

    if (overviewLoading || !cashView) {
        return <InsightsTabState loading={overviewLoading} emptyLabel="No cash flow data" />;
    }

    return (
        <Flex vertical gap={24}>
            <TrendChart data={cashView.balanceTrend} />

            <Row gutter={[24, 24]} align="stretch">
                <Col xs={24} xl={12}>
                    <CashFlowSummary data={cashView.summary} />
                </Col>
                <Col xs={24} xl={12}>
                    {fcfTrend ? (
                        <TrendChart data={fcfTrend} />
                    ) : (
                        <InsightsTabState
                            loading={fcfLoading}
                            emptyLabel="No free cash flow data"
                        />
                    )}
                </Col>
            </Row>
        </Flex>
    );
};

export default CashFlowTab;
