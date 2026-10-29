import React, { useEffect, useRef, useState } from 'react';

import { ArrowLeftOutlined, CloseOutlined } from '@ant-design/icons';
import { Button, Col, Drawer, Flex, Form, Row, Select, Space, Typography } from 'antd';
import { Formik, FormikProps } from 'formik';

import InputTextArea from '@src/components/atomic/inputs/InputTextArea';
import TextInput from '@src/components/atomic/inputs/TextInput';

import {
    businessInitialValues,
    businessValidationSchema,
    individualInitialValues,
    individualValidationSchema,
} from '../schema/addBeneficiary';
import { AddBeneficiaryPayload, Beneficiary, BeneficiaryPaymentCategory } from '../types';
import { BeneficiaryType, typeOptions, paymentCategoryOptions } from '../utils/beneficiaryOptions';

const { Text, Title } = Typography;

interface AddBeneficiaryDrawerProps {
    visible: boolean;
    onCancel: () => void;
    onAdd: (payload: AddBeneficiaryPayload) => Promise<void> | void;
    isLoading?: boolean;
    editData?: Beneficiary;
    onEdit?: (payload: AddBeneficiaryPayload) => Promise<void> | void;
    virtualAccountNumber?: string | null;
    onBack?: () => void;
}

const CommonBankFields = () => (
    <>
        <Title level={5} style={{ marginBottom: 12, marginTop: 4 }}>
            Bank Details
        </Title>

        <TextInput
            name="accountNumber"
            label="Account Number"
            placeholder="Enter account number"
            type="text"
            isRequired
            maxLength={18}
            allowNumbersOnly
        />

        <Row gutter={12}>
            <Col span={12}>
                <TextInput
                    name="ifscCode"
                    label="IFSC Code"
                    placeholder="SBIN0001234"
                    type="text"
                    isRequired
                    allowUpperCaseOnly
                    allowAlphabetsAndNumbersOnly
                    maxLength={11}
                />
            </Col>
            <Col span={12}>
                <TextInput
                    name="bankName"
                    label="Bank Name"
                    placeholder="State Bank of India"
                    type="text"
                    maxLength={50}
                    allowAlphabetsAndSpaceOnly
                />
            </Col>
        </Row>

        <Row gutter={12}>
            <Col span={12}>
                <TextInput
                    name="branchName"
                    label="Branch Name"
                    placeholder="Bandra West"
                    type="text"
                    maxLength={50}
                    allowAlphabetsAndSpaceOnly
                />
            </Col>
            <Col span={12}>
                <TextInput
                    name="upiId"
                    label="UPI ID (Optional)"
                    placeholder="username@upi"
                    type="text"
                    maxLength={50}
                />
            </Col>
        </Row>

        <Title level={5} style={{ marginBottom: 12, marginTop: 4 }}>
            Tax Information
        </Title>

        <TextInput
            name="panNumber"
            label="PAN"
            placeholder="Enter PAN Number"
            type="text"
            allowUpperCaseOnly
            maxLength={10}
        />

        <InputTextArea
            name="address"
            label="Address"
            placeholder="Enter complete address"
            autoSize={{ minRows: 3 }}
            maxLength={250}
            showCount
        />
    </>
);

const AddBeneficiaryDrawer: React.FC<AddBeneficiaryDrawerProps> = ({
    visible,
    onCancel,
    onAdd,
    onEdit,
    isLoading,
    editData,
    virtualAccountNumber,
    onBack,
}) => {
    const isEditMode = !!editData;
    const individualRef = useRef<FormikProps<typeof individualInitialValues>>(null);
    const businessRef = useRef<FormikProps<typeof businessInitialValues>>(null);
    const [beneficiaryType, setBeneficiaryType] = useState<BeneficiaryType>('individual');
    const [paymentCategory, setPaymentCategory] = useState<BeneficiaryPaymentCategory | undefined>(undefined);
    const [paymentCategoryError, setPaymentCategoryError] = useState('');

    useEffect(() => {
        if (editData) {
            setBeneficiaryType((editData.beneficiaryType ?? editData.type) === 'BUSINESS' ? 'business' : 'individual');
            setPaymentCategory(editData.paymentCategory);
        } else {
            setBeneficiaryType('individual');
            setPaymentCategory(undefined);
            setPaymentCategoryError('');
            individualRef.current?.resetForm();
            businessRef.current?.resetForm();
        }
    }, [editData, visible]);

    const handleSubmit = async () => {
        if (!paymentCategory) setPaymentCategoryError('Please select a payment category');
        const ref = beneficiaryType === 'individual' ? individualRef.current : businessRef.current;
        if (!ref) return;
        const touched = Object.keys(ref.values).reduce((acc, key) => ({ ...acc, [key]: true }), {});
        await ref.setTouched(touched);
        if (!paymentCategory) return;
        ref.submitForm();
    };

    type SharedFields = Omit<typeof individualInitialValues, 'fullName'>;
    const buildPayload = (type: 'INDIVIDUAL' | 'BUSINESS', name: string, values: SharedFields): AddBeneficiaryPayload => ({
        type,
        name,
        email: values.email || undefined,
        mobile: values.phoneNumber || undefined,
        accountNumber: values.accountNumber,
        ifscCode: values.ifscCode,
        bankName: values.bankName || undefined,
        branchName: values.branchName || undefined,
        upiId: values.upiId || undefined,
        panNumber: values.panNumber || undefined,
        address: values.address || undefined,
        paymentCategory: paymentCategory || undefined,
        virtualAccountNumber: virtualAccountNumber ?? undefined,
    });

    const handleIndividualSubmit = async (values: typeof individualInitialValues) => {
        const payload = buildPayload('INDIVIDUAL', values.fullName, values);
        if (isEditMode) { await onEdit?.(payload); } else { await onAdd(payload); }
    };

    const handleBusinessSubmit = async (values: typeof businessInitialValues) => {
        const payload = buildPayload('BUSINESS', values.businessName, values);
        if (isEditMode) { await onEdit?.(payload); } else { await onAdd(payload); }
    };

    return (
        <Drawer
            open={visible}
            onClose={onCancel}
            placement="right"
            width={420}
            closable={false}
            title={
                <Flex align="center" justify="space-between">
                    <Flex align="center" gap={8}>
                        {onBack && (
                            <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack} size="small" />
                        )}
                        <Space direction="vertical" size={2}>
                            <Title level={4} className="m-0">
                                {isEditMode ? 'Edit Beneficiary' : 'Add Beneficiary'}
                            </Title>
                            <Text type="secondary" style={{ fontSize: 13, fontWeight: 'normal' }}>
                                {isEditMode ? 'Update beneficiary details' : 'Add your payment beneficiaries'}
                            </Text>
                        </Space>
                    </Flex>
                    <Button type="text" icon={<CloseOutlined />} onClick={onCancel} />
                </Flex>
            }
            footer={
                <Row justify="end" gutter={12}>
                    <Col>
                        <Button onClick={onCancel} style={{ borderRadius: 8 }}>
                            Cancel
                        </Button>
                    </Col>
                    <Col>
                        <Button
                            type="primary"
                            onClick={handleSubmit}
                            loading={isLoading}
                            style={{
                                borderRadius: 8,
                                background: '#FF4D4F',
                                borderColor: '#FF4D4F',
                            }}
                        >
                            {isEditMode ? 'Save Changes' : 'Add Beneficiary'}
                        </Button>
                    </Col>
                </Row>
            }
        >
            {/* Beneficiary Type Selector */}
            <Text strong className="mb-2">Beneficiary Type</Text>
            <Row gutter={12} style={{ marginBottom: 20 }}>
                {typeOptions.map(option => (
                    <Col className="mt-3" span={12} key={option.key}>
                        <Flex
                            align="center"
                            justify="center"
                            gap={8}
                            onClick={() => !isEditMode && setBeneficiaryType(option.key)}
                            style={{
                                padding: '10px 16px',
                                borderRadius: 8,
                                border: `1.5px solid #e5e7eb`,
                                background: beneficiaryType === option.key ? '#fff1f2' : '#fff',
                                cursor: isEditMode ? 'not-allowed' : 'pointer',
                                color: beneficiaryType === option.key ? '#FF4D4F' : '#000000',
                                fontWeight: beneficiaryType === option.key ? 600 : 400,
                                fontSize: 14,
                                transition: 'all 0.2s',
                                opacity: isEditMode && beneficiaryType !== option.key ? 0.4 : 1,
                            }}
                        >
                            {option.icon}
                            {option.label}
                        </Flex>
                    </Col>
                ))}
            </Row>

            {/* Payment Category */}
            <Flex vertical gap={4} style={{ marginBottom: 20 }}>
                <Text strong><span style={{ color: '#FF4D4F' }}>* </span>Payment Category</Text>
                <Select
                    className="w-full"
                    placeholder="Select payment category"
                    value={paymentCategory}
                    status={paymentCategoryError ? 'error' : undefined}
                    onChange={val => { setPaymentCategory(val); setPaymentCategoryError(''); }}
                    options={paymentCategoryOptions}
                    allowClear
                    onClear={() => setPaymentCategoryError('Please select a payment category')}
                />
                {paymentCategoryError && (
                    <div className="ant-form-item-explain-error" style={{ color: '#ff4d4f' }}>{paymentCategoryError}</div>
                )}
            </Flex>

            {/* Individual Form */}
            {beneficiaryType === 'individual' && (
                <Formik
                    innerRef={individualRef}
                    enableReinitialize
                    initialValues={editData && (editData.beneficiaryType ?? editData.type) === 'INDIVIDUAL' ? {
                        fullName: editData.fullName ?? editData.name,
                        email: editData.email ?? '',
                        phoneNumber: editData.mobile ?? '',
                        accountNumber: editData.accountNumber,
                        ifscCode: editData.ifscCode,
                        bankName: editData.bankName ?? '',
                        branchName: editData.branchName ?? '',
                        upiId: editData.upiId ?? '',
                        panNumber: editData.panNumber ?? '',
                        address: editData.address ?? '',
                    } : individualInitialValues}
                    validationSchema={individualValidationSchema}
                    onSubmit={handleIndividualSubmit}
                >
                    <Form layout="vertical" className="w-full">
                        <Title level={5} style={{ marginBottom: 12 }}>
                            Basic Information
                        </Title>

                        <TextInput
                            name="fullName"
                            label="Full Name"
                            placeholder="Enter full name"
                            type="text"
                            isRequired
                            maxLength={50}
                            allowAlphabetsAndSpaceOnly
                        />

                        <Row gutter={12}>
                            <Col span={12}>
                                <TextInput
                                    name="email"
                                    label="Email"
                                    placeholder="email@example.com"
                                    type="email"
                                    maxLength={50}
                                />
                            </Col>
                            <Col span={12}>
                                <TextInput
                                    name="phoneNumber"
                                    label="Phone Number"
                                    placeholder="Phone number"
                                    type="text"
                                    maxLength={10}
                                    allowNumbersOnly
                                />
                            </Col>
                        </Row>

                        <CommonBankFields />
                    </Form>
                </Formik>
            )}

            {/* Business Form */}
            {beneficiaryType === 'business' && (
                <Formik
                    innerRef={businessRef}
                    enableReinitialize
                    initialValues={editData && (editData.beneficiaryType ?? editData.type) === 'BUSINESS' ? {
                        businessName: editData.fullName ?? editData.name,
                        email: editData.email ?? '',
                        phoneNumber: editData.mobile ?? '',
                        accountNumber: editData.accountNumber,
                        ifscCode: editData.ifscCode,
                        bankName: editData.bankName ?? '',
                        branchName: editData.branchName ?? '',
                        upiId: editData.upiId ?? '',
                        panNumber: editData.panNumber ?? '',
                        address: editData.address ?? '',
                    } : businessInitialValues}
                    validationSchema={businessValidationSchema}
                    onSubmit={handleBusinessSubmit}
                >
                    <Form layout="vertical" className="w-full">
                        <Title level={5} style={{ marginBottom: 12 }}>
                            Basic Information
                        </Title>

                        <TextInput
                            name="businessName"
                            label="Business Name"
                            placeholder="Enter business name"
                            type="text"
                            isRequired
                            maxLength={50}
                        />

                        <Row gutter={12}>
                            <Col span={12}>
                                <TextInput
                                    name="email"
                                    label="Email"
                                    placeholder="email@example.com"
                                    type="text"
                                    maxLength={50}
                                />
                            </Col>
                            <Col span={12}>
                                <TextInput
                                    name="phoneNumber"
                                    label="Phone Number"
                                    placeholder="+91 98765 43210"
                                    type="text"
                                    maxLength={10}
                                />
                            </Col>
                        </Row>

                        <CommonBankFields />
                    </Form>
                </Formik>
            )}
        </Drawer>
    );
};

export default AddBeneficiaryDrawer;
