import { useState } from 'react';

import { ArrowRightOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Row } from 'antd';
import { Form, Formik } from 'formik';
import { Navigate, useNavigate } from 'react-router-dom';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';
import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { formatNumberWithLocalStringWithoutDecimalPoint } from '@utils/priceFormat';

import VehicleInformationSection from '../components/forms/VehicleInformationSection';
import SlotPicker from '../components/inspection/SlotPicker';
import WhatHappensNextPanel from '../components/inspection/WhatHappensNextPanel';
import ConsentCheckbox, { CONSENT_TEXT } from '../components/shared/ConsentCheckbox';
import IndRegNumberInput from '../components/shared/IndRegNumberInput';
import ReportPageHeader from '../components/shared/ReportPageHeader';
import ReportSectionCard from '../components/shared/ReportSectionCard';
import ReportSummaryCard from '../components/shared/ReportSummaryCard';
import VehicleStripCard from '../components/shared/VehicleStripCard';
import useReportPayment from '../hooks/useReportPayment';
import { inspectionSchema } from '../schema/index';
import { InspectionFormValues } from '../types/index';
import { cityOptions, stateOptions } from '../utils/data';
import { reportMeta, vehicleReportsRoot } from '../utils/reportMeta';

const meta = reportMeta.inspection;

const emptyValues: InspectionFormValues = {
    bodyType: '',
    make: '',
    model: '',
    manufacturingYear: '',
    variant: '',
    registrationNumber: '',
    contactName: '',
    mobileNumber: '',
    fullAddress: '',
    pincode: '',
    city: '',
    state: '',
    slot1Date: '',
    slot1Time: '',
    slot2Date: '',
    slot2Time: '',
};

// Step 2 of the inspection funnel: vehicle details, contact, address and up to two
// preferred appointment slots for the technician visit.
const InspectionBookingPage = () => {
    const navigate = useNavigate();
    const { pay, isLoading } = useReportPayment();
    const [consented, setConsented] = useState(false);
    const { selectedVehicle, inspectionPackage, inspectionCategory, drafts } = useAppSelector(
        state => state.reducer.vehicleReport
    );

    const servicePath = `${vehicleReportsRoot}/${paths.turbo.inspection}`;

    // No package chosen means the user deep-linked past the service-select step.
    if (!selectedVehicle || !inspectionPackage) {
        return <Navigate to={servicePath} replace />;
    }

    // Only the registration number carries over — RC make/model strings are legal
    // entity names and would not match any dropdown option.
    const initialValues: InspectionFormValues = {
        ...emptyValues,
        registrationNumber: selectedVehicle.vehicleNumber ?? '',
        ...drafts.inspection,
    };

    return (
        <Flex vertical gap={24}>
            <ReportPageHeader title={meta.title} subtitle={meta.subtitle} />

            <Formik
                initialValues={initialValues}
                validationSchema={inspectionSchema}
                onSubmit={values =>
                    pay({
                        reportType: 'inspection',
                        vehicle: selectedVehicle,
                        reportPrice: inspectionPackage.price,
                        packageName: inspectionPackage.name,
                        // The backend prices from the id, not the name — see
                        // INSPECTION_PACKAGE_PRICES in officeAndBusiness/utils/carReport.js.
                        packageId: inspectionPackage.id,
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
                                        metaChips={[
                                            inspectionPackage.name,
                                            inspectionCategory,
                                            `₹${formatNumberWithLocalStringWithoutDecimalPoint(
                                                inspectionPackage.price
                                            )}`,
                                        ]}
                                        actions={
                                            <>
                                                <Button
                                                    danger
                                                    size="large"
                                                    onClick={() => navigate(servicePath)}
                                                >
                                                    Change Inspection type
                                                </Button>
                                                <Button
                                                    danger
                                                    size="large"
                                                    onClick={() =>
                                                        navigate(
                                                            `${vehicleReportsRoot}/inspection/${paths.turbo.selectVehicle}`
                                                        )
                                                    }
                                                >
                                                    Change vehicle <ArrowRightOutlined />
                                                </Button>
                                            </>
                                        }
                                    />

                                    <VehicleInformationSection
                                        title="Vehicle registration"
                                        categoryFieldName="bodyType"
                                        categoryLabel="Body type"
                                        taxonomyCategory={inspectionCategory}
                                    >
                                        <IndRegNumberInput name="registrationNumber" />
                                    </VehicleInformationSection>

                                    <ReportSectionCard title="Contact details">
                                        <Row gutter={[24, 20]}>
                                            <Col xs={24} md={12}>
                                                <TextInput
                                                    name="contactName"
                                                    label="Contact name"
                                                    placeholder="Enter a name"
                                                    type="text"
                                                    size="large"
                                                    allowAlphabetsAndSpaceOnly
                                                    maxLength={60}
                                                />
                                            </Col>
                                            <Col xs={24} md={12}>
                                                <TextInput
                                                    name="mobileNumber"
                                                    label="Mobile number"
                                                    placeholder="10-digit mobile number"
                                                    type="text"
                                                    size="large"
                                                    inputMode="numeric"
                                                    allowNumbersOnly
                                                    maxLength={10}
                                                />
                                            </Col>
                                        </Row>
                                    </ReportSectionCard>

                                    <ReportSectionCard title="Inspection address">
                                        <Row gutter={[24, 20]}>
                                            <Col xs={24}>
                                                <TextInput
                                                    name="fullAddress"
                                                    label="Full address"
                                                    placeholder="House / street / area"
                                                    type="text"
                                                    size="large"
                                                    allowAddressFormat
                                                    maxLength={200}
                                                />
                                            </Col>
                                            <Col xs={24} md={8}>
                                                <TextInput
                                                    name="pincode"
                                                    label="Pincode"
                                                    placeholder="6-digit pincode"
                                                    type="text"
                                                    size="large"
                                                    inputMode="numeric"
                                                    allowNumbersOnly
                                                    maxLength={6}
                                                />
                                            </Col>
                                            <Col xs={24} md={8}>
                                                <SelectInput
                                                    name="city"
                                                    label="City"
                                                    placeholder="Select a city"
                                                    size="large"
                                                    showSearch
                                                    options={cityOptions}
                                                />
                                            </Col>
                                            <Col xs={24} md={8}>
                                                <SelectInput
                                                    name="state"
                                                    label="State"
                                                    placeholder="Select a state"
                                                    size="large"
                                                    showSearch
                                                    options={stateOptions}
                                                />
                                            </Col>
                                        </Row>
                                    </ReportSectionCard>

                                    <ReportSectionCard title="Preferred appointment slots">
                                        <Flex vertical gap={24}>
                                            <SlotPicker index={1} isRequired />
                                            <SlotPicker index={2} />
                                        </Flex>
                                    </ReportSectionCard>
                                </Flex>
                            </Col>

                            <Col xs={24} lg={9} xl={8}>
                                <ReportSummaryCard
                                    title={inspectionPackage.name}
                                    features={inspectionPackage.highlights}
                                    price={inspectionPackage.price}
                                    isLoading={isLoading}
                                    isDisabled={!consented}
                                    consent={
                                        <ConsentCheckbox
                                            text={CONSENT_TEXT.inspection}
                                            checked={consented}
                                            onChange={setConsented}
                                        />
                                    }
                                    onPay={() => handleSubmit()}
                                >
                                    <WhatHappensNextPanel />
                                </ReportSummaryCard>
                            </Col>
                        </Row>
                    </Form>
                )}
            </Formik>
        </Flex>
    );
};

export default InspectionBookingPage;
