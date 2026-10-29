import React, { useEffect, useRef } from 'react';

import { ArrowLeftOutlined, CloseOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Button, Col, Drawer, Flex, Form, Row, Space, Tooltip, Typography } from 'antd';
import { Formik, FormikProps } from 'formik';

import DatePickerInput from '@src/components/atomic/inputs/DatePickerInput';
import FileUploadInput from '@src/components/atomic/inputs/FileUploadInput';
import InputTextArea from '@src/components/atomic/inputs/InputTextArea';
import SelectInput from '@src/components/atomic/inputs/SelectInput';
import TextInput from '@src/components/atomic/inputs/TextInput';
import { useVendor } from '@src/domains/dashboard/Procure/hooks/useVendor';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import usePostOtherBillApi from '../hooks/usePostOtherBillApi';
import { vendorPaymentsValidationSchema } from '../schema/vendorPaymentsDrawer';
import { PendingRentPayout, VendorWithPayoutInfo } from '../types';

const { Text, Title } = Typography;

interface VendorPaymentsDrawerProps {
    visible: boolean;
    onCancel: () => void;
    onBack: () => void;
    onCreateBill: (data: PendingRentPayout) => void;
}

const initialValues = {
    vendorId: '',
    dueDate: '',
    totalAmount: '',
    description: '',
    notes: '',
    attachment: '',
};

const VendorPaymentsDrawer: React.FC<VendorPaymentsDrawerProps> = ({
    visible,
    onCancel,
    onBack,
    onCreateBill,
}) => {
    const dispatch = useAppDispatch();
    const formikRef = useRef<FormikProps<typeof initialValues>>(null);
    const { vendors, isLoading: vendorsLoading, fetchVendorsWithoutPagination } = useVendor();
    const { submitOtherBill, isLoading: submitLoading } = usePostOtherBillApi();

    useEffect(() => {
        if (visible) fetchVendorsWithoutPagination();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    const payoutVendors = (vendors as VendorWithPayoutInfo[]).filter(v => v.payoutBeneficiaryId != null);

    const vendorOptions = payoutVendors.map(v => ({
        label: v.businessName,
        value: String(v.id),
    }));

    const handleSubmit = async (values: typeof initialValues) => {
        const selectedVendor = payoutVendors.find(v => String(v.id) === values.vendorId);
        console.log(selectedVendor,"selected vendor")
        if (!selectedVendor?.payoutBeneficiaryId) {
            dispatch(showToast({ description: 'Selected vendor has no linked payout beneficiary', variant: 'error' }));
            return;
        }

        const res = await submitOtherBill({
            beneficiaryId: selectedVendor.payoutBeneficiaryId,
            billTitle: `Vendor Payment - ${selectedVendor.businessName}`,
            payeeName: selectedVendor.businessName,
            dueDate: values.dueDate,
            description: values.description,
            totalAmount: parseFloat(values.totalAmount),
            notes: values.notes || undefined,
            attachment: values.attachment || undefined,
            category: 'VENDOR_PAYMENT',
        });

        if (res) {
            dispatch(showToast({ description: 'Bill created successfully', variant: 'success' }));
            onCreateBill({
                rentBillId: res.id,
                beneficiaryId: res.payoutBeneficiaryId ?? selectedVendor.payoutBeneficiaryId,
                amount: res.totalAmount,
                payeeName: selectedVendor.businessName,
                createdAt: res.createdAt,
                category: 'VENDOR_PAYMENT',
                beneficiaryAccountNumber: selectedVendor.accountNumber ?? undefined,
                beneficiaryIfscCode: selectedVendor.ifscCode ?? undefined,
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
                                Add Vendor Payment
                            </Title>
                            <Text type="secondary" style={{ fontSize: 13, fontWeight: 'normal' }}>
                                Fill in the payment details below
                            </Text>
                        </Space>
                    </Space>
                    <Button type="text" icon={<CloseOutlined />} onClick={onCancel} />
                </Flex>
            }
            footer={
                <Row justify="end" gutter={12}>
                    <Col>
                        <Button onClick={onBack} style={{ borderRadius: 8 }}>
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
                validationSchema={vendorPaymentsValidationSchema}
                onSubmit={handleSubmit}
            >
                <Form layout="vertical" className="w-full">
                    <Title level={5} className="mb-4">
                        Vendor Payment Details
                    </Title>

                    <SelectInput
                        name="vendorId"
                        label={
                            <Space size={4}>
                                <span>Select Vendor</span>
                                <Tooltip title="Only vendors registered as payout beneficiaries are listed here">
                                    <InfoCircleOutlined style={{ color: '#94a3b8', fontSize: 13, cursor: 'help' }} />
                                </Tooltip>
                            </Space>
                        }
                        placeholder={vendorsLoading ? 'Loading vendors...' : 'Select a vendor'}
                        isRequired
                        options={vendorOptions}
                        showSearch
                        filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                    />

                    <Row gutter={12}>
                        <Col span={12}>
                            <TextInput
                                name="totalAmount"
                                label="Amount"
                                placeholder="0.00"
                                type="text"
                                isRequired
                                allowTwoDecimalsOnly
                                maxLength={10}
                                prefix="₹"
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

                    <InputTextArea
                        name="description"
                        label="Description"
                        placeholder="Enter payment description"
                        isRequired
                        maxLength={250}
                        showCount
                        autoSize={{ minRows: 3 }}
                    />

                    <InputTextArea
                        name="notes"
                        label="Notes"
                        placeholder="Add any additional notes"
                        maxLength={250}
                        autoSize={{ minRows: 3 }}
                        showCount
                    />

                    <FileUploadInput
                        name="attachment"
                        label="Attachment (Optional)"
                        allowedFileTypes={['image/jpeg', 'image/png', 'application/pdf']}
                        maxFileSize={10240}
                        showFileName
                        allowFileDelete
                        subLabel="PDF, PNG, JPG up to 10MB"
                    />
                </Form>
            </Formik>
        </Drawer>
    );
};

export default VendorPaymentsDrawer;
