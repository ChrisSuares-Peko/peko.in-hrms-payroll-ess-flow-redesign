import { useMemo } from 'react';

import { Col, Flex, Row } from 'antd';

import BarLineChart from './BarLineChart';
import FilingCalendar from './FilingCalendar';
import InsightsTabState from './InsightsTabState';
import PnlSummary from './PnlSummary';
import { useGstSummary } from '../../hooks/useReportSummary';
import { toTaxView } from '../../utils/insightsTaxViewModel';

interface TaxGstTabProps {
    from: string;
    to: string;
}

const TaxGstTab = ({ from, to }: TaxGstTabProps) => {
    const { gstSummary, loading } = useGstSummary({ from, to });
    const view = useMemo(() => (gstSummary ? toTaxView(gstSummary) : null), [gstSummary]);

    if (loading || !view) return <InsightsTabState loading={loading} emptyLabel="No GST data" />;

    return (
        <Flex vertical gap={24}>
            <Row gutter={[24, 24]} align="stretch">
                <Col xs={24} xl={8}>
                    <BarLineChart data={view.gstOverview} />
                </Col>
                <Col xs={24} xl={8}>
                    <PnlSummary data={view.summary} />
                </Col>
                <Col xs={24} xl={8}>
                    <FilingCalendar data={view.filing} />
                </Col>
            </Row>
        </Flex>
    );
};

export default TaxGstTab;
