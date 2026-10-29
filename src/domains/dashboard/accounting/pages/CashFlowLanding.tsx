import { useMemo, useState } from 'react';

import { Col, Flex, Row, Spin } from 'antd';

import {
    useCashFlowOverview,
    useCashFlowStatement,
    useFreeCashFlow,
} from '../hooks/useReportSummary';
import CashBalanceProgressionCard from '../sections/cashFlow/CashBalanceProgressionCard';
import CashFlowStatementCard from '../sections/cashFlow/CashFlowStatementCard';
import CashFlowSummaryCards from '../sections/cashFlow/CashFlowSummaryCards';
import CashFlowTrendCard from '../sections/cashFlow/CashFlowTrendCard';
import CfCategoryComparisonCard from '../sections/cashFlow/CfCategoryComparisonCard';
import CfHeader from '../sections/cashFlow/CfHeader';
import FreeCashFlowAnalysisCard from '../sections/cashFlow/FreeCashFlowAnalysisCard';
import {
    toCashFlowOverviewView,
    toCashFlowStatementView,
    toFreeCashFlowView,
} from '../utils/cashFlowViewModel';
import { FULL_YEAR, currentFyStart } from '../utils/reportFilters';

const EMPTY_SUMMARY = {
    rows: [],
    closing: { label: 'Closing Cash Balance', amount: 0 },
};

const EMPTY_FCF = {
    fcf: { value: '—', negative: false, note: '' },
    capex: { value: '—', items: [] },
    capexRatio: { value: 0, display: '—' },
};

const CashFlowLanding = () => {
    const [fy, setFy] = useState(currentFyStart());
    const [period, setPeriod] = useState(FULL_YEAR);

    // fy alone → full financial year; fy + month → single calendar month within the FY.
    const month = period === FULL_YEAR ? undefined : Number(period);
    const { cashFlowStatement, loading: statementLoading } = useCashFlowStatement({ fy, month });
    const { cashFlowOverview, loading: overviewLoading } = useCashFlowOverview({ fy, month });
    const { freeCashFlow, loading: fcfLoading } = useFreeCashFlow({ fy, month });

    const statementView = useMemo(
        () => (cashFlowStatement ? toCashFlowStatementView(cashFlowStatement) : null),
        [cashFlowStatement]
    );
    const overviewView = useMemo(
        () => (cashFlowOverview ? toCashFlowOverviewView(cashFlowOverview) : null),
        [cashFlowOverview]
    );
    const fcfView = useMemo(
        () => (freeCashFlow ? toFreeCashFlowView(freeCashFlow) : null),
        [freeCashFlow]
    );

    const loading = statementLoading || overviewLoading || fcfLoading;

    return (
        <Flex vertical gap={24} className="px-2 py-5">
            <CfHeader fy={fy} period={period} onFyChange={setFy} onPeriodChange={setPeriod} />

            {loading ? (
                <Flex align="center" justify="center" className="min-h-[300px]">
                    <Spin />
                </Flex>
            ) : (
                <>
                    <CashFlowSummaryCards stats={overviewView?.stats ?? []} />

                    <Row gutter={[24, 24]} className="w-full">
                        <Col xs={24} xl={12}>
                            <CashFlowStatementCard
                                sections={statementView?.sections ?? []}
                                summary={statementView?.summaryBox ?? EMPTY_SUMMARY}
                            />
                        </Col>
                        <Col xs={24} xl={12}>
                            <Flex vertical gap={24} className="w-full">
                                <CashFlowTrendCard
                                    monthly={overviewView?.trendMonthly ?? []}
                                    quarterly={overviewView?.trendQuarterly ?? []}
                                />
                                <CfCategoryComparisonCard
                                    items={overviewView?.categoryItems ?? []}
                                />
                                <CashBalanceProgressionCard
                                    monthly={overviewView?.balanceMonthly ?? []}
                                    quarterly={overviewView?.balanceQuarterly ?? []}
                                />
                            </Flex>
                        </Col>
                    </Row>

                    <FreeCashFlowAnalysisCard
                        fcf={fcfView?.fcf ?? EMPTY_FCF.fcf}
                        capex={fcfView?.capex ?? EMPTY_FCF.capex}
                        capexRatio={fcfView?.capexRatio ?? EMPTY_FCF.capexRatio}
                    />
                </>
            )}
        </Flex>
    );
};

export default CashFlowLanding;
