import { useMemo, useState } from 'react';

import { Col, Empty, Flex, Row, Spin } from 'antd';

import {
    useBalanceSheet,
    useBalanceSheetComparison,
    useBalanceSheetExport,
} from '../hooks/useReportSummary';
import AssetCompositionCard from '../sections/balanceSheet/AssetCompositionCard';
import AssetsLiabilitiesOverviewCard from '../sections/balanceSheet/AssetsLiabilitiesOverviewCard';
import BalanceSheetInsightsCard from '../sections/balanceSheet/BalanceSheetInsightsCard';
import BalanceSheetStatementCard from '../sections/balanceSheet/BalanceSheetStatementCard';
import BalanceSheetSummaryCards from '../sections/balanceSheet/BalanceSheetSummaryCards';
import BalanceSheetTrendCard from '../sections/balanceSheet/BalanceSheetTrendCard';
import BsHeader from '../sections/balanceSheet/BsHeader';
import LiabilityCompositionCard from '../sections/balanceSheet/LiabilityCompositionCard';
import WorkingCapitalAnalysisCard from '../sections/balanceSheet/WorkingCapitalAnalysisCard';
import { toBalanceSheetView } from '../utils/balanceSheetViewModel';
import { FULL_YEAR, currentFyStart } from '../utils/reportFilters';

const BalanceSheetLanding = () => {
    const [fy, setFy] = useState(currentFyStart());
    const [period, setPeriod] = useState(FULL_YEAR);

    // fy alone → snapshot as of the FY end; fy + month → as of that calendar month's end.
    const month = period === FULL_YEAR ? undefined : Number(period);
    const { balanceSheet, loading } = useBalanceSheet({ fy, month });
    const { comparing, downloadComparison } = useBalanceSheetComparison(fy);
    const { exporting, exportPdf } = useBalanceSheetExport({ fy, month });

    const view = useMemo(
        () => (balanceSheet ? toBalanceSheetView(balanceSheet) : null),
        [balanceSheet]
    );

    return (
        <Flex vertical gap={24} className="px-2 py-5">
            <BsHeader
                fy={fy}
                period={period}
                onFyChange={setFy}
                onPeriodChange={setPeriod}
                onCompare={downloadComparison}
                comparing={comparing}
                onExport={exportPdf}
                exporting={exporting}
            />

            {loading && (
                <Flex align="center" justify="center" className="min-h-[300px]">
                    <Spin />
                </Flex>
            )}

            {!loading && !view && (
                <Flex align="center" justify="center" className="min-h-[300px]">
                    <Empty description="No balance sheet data" />
                </Flex>
            )}

            {!loading && view && (
                <>
                    <BalanceSheetSummaryCards stats={view.summaryStats} />

                    <BalanceSheetStatementCard
                        assets={view.statement.assets}
                        liabilities={view.statement.liabilities}
                    />

                    <Row gutter={[24, 24]} className="w-full">
                        <Col xs={24} lg={12}>
                            <AssetsLiabilitiesOverviewCard donut={view.overviewDonut} />
                        </Col>
                        <Col xs={24} lg={12}>
                            <WorkingCapitalAnalysisCard
                                metrics={view.workingCapital.metrics}
                                currentAssets={view.workingCapital.currentAssets}
                                currentLiabilities={view.workingCapital.currentLiabilities}
                            />
                        </Col>
                    </Row>

                    <Row gutter={[24, 24]} className="w-full">
                        <Col xs={24} lg={12}>
                            <AssetCompositionCard
                                centerValue={view.assetComposition.centerValue}
                                slices={view.assetComposition.slices}
                            />
                        </Col>
                        <Col xs={24} lg={12}>
                            <LiabilityCompositionCard
                                centerValue={view.liabilityComposition.centerValue}
                                slices={view.liabilityComposition.slices}
                            />
                        </Col>
                    </Row>

                    <BalanceSheetTrendCard
                        monthly={view.trendMonthly}
                        quarterly={view.trendQuarterly}
                    />

                    <BalanceSheetInsightsCard tiles={view.insights} />
                </>
            )}
        </Flex>
    );
};

export default BalanceSheetLanding;
