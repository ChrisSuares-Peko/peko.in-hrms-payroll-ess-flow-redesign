import { ClockCircleOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Row } from 'antd';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import ReportTypeCard from '../components/landing/ReportTypeCard';
import ReportPageHeader from '../components/shared/ReportPageHeader';
import useCarReportPlans from '../hooks/useCarReportPlans';
import { setReportType } from '../slices/vehicleReportSlice';
import { PURCHASABLE_REPORT_TYPES, ReportType } from '../types/index';
import { reportTypeCards } from '../utils/data';
import { vehicleReportsRoot } from '../utils/reportMeta';

// Vehicle Reports landing screen: the three Droom report products.
const VehicleReportsPage = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { priceFor, minInspectionPrice, typeAvailable } = useCarReportPlans();

    // Inspection has no flat price — its landing card shows the cheapest bookable
    // package. Everything falls back to the static card values while plans load.
    const livePrice = (card: (typeof reportTypeCards)[number]) =>
        (card.reportType === 'inspection' ? minInspectionPrice : priceFor(card.reportType)) ??
        card.price;

    const startFlow = (reportType: ReportType) => {
        dispatch(setReportType(reportType));
        navigate(`${vehicleReportsRoot}/${reportType}/${paths.turbo.selectVehicle}`);
    };

    // Vendor-supplied sample PDFs, served from public/samples. Types without one yet
    // fall back to the toast rather than silently doing nothing.
    const sampleUrls: Partial<Record<ReportType, string>> = {
        valuation: '/samples/valuation-sample-report.pdf',
        history: '/samples/history-sample-report.png',
        inspection: '/samples/inspection-sample-report.pdf',
    };
    const viewSample = (reportType: ReportType) => {
        const url = sampleUrls[reportType];
        if (url) window.open(url, '_blank', 'noopener');
        else dispatch(showToast({ variant: 'info', description: 'Sample reports are coming soon.' }));
    };

    return (
        <Flex vertical gap={24}>
            <ReportPageHeader
                title="Vehicle Reports"
                subtitle="Know any vehicle's true value, history and condition before you buy, sell or renew."
                actions={
                    <Button
                        danger
                        size="large"
                        icon={<ClockCircleOutlined />}
                        onClick={() =>
                            navigate(`${vehicleReportsRoot}/${paths.turbo.reportOrders}`)
                        }
                    >
                        Order history
                    </Button>
                }
            />

            <Row gutter={[24, 24]}>
                {reportTypeCards.map(card => (
                    <Col key={card.reportType} xs={24} md={12} xl={8}>
                        <ReportTypeCard
                            card={{ ...card, price: livePrice(card) }}
                            // Coming soon when the product line doesn't sell it, or the
                            // admin has deactivated its plan (the payment endpoint
                            // would refuse it anyway).
                            isComingSoon={
                                !PURCHASABLE_REPORT_TYPES.includes(card.reportType) ||
                                typeAvailable(card.reportType) === false
                            }
                            onSelect={() => startFlow(card.reportType)}
                            onViewSample={() => viewSample(card.reportType)}
                        />
                    </Col>
                ))}
            </Row>
        </Flex>
    );
};

export default VehicleReportsPage;
