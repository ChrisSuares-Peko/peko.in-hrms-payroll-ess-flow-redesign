import React from 'react';

import { Button, Col, Flex, Form, Row, Skeleton } from 'antd';
import { Formik } from 'formik';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';

import useAddEpfSettingsApi from '../../hooks/complianceSettings/useAddEpfSettingsApi';
import useUpdateComplianceSettingsApi from '../../hooks/complianceSettings/useUpdateComplianceSettingsApi'; // Reusing existing hook
import { tdsSchema } from '../../schema/complianceSchema';
import { TdsSettingsPayload } from '../../types/complianceSettings/complianceSettingsType';
import InfoCard from '../organizationSettings/InfoCard';

type TDSProps = {
    setActiveTabKey?: any;
    settingsId?: string;
    complianceData?: any;
};

const TDS: React.FC<TDSProps> = ({ setActiveTabKey, settingsId, complianceData }) => {
    const isLoading = false;

    const { handleSettingsUpdate } = useUpdateComplianceSettingsApi();
    const { handleSaveTdsData } = useAddEpfSettingsApi();

    return isLoading ? (
        <Skeleton />
    ) : (
        <Flex vertical gap={20} className="pt-6">
            <Formik
                initialValues={{
                    tan: complianceData?.tds?.tan || '',
                    taxRegime: complianceData?.tds?.taxRegime || 'New Tax Regime',
                    bankName: complianceData?.tds?.bsr?.bankName || '',
                    bsrCode: complianceData?.tds?.bsr?.bsrCode || '',
                    name: complianceData?.tds?.authorizedSignatoryDetails?.name || '',
                    placeOfSigning: complianceData?.tds?.authorizedSignatoryDetails?.placeOfSigning || '',
                }}
                enableReinitialize
                validationSchema={tdsSchema}
                validateOnChange
                onSubmit={async values => {
                    if (settingsId) {
                        await handleSettingsUpdate(values);
                    }
                    const payload: TdsSettingsPayload = {
                        tan: values.tan,
                        taxRegime: values.taxRegime,
                        bsr: {
                            bankName: values.bankName,
                            bsrCode: values.bsrCode,
                        },
                        authorizedSignatoryDetails: {
                            name: values.name,
                            placeOfSigning: values.placeOfSigning,
                        },
                    };
                    await handleSaveTdsData(payload);
                    if (setActiveTabKey) setActiveTabKey('2');
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
                                            tooltipTheme="dark"
                                            tooltipText="Identifies your company as the deductor on TDS returns."
                                            name="tan"
                                            placeholder="e.g. MUMH04521D"
                                            label="TAN (Tax Deduction Account Number)"
                                            type="text"
                                            maxLength={10}
                                        />
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <SelectInput
                                            name="taxRegime"
                                            placeholder="Select tax regime"
                                            label="Default Tax Regime for New Employees"
                                            showToolTip
                                            tooltipTheme="dark"
                                            tooltipText="Applied to a newly added employee's profile — each employee can still change their own regime afterward."
                                            options={[
                                                { label: 'New regime (default under the Income-tax Act)', value: 'New Tax Regime' },
                                                { label: 'Old regime', value: 'Old Tax Regime' },
                                            ]}
                                            classes="w-full"
                                        />
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <TextInput
                                            showToolTip
                                            tooltipTheme="dark"
                                            tooltipText="The bank where TDS challans are deposited."
                                            name="bankName"
                                            placeholder="e.g. HDFC Bank"
                                            label="Deposit Bank"
                                            type="text"
                                        />
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <TextInput
                                            isRequired
                                            showToolTip
                                            tooltipTheme="dark"
                                            tooltipText="The Basic Statistical Return code of the bank branch where TDS challans are deposited."
                                            name="bsrCode"
                                            placeholder="e.g. 0510308"
                                            label="BSR Code"
                                            type="text"
                                            allowNumbersOnly
                                            maxLength={7}
                                        />
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <TextInput
                                            isRequired
                                            showToolTip
                                            tooltipTheme="dark"
                                            tooltipText="Whoever signs the company's TDS returns (Form 24Q, Form 16)."
                                            name="name"
                                            placeholder="e.g. Rohan Mehta"
                                            label="Authorized Signatory"
                                            type="text"
                                            allowAlphabetsAndSpaceOnly
                                        />
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <TextInput
                                            name="placeOfSigning"
                                            placeholder="e.g. Mumbai"
                                            label="Place of Signing"
                                            type="text"
                                            allowAlphabetsAndSpaceOnly
                                        />
                                    </Col>
                                </Row>
                                <Flex className="mt-2" gap={10}>
                                    <Button className="px-4" type="primary" danger htmlType="submit">
                                        Save
                                    </Button>
                                </Flex>
                            </Col>
                            <Col xs={24} md={8}>
                                <InfoCard
                                    title="Why Do These Details Matter?"
                                    description={`Every TDS return your company files — the monthly deposit, the quarterly Form 24Q, and the annual Form 16 — must carry your TAN, the bank/BSR details of the challans, and an authorized signatory.

You can see them applied on the Form 24Q filing Excel under Reports & Forms → Form 24Q → Download Excel (Filing Details sheet).

Tip: each employee's own PAN and tax regime live on their profile — Basic Information and Statutory Components.`}
                                />
                            </Col>
                        </Row>
                    </Form>
                )}
            </Formik>
        </Flex>
    );
};

export default TDS;
