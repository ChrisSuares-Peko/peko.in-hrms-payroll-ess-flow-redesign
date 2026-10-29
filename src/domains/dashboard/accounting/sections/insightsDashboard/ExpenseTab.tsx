import { Col, Flex, Row } from 'antd';

import DonutBreakdown from './DonutBreakdown';
import RankedBarList from './RankedBarList';
import TrendChart from './TrendChart';
import {
    DonutBreakdownData,
    RankedBarListData,
    TrendChartData,
} from '../../utils/insightsDashboardData';

interface ExpenseTabProps {
    trend: TrendChartData;
    categories: DonutBreakdownData;
    topVendors: RankedBarListData;
}

const ExpenseTab = ({ trend, categories, topVendors }: ExpenseTabProps) => (
    <Flex vertical gap={24}>
        <TrendChart data={trend} />

        <Row gutter={[24, 24]} align="stretch">
            <Col xs={24} xl={12}>
                <DonutBreakdown data={categories} />
            </Col>
            <Col xs={24} xl={12}>
                <RankedBarList data={topVendors} />
            </Col>
        </Row>
    </Flex>
);

export default ExpenseTab;
