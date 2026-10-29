import { useMemo } from 'react';

import { Col, Flex, Row } from 'antd';

import AgingBreakdown from './AgingBreakdown';
import InsightsTabState from './InsightsTabState';
import WorkingCapitalMetric from './WorkingCapitalMetric';
import { useWorkingCapital } from '../../hooks/useReportSummary';
import { toWorkingCapitalView } from '../../utils/insightsWorkingCapitalViewModel';

interface WorkingCapitalTabProps {
    from: string;
    to: string;
}

const WorkingCapitalTab = ({ from, to }: WorkingCapitalTabProps) => {
    const { workingCapital, loading } = useWorkingCapital({ from, to });
    const view = useMemo(
        () => (workingCapital ? toWorkingCapitalView(workingCapital) : null),
        [workingCapital]
    );

    if (loading || !view) {
        return <InsightsTabState loading={loading} emptyLabel="No working capital data" />;
    }

    return (
        <Flex vertical gap={24}>
            <Row gutter={[20, 20]} align="stretch">
                {view.metrics.map(metric => (
                    <Col key={metric.key} xs={24} sm={12} xl={8}>
                        <WorkingCapitalMetric item={metric} />
                    </Col>
                ))}
            </Row>

            <Row gutter={[24, 24]} align="stretch">
                <Col xs={24} xl={12}>
                    <AgingBreakdown data={view.arAging} />
                </Col>
                <Col xs={24} xl={12}>
                    <AgingBreakdown data={view.apAging} />
                </Col>
            </Row>
        </Flex>
    );
};

export default WorkingCapitalTab;
