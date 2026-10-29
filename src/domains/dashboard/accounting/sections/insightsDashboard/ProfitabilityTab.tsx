import { Col, Flex, Row } from 'antd';

import MonthlyBarChart from './MonthlyBarChart';
import PnlSummary from './PnlSummary';
import ProfitTrendChart from './ProfitTrendChart';
import {
    MonthlyBarChartData,
    PnlSummaryData,
    ProfitTrendData,
} from '../../utils/insightsDashboardData';

interface ProfitabilityTabProps {
    profitTrend: ProfitTrendData;
    netMargin: MonthlyBarChartData;
    pnl: PnlSummaryData;
}

const ProfitabilityTab = ({ profitTrend, netMargin, pnl }: ProfitabilityTabProps) => (
    <Flex vertical gap={24}>
        <ProfitTrendChart data={profitTrend} />

        <Row gutter={[24, 24]} align="stretch">
            <Col xs={24} xl={12}>
                <MonthlyBarChart data={netMargin} />
            </Col>
            <Col xs={24} xl={12}>
                <PnlSummary data={pnl} />
            </Col>
        </Row>
    </Flex>
);

export default ProfitabilityTab;
