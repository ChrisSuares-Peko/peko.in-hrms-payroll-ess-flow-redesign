import React, { useEffect, useRef } from 'react';

import { ArrowLeftOutlined, CloseOutlined } from '@ant-design/icons';
import { Button, Col, Drawer, Flex, Row, Typography , Form } from 'antd';
import { Formik, FormikProps } from 'formik';

import DatePickerInput from '@src/components/atomic/inputs/DatePickerInput';
import FileUploadInput from '@src/components/atomic/inputs/FileUploadInput';
import InputTextArea from '@src/components/atomic/inputs/InputTextArea';
import MonthPickerInput from '@src/components/atomic/inputs/MonthPickerInput';
import SelectInput from '@src/components/atomic/inputs/SelectInput';
import TextInput from '@src/components/atomic/inputs/TextInput';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import useGetBeneficiariesApi from '../hooks/useGetBeneficiariesApi';
import usePostRentBillApi from '../hooks/usePostRentBillApi';
import { rentInitialValues, rentValidationSchema } from '../schema/rentDrawer';
import { PendingRentPayout } from '../types';

const { Text, Title } = Typography;

interface RentDrawerProps {
    visible: boolean;
    onCancel: () => void;
    onBack: () => void;
    onCreateBill: (data: PendingRentPayout) => void;
}

const RentDrawer: React.FC<RentDrawerProps> = ({ visible, onCancel, onBack, onCreateBill }) => {
    const dispatch = useAppDispatch();
    const formikRef = useRef<FormikProps<typeof rentInitialValues>>(null);
    const { getBeneficiaries, data: beneficiaries } = useGetBeneficiariesApi();
    const { submitRentBill, isLoading: submitLoading } = usePostRentBillApi();

    useEffect(() => {
        if (visible) {
            getBeneficiaries();
            formikRef.current?.resetForm();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    const beneficiaryOptions = beneficiaries.map(b => ({
        label: b.fullName,
        value: String(b.id),
    }));

    const handleSubmit = async (values: typeof rentInitialValues) => {
        const selectedBeneficiary = beneficiaries.find(b => String(b.id) === values.beneficiary);
        const res = await submitRentBill({
            beneficiaryId: Number(values.beneficiary),
            landlordName: values.landlordName,
            propertyAddress: values.propertyAddress,
            rentPeriod: values.rentPeriod,
            dueDate: values.dueDate,
            rentAmount: parseFloat(values.rentAmount),
            maintenanceCharges: values.maintenanceCharges ? parseFloat(values.maintenanceCharges) : undefined,
            leaseAgreementNumber: values.leaseAgreementNumber || undefined,
            notes: values.notes || undefined,
            attachment: values.attachment || undefined,
        });
        if (res) {
            dispatch(showToast({ description: 'Rent bill created successfully', variant: 'success' }));
            onCreateBill({
                rentBillId: res.id,
                beneficiaryId: res.payoutBeneficiaryId ?? Number(values.beneficiary),
                amount: res.totalAmount,
                payeeName: res.landlordName,
                createdAt: res.createdAt,
                category: 'RENT',
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
                <Flex vertical gap={2}>
                    <Flex align="center" justify="space-between">
                        <Flex align="center" gap={4}>
                            <Button
                                type="text"
                                icon={<ArrowLeftOutlined />}
                                onClick={onBack}
                                size="small"
                            />
                            <Title level={4} className="m-0">
                                Add Rent
                            </Title>
                        </Flex>
                        <Button type="text" icon={<CloseOutlined />} onClick={onCancel} />
                    </Flex>
                    <Text type="secondary" style={{ fontSize: 13, fontWeight: 'normal', paddingLeft: 28 }}>
                        Fill in the bill details below
                    </Text>
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
                            style={{ borderRadius: 8, background: '#FF4D4F', borderColor: '#FF4D4F' }}
                        >
                            Create Bill
                        </Button>
                    </Col>
                </Row>
            }
        >
            <Formik
                innerRef={formikRef}
                initialValues={rentInitialValues}
                validationSchema={rentValidationSchema}
                onSubmit={handleSubmit}
            >
                <Form layout="vertical"  className="w-full">
                    <Flex className="mb-7">
                    <Title level={5} className="m-0">
                        Rent Payment Details
                    </Title>
                    </Flex>

                    <SelectInput
                        name="beneficiary"
                        label="Select Beneficiary"
                        placeholder="Select beneficiary"
                        isRequired
                        options={beneficiaryOptions}
                        
                    />

                    <TextInput
                        name="landlordName"
                        label="Landlord Name"
                        placeholder="Enter landlord name"
                        type="text"
                        isRequired
                        maxLength={50}
                        allowAlphabetsAndSpaceOnly
                    />

                    <InputTextArea
                        name="propertyAddress"
                        label="Property Address"
                        placeholder="Enter complete property address"
                        isRequired
                        autoSize={{ minRows: 3 }}
                        maxLength={200}
                    />

                    <Row gutter={12}>
                        <Col span={12}>
                            <MonthPickerInput
                                name="rentPeriod"
                                label="Rent Period"
                                placeholder="e.g., March 2026"
                                isRequired
                                classes="w-full"
                            />
                        </Col>
                        <Col span={12}>
                            <DatePickerInput
                                name="dueDate"
                                label="Due Date"
                                placeholder="Select due date"
                                isRequired
                                classes="w-full"
                            />
                        </Col>
                    </Row>

                    <Row gutter={12}>
                        <Col span={12}>
                            <TextInput
                                name="rentAmount"
                                label="Rent Amount"
                                placeholder="0.00"
                                type="text"
                                isRequired
                                allowTwoDecimalsOnly
                                maxLength={10}
                                
                            />
                        </Col>
                        <Col span={12}>
                            <TextInput
                                name="maintenanceCharges"
                                label="Maintenance Charges"
                                placeholder="0.00"
                                type="text"
                                allowTwoDecimalsOnly
                                prefix="₹"
                                maxLength={10}
                            />
                        </Col>
                    </Row>

                    <TextInput
                        name="leaseAgreementNumber"
                        label="Lease Agreement Number"
                        placeholder="Enter agreement number"
                        type="text"
                        maxLength={10}
                        allowNumbersOnly
                    />

                    <InputTextArea
                        name="notes"
                        label="Notes"
                        placeholder="Add any additional notes"
                        autoSize={{ minRows: 3 }}
                        maxLength={200}
                    />

                    <FileUploadInput
                        name="attachment"
                        label="Attachment (Optional)"
                        allowedFileTypes={['image/jpeg', 'image/png', 'application/pdf']}
                        maxFileSize={10240}
                        showFileName
                        subLabel='PDF, PNG, JPG up to 10MB'
                        allowFileDelete
                    />
                    
                </Form>
            </Formik>
        </Drawer>
    );
};

export default RentDrawer;
