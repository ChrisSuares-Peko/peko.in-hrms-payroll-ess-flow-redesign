import { Col, Flex, Row } from 'antd';

import BarLineChart from './BarLineChart';
import BusinessHealthScore from './BusinessHealthScore';
import KpiCard from './KpiCard';
import { BusinessHealth } from '../../api/reports';
import { BarLineChartData, KpiCardItem } from '../../utils/insightsDashboardData';

interface OverviewTabProps {
    primaryKpis: KpiCardItem[];
    secondaryKpis: KpiCardItem[];
    revenueVsExpenses: BarLineChartData;
    businessHealth: BusinessHealth | null;
    businessHealthLoading: boolean;
}

const OverviewTab = ({
    primaryKpis,
    secondaryKpis,
    revenueVsExpenses,
    businessHealth,
    businessHealthLoading,
}: OverviewTabProps) => (
    <Flex vertical gap={24}>
        <Row gutter={[20, 20]} align="stretch">
            {primaryKpis.map(item => (
                <Col key={item.key} xs={24} sm={12} xl={6}>
                    <KpiCard item={item} />
                </Col>
            ))}
        </Row>

        <Row gutter={[24, 24]} align="stretch">
            <Col xs={24} xl={12}>
                <BusinessHealthScore data={businessHealth} loading={businessHealthLoading} />
            </Col>
            <Col xs={24} xl={12}>
                <BarLineChart data={revenueVsExpenses} />
            </Col>
        </Row>

        <Row gutter={[20, 20]} align="stretch">
            {secondaryKpis.map(item => (
                <Col key={item.key} xs={24} sm={12} lg={8}>
                    <KpiCard item={item} />
                </Col>
            ))}
        </Row>
    </Flex>
);

export default OverviewTab;
