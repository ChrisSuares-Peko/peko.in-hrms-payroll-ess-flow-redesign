import React from 'react';

import { InfoCircleOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Form, Row, Tooltip, Typography } from 'antd';
import { Formik } from 'formik';

import TextInput from '@components/atomic/inputs/TextInput';

import useAddTaxSettingsApi from '../../hooks/complianceSettings/useAddTaxSettingsApi';
import { payrollPTSchema } from '../../schema/EmployeeSalary';
import InfoCard from '../organizationSettings/InfoCard';

const { Text } = Typography;

type ProfessionalTaxProps = {
    complianceData?: any;
};

const ProfessionalTax: React.FC<ProfessionalTaxProps> = ({ complianceData }) => {
    const { handleSaveTaxData, isLoading } = useAddTaxSettingsApi();

    return (
        <Flex vertical gap={20} className="pt-6">
            <Formik
                initialValues={{
                    ptNumber: complianceData?.professionalTax?.ptNumber || '',
                }}
                enableReinitialize
                validationSchema={payrollPTSchema}
                onSubmit={async values => {
                    await handleSaveTaxData(values);
                }}
            >
                {({ handleSubmit }) => (
                    <Form layout="vertical" onFinish={handleSubmit}>
                        <Row gutter={[24, 24]}>
                            <Col xs={24} md={16}>
                                <Row gutter={[20, 8]}>
                                    <Col xs={24} md={14}>
                                        <TextInput
                                            isRequired
                                            showToolTip
                                            tooltipText="Your establishment's Professional Tax Registration Certificate number, issued by the state government."
                                            name="ptNumber"
                                            placeholder="e.g. 27451234567P"
                                            label="PT Registration Number (PTRC)"
                                            type="text"
                                            maxLength={15}
                                        />
                                    </Col>
                                    <Col xs={24}>
                                        <Text type="secondary">
                                            Each employee&apos;s PT amount is set on their Statutory Components tab
                                            <Tooltip title="PT slabs and caps differ by state, so the amount is configured per employee (or a global default) as a Deduction Component, not here.">
                                                <InfoCircleOutlined style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12, marginLeft: 5 }} />
                                            </Tooltip>
                                        </Text>
                                    </Col>
                                </Row>
                                <Flex className="mt-4" gap={10}>
                                    <Button
                                        className="px-4"
                                        type="primary"
                                        danger
                                        htmlType="submit"
                                        loading={isLoading}
                                    >
                                        Save
                                    </Button>
                                </Flex>
                            </Col>
                            <Col xs={24} md={8}>
                                <InfoCard
                                    title="What Is Professional Tax?"
                                    description={`Professional Tax is levied on an employee's income by the State Government, with slabs and caps that differ per state (capped at ₹2,500 per year in most states). Some states levy none at all.

The employer deducts it from salary every cycle and deposits it with the state under this PTRC registration. Each employee's amount is visible on their Statutory Components tab and flows into their net pay and Old-regime TDS exemption.`}
                                />
                            </Col>
                        </Row>
                    </Form>
                )}
            </Formik>
        </Flex>
    );
};

export default ProfessionalTax;
