import React from 'react';

import { InfoCircleOutlined } from '@ant-design/icons';
import { Alert, Button, Col, Flex, Form, Row, Tooltip, Typography } from 'antd';
import { Formik } from 'formik';

import TextInput from '@components/atomic/inputs/TextInput';

import useAddEsiSettings from '../../hooks/complianceSettings/useAddEsiSettings';
import { payrollEsiSchema } from '../../schema/EmployeeSalary';
import InfoCard from '../organizationSettings/InfoCard';

const { Text } = Typography;

type ESIProps = {
    setActiveTabKey?: any;
    complianceData?: any;
};

const ESI: React.FC<ESIProps> = ({ setActiveTabKey, complianceData }) => {
    const { handleSaveEsiData, isLoading } = useAddEsiSettings();

    return (
        <Flex vertical gap={20} className="pt-6">
            <Formik
                initialValues={{
                    esiNumber: complianceData?.esi?.esiNumber || '',
                }}
                enableReinitialize
                validationSchema={payrollEsiSchema}
                onSubmit={async values => {
                    await handleSaveEsiData(values);

                    setActiveTabKey('2');
                }}
            >
                {({ handleSubmit }) => (
                    <Form layout="vertical" onFinish={handleSubmit}>
                        <Row gutter={[24, 24]}>
                            <Col xs={24} md={16}>
                                <Row gutter={[20, 8]}>
                                    <Col xs={24} md={12}>
                                        <TextInput
                                            isRequired
                                            showToolTip
                                            tooltipText="Your establishment's ESI registration number, issued by ESIC."
                                            name="esiNumber"
                                            placeholder="e.g. 47000123450000999"
                                            label="ESI Registration Number"
                                            type="text"
                                            allowNumbersOnly
                                            maxLength={17}
                                        />
                                    </Col>
                                    <Col xs={24}>
                                        <Text type="secondary">
                                            Coverage and contribution rules are fixed by law
                                            <Tooltip title="Employees earning ₹21,000 or less are automatically covered. Employee: 0.75% of gross pay. Employer: 3.25% of gross pay. These cannot be changed here.">
                                                <InfoCircleOutlined style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12, marginLeft: 5 }} />
                                            </Tooltip>
                                        </Text>
                                    </Col>
                                    <Col xs={24}>
                                        <Alert
                                            className="mt-4 items-start"
                                            type="warning"
                                            showIcon
                                            message={
                                                <Flex align="start" vertical>
                                                    <Typography.Text>
                                                        <b>Note:</b> If an employee initially earning ₹21,000 or less
                                                        gets a salary hike that pushes their salary above ₹21,000,
                                                        ESI contributions do not stop immediately. Instead,
                                                        contributions will continue until the end of the ongoing
                                                        contribution period.
                                                    </Typography.Text>
                                                    <Typography.Text className="mt-2">
                                                        <b>The contribution periods are:</b>
                                                        <br />
                                                        April to September (first half of the financial year)
                                                        <br />
                                                        October to March (second half of the financial year)
                                                    </Typography.Text>
                                                    <Typography.Text className="mt-2">
                                                        <b>For example:</b>
                                                        <br />
                                                        If an employee&apos;s salary is increased in July, they will
                                                        still contribute to ESI until September. Similarly, if the
                                                        hike occurs in December, they will contribute until March.
                                                    </Typography.Text>
                                                </Flex>
                                            }
                                        />
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
                                    title="Why Is ESI Required?"
                                    description={`Employees' State Insurance funds medical care, sickness and maternity benefits, and disablement cover for lower-wage employees.

Registration is mandatory for establishments with 10 or more employees, and covered employees are identified by their Insurance Person (IP) numbers — managed on each employee's Statutory Components tab.

Which employees are covered is decided automatically by the ₹21,000 wage ceiling; you can see the covered list any time under Reports & Forms → ESI.`}
                                />
                            </Col>
                        </Row>
                    </Form>
                )}
            </Formik>
        </Flex>
    );
};

export default ESI;
