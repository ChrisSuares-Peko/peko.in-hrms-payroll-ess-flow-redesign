import React from 'react';

import { Alert, Button, Col, Flex, Form, Row } from 'antd';
import { Formik } from 'formik';

import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@components/atomic/inputs/TextInput';
import useGeneralApi from '@src/domains/dashboard/profile/hooks/useGeneralApi';

import useAddLabWelfareFundApi from '../../hooks/complianceSettings/useAddTLabWelfareFundApi';
import { labWelfareSchema } from '../../schema/EmployeeSalary';
import InfoCard from '../organizationSettings/InfoCard';

type ESIProps = {
    setActiveTabKey?: any;
    data: any;
};

const AddLabWelfare: React.FC<ESIProps> = ({ setActiveTabKey, data }) => {
    const { handleSaveLabourData, isLoading } = useAddLabWelfareFundApi();
    // Same source as the Company Profile tab's own "State" field, so this offers the
    // identical full India states list rather than a hand-picked subset.
    const { statesList } = useGeneralApi();

    return (
        <Flex vertical gap={20} className="pt-6">
            <Row gutter={[24, 24]}>
                <Col xs={24} lg={14}>
                    <Formik
                        initialValues={{
                            workState: data?.workState || '',
                            registrationNumber: data?.registrationNumber || '',
                        }}
                        enableReinitialize
                        validationSchema={labWelfareSchema}
                        onSubmit={async values => {
                            await handleSaveLabourData(values);
                        }}
                    >
                        {({ handleSubmit }) => (
                            <Form layout="vertical" onFinish={handleSubmit}>
                                <Row gutter={[24, 8]}>
                                    <Col xs={24} md={12}>
                                        <SelectInputWithSearch
                                            name="workState"
                                            placeholder="Select work state"
                                            label="Org Work State"
                                            options={[...(statesList || [])].sort((a, b) =>
                                                a.label.localeCompare(b.label)
                                            )}
                                            isRequired
                                            showToolTip
                                            tooltipText="The default work state new employees follow for their Labour Welfare Fund schedule, until set individually on their profile."
                                        />
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <TextInput
                                            name="registrationNumber"
                                            type="text"
                                            placeholder="e.g. MH/LWF/2024/48213"
                                            label="LWF Registration Number"
                                            maxLength={20}
                                            showToolTip
                                            tooltipText="Your organization's LWF registration number with the state labour department, for compliance filing."
                                        />
                                    </Col>
                                </Row>

                                <Flex className="mt-2" gap={10}>
                                    <Button type="primary" danger htmlType="submit" loading={isLoading}>
                                        Save
                                    </Button>
                                </Flex>
                            </Form>
                        )}
                    </Formik>
                </Col>

                <Col xs={24} lg={{ span: 9, offset: 1 }}>
                    <InfoCard
                        title="What Is the Labour Welfare Fund?"
                        description={`A small state-run contribution — a few rupees to a few hundred rupees a year — that funds housing, healthcare and education programmes for workers. The employee share is deducted from salary; the company pays its own share on top.\n\nLWF is state law: it follows the state where each employee works, and only some states have an LWF Act.`}
                    />
                </Col>
            </Row>

            <Row>
                <Col xs={24} lg={14} className="px-0">
                    <Alert
                        type="info"
                        showIcon
                        message="Contribution amounts are set per employee"
                        description="New employees automatically follow the org work state set here. To see or change someone's LWF amount, open their profile → Statutory Components → Labour Welfare Fund → Update Amount."
                    />
                </Col>
            </Row>
        </Flex>
    );
};

export default AddLabWelfare;
