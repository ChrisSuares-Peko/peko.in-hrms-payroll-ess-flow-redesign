import { Col, Flex, Row } from 'antd';

import DonutBreakdown from './DonutBreakdown';
import RankedBarList from './RankedBarList';
import TrendChart from './TrendChart';
import {
    DonutBreakdownData,
    RankedBarListData,
    TrendChartData,
} from '../../utils/insightsDashboardData';

interface RevenueTabProps {
    trend: TrendChartData;
    streams: DonutBreakdownData;
    topCustomers: RankedBarListData;
}

const RevenueTab = ({ trend, streams, topCustomers }: RevenueTabProps) => (
    <Flex vertical gap={24}>
        <TrendChart data={trend} />

        <Row gutter={[24, 24]} align="stretch">
            <Col xs={24} xl={12}>
                <DonutBreakdown data={streams} />
            </Col>
            <Col xs={24} xl={12}>
                <RankedBarList data={topCustomers} />
            </Col>
        </Row>
    </Flex>
);

export default RevenueTab;
