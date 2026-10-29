import { useState } from 'react';

import { ArrowRightOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Row } from 'antd';
import { Form, Formik } from 'formik';
import { Navigate, useNavigate } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import HistoryRevealPanel from '../components/forms/HistoryRevealPanel';
import ConsentCheckbox, { CONSENT_TEXT } from '../components/shared/ConsentCheckbox';
import IndRegNumberInput from '../components/shared/IndRegNumberInput';
import ReportPageHeader from '../components/shared/ReportPageHeader';
import ReportSectionCard from '../components/shared/ReportSectionCard';
import ReportSummaryCard from '../components/shared/ReportSummaryCard';
import VehicleStripCard from '../components/shared/VehicleStripCard';
import useCarReportPlans from '../hooks/useCarReportPlans';
import useReportPayment from '../hooks/useReportPayment';
import { historySchema } from '../schema/index';
import { HistoryFormValues } from '../types/index';
import { reportMeta, vehicleReportsRoot } from '../utils/reportMeta';

const meta = reportMeta.history;

// Vehicle History Report form. The only input is the registration number — Droom
// pulls everything else from the registries.
const HistoryReportPage = () => {
    const navigate = useNavigate();
    const { pay, isLoading } = useReportPayment();
    const [consented, setConsented] = useState(false);
    const { priceFor } = useCarReportPlans();
    // Admin-managed live price; the static meta price is the fallback while loading.
    const price = priceFor('history') ?? meta.price;
    const { selectedVehicle, drafts } = useAppSelector(state => state.reducer.vehicleReport);

    if (!selectedVehicle) {
        return <Navigate to={`${vehicleReportsRoot}/history/${paths.turbo.selectVehicle}`} replace />;
    }

    const initialValues: HistoryFormValues = {
        registrationNumber: selectedVehicle.vehicleNumber ?? '',
        ...drafts.history,
    };

    return (
        <Flex vertical gap={24}>
            <ReportPageHeader title={meta.title} subtitle={meta.subtitle} />

            <Formik
                initialValues={initialValues}
                validationSchema={historySchema}
                onSubmit={values =>
                    pay({
                        reportType: 'history',
                        vehicle: selectedVehicle,
                        reportPrice: price,
                        formValues: values,
                    })
                }
            >
                {({ handleSubmit }) => (
                    <Form>
                        <Row gutter={[24, 24]}>
                            <Col xs={24} lg={15} xl={16}>
                                <Flex vertical gap={20}>
                                    <VehicleStripCard
                                        vehicle={selectedVehicle}
                                        actions={
                                            <Button
                                                danger
                                                size="large"
                                                onClick={() =>
                                                    navigate(
                                                        `${vehicleReportsRoot}/history/${paths.turbo.selectVehicle}`
                                                    )
                                                }
                                            >
                                                Change vehicle <ArrowRightOutlined />
                                            </Button>
                                        }
                                    />
                                    <ReportSectionCard title="Vehicle registration">
                                        <Flex vertical gap={20}>
                                            <div className="max-w-[320px]">
                                                <IndRegNumberInput name="registrationNumber" />
                                            </div>
                                            <HistoryRevealPanel />
                                        </Flex>
                                    </ReportSectionCard>
                                </Flex>
                            </Col>
                            <Col xs={24} lg={9} xl={8}>
                                <ReportSummaryCard
                                    title={meta.summaryTitle}
                                    features={meta.features}
                                    price={price}
                                    isLoading={isLoading}
                                    isDisabled={!consented}
                                    consent={
                                        <ConsentCheckbox
                                            text={CONSENT_TEXT.report}
                                            checked={consented}
                                            onChange={setConsented}
                                        />
                                    }
                                    onPay={() => handleSubmit()}
                                />
                            </Col>
                        </Row>
                    </Form>
                )}
            </Formik>
        </Flex>
    );
};

export default HistoryReportPage;
