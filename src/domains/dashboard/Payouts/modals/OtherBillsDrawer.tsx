import React, { useEffect, useRef } from 'react';

import { ArrowLeftOutlined, CloseOutlined } from '@ant-design/icons';
import { Button, Col, Drawer, Flex, Form, Row, Space, Typography } from 'antd';
import { Formik, FormikProps } from 'formik';


import DatePickerInput from '@src/components/atomic/inputs/DatePickerInput';
import FileUploadInput from '@src/components/atomic/inputs/FileUploadInput';
import InputTextArea from '@src/components/atomic/inputs/InputTextArea';
import SelectInput from '@src/components/atomic/inputs/SelectInput';
import TextInput from '@src/components/atomic/inputs/TextInput';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import useGetBeneficiariesApi from '../hooks/useGetBeneficiariesApi';
import usePostOtherBillApi from '../hooks/usePostOtherBillApi';
import { otherBillsValidationSchema } from '../schema/otherBillsDrawer';
import { PendingRentPayout } from '../types';

const { Text, Title } = Typography;

interface OtherBillsDrawerProps {
    visible: boolean;
    onCancel: () => void;
    onBack: () => void;
    onCreateBill: (data: PendingRentPayout) => void;
}

const initialValues = {
    beneficiary: '',
    billTitle: '',
    payeeName: '',
    billReferenceNumber: '',
    dueDate: '',
    description: '',
    totalAmount: '',
    notes: '',
    attachment: '',
};


const OtherBillsDrawer: React.FC<OtherBillsDrawerProps> = ({
    visible,
    onCancel,
    onBack,
    onCreateBill,
}) => {
    const dispatch = useAppDispatch();
    const formikRef = useRef<FormikProps<typeof initialValues>>(null);
    const { getBeneficiaries, data: beneficiaries } = useGetBeneficiariesApi();
    const { submitOtherBill, isLoading: submitLoading } = usePostOtherBillApi();

    useEffect(() => {
        if (visible) {
            getBeneficiaries();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    const beneficiaryOptions = beneficiaries.map(b => ({
        label: b.fullName,
        value: String(b.id),
    }));

    const handleSubmit = async (values: typeof initialValues) => {
        const selectedBeneficiary = beneficiaries.find(b => String(b.id) === values.beneficiary);
        const res = await submitOtherBill({
            beneficiaryId: Number(values.beneficiary),
            billTitle: values.billTitle,
            payeeName: values.payeeName,
            billReferenceNumber: values.billReferenceNumber || undefined,
            dueDate: values.dueDate,
            description: values.description,
            totalAmount: parseFloat(values.totalAmount),
            notes: values.notes || undefined,
            attachment: values.attachment || undefined,
        });
        if (res) {
            dispatch(showToast({ description: 'Bill created successfully', variant: 'success' }));
            onCreateBill({
                rentBillId: res.id,
                beneficiaryId: res.payoutBeneficiaryId ?? Number(values.beneficiary),
                amount: res.totalAmount,
                payeeName: res.payeeName,
                createdAt: res.createdAt,
                category: 'OTHER',
                beneficiaryAccountNumber: selectedBeneficiary?.accountNumber,
                beneficiaryIfscCode: selectedBeneficiary?.ifscCode,
            });
        }
    };

    return (
        <Drawer
            open={visible}
            onClose={onCancel}
            placement="right"
            width={480}
            closable={false}
            title={
                <Flex align="center" justify="space-between">
                    <Space>
                        <Button
                            type="text"
                            icon={<ArrowLeftOutlined />}
                            onClick={onBack}
                            size="small"
                        />
                        <Space direction="vertical" size={2}>
                            <Title level={4} className="m-0">
                                Add Other Bills
                            </Title>
                            <Text type="secondary" style={{ fontSize: 13, fontWeight: 'normal' }}>
                                Fill in the bill details below
                            </Text>
                        </Space>
                    </Space>
                    <Button type="text" icon={<CloseOutlined />} onClick={onCancel} />
                </Flex>
            }
            footer={
                <Row justify="end" gutter={12}>
                    <Col>
                        <Button onClick={onCancel} style={{ borderRadius: 8 }}>
                            Back
                        </Button>
                    </Col>
                    <Col>
                        <Button
                            type="primary"
                            loading={submitLoading}
                            onClick={() => formikRef.current?.submitForm()}
                            style={{
                                borderRadius: 8,
                                background: '#FF4D4F',
                                borderColor: '#FF4D4F',
                            }}
                        >
                            Create Bill
                        </Button>
                    </Col>
                </Row>
            }
        >
            <Formik
                innerRef={formikRef}
                initialValues={initialValues}
                validationSchema={otherBillsValidationSchema}
                onSubmit={handleSubmit}
            >
                <Form layout="vertical" className="w-full">
                    <Title level={5} className="mb-4">
                        Rent Payment Details
                    </Title>

                    <SelectInput
                        name="beneficiary"
                        label="Select Beneficiary"
                        placeholder="Select Beneficiary"
                        isRequired
                        options={beneficiaryOptions}
                    />

                    <TextInput
                        name="billTitle"
                        label="Bill Title"
                        placeholder="Enter bill title"
                        type="text"
                        isRequired
                        allowAlphabetsNumberAndSpecialCharacters={[',', '-', '/', '']}
                        maxLength={50}
                    />

                    <TextInput
                        name="payeeName"
                        label="Payee Name"
                        placeholder="Enter payee name"
                        type="text"
                        isRequired
                        allowAlphabetsAndSpaceOnly
                        maxLength={50}
                    />

                    <Row gutter={12}>
                        <Col span={12}>
                            <TextInput
                                name="billReferenceNumber"
                                label="Bill Reference Number"
                                placeholder="Enter reference number"
                                type="text"
                                allowNumbersOnly
                                maxLength={10}
                            />
                        </Col>
                        <Col span={12}>
                            <DatePickerInput
                                name="dueDate"
                                label="Due Date"
                                placeholder="Select due Date"
                                isRequired
                                classes="w-full"
                            />
                        </Col>
                    </Row>

                    <InputTextArea
                        name="description"
                        label="Description"
                        placeholder="Enter bill description"
                        isRequired
                        autoSize={{ minRows: 3 }}
                        maxLength={250}
                        showCount
                    />

                    <TextInput
                        name="totalAmount"
                        label="Total Amount"
                        placeholder="0.00"
                        type="text"
                        isRequired
                        allowTwoDecimalsOnly
                        maxLength={10}
                    />

                    <InputTextArea
                        name="notes"
                        label="Notes"
                        placeholder="Add any additional notes"
                        autoSize={{ minRows: 3 }}
                        showCount
                        maxLength={50}
                    />

                    <FileUploadInput
                        name="attachment"
                        label="Attachment (Optional)"
                        allowedFileTypes={['image/jpeg', 'image/png', 'application/pdf']}
                        maxFileSize={10240}
                        showFileName
                        allowFileDelete
                        subLabel='PDF, PNG, JPG up to 10MB'
                    />
                    
                </Form>
            </Formik>
        </Drawer>
    );
};

export default OtherBillsDrawer;
