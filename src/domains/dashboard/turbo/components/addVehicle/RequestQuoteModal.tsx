import React from 'react';

import { CloseOutlined } from '@ant-design/icons';
import { Button, Flex, Form, Modal, Typography } from 'antd';
import { Formik, FormikProps } from 'formik';
import * as Yup from 'yup';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';

interface QuoteFormValues {
    fullName: string;
    mobileNumber: string;
    email: string;
    insuranceType: string;
}

interface RequestQuoteModalProps {
    open: boolean;
    handleCancel: () => void;
    handleSubmit: (values: QuoteFormValues) => void;
    vehicleNumber?: string;
    initialValues?: Partial<QuoteFormValues>;
    isLoading?: boolean;
}

const insuranceTypeOptions = [
    { label: 'Comprehensive', value: 'Comprehensive' },
    { label: 'Third-Party', value: 'Third-Party' },
    { label: 'Own Damage', value: 'Own Damage' },
    { label: 'Zero Depreciation', value: 'Zero Depreciation' },
];

const RequestQuoteModal = ({
    open,
    handleCancel,
    handleSubmit,
    vehicleNumber,
    initialValues,
    isLoading = false,
}: RequestQuoteModalProps) => {
    const validationSchema = Yup.object().shape({
        fullName: Yup.string().required('Please enter the full name'),
        mobileNumber: Yup.string()
            .required('Please enter the mobile number')
            .matches(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number'),
        email: Yup.string()
            .required('Please enter the email')
            .email('Please enter a valid email'),
        insuranceType: Yup.string().required('Please select the insurance type'),
    });

    const formInitialValues: QuoteFormValues = {
        fullName: initialValues?.fullName || '',
        mobileNumber: initialValues?.mobileNumber || '',
        email: initialValues?.email || '',
        insuranceType: initialValues?.insuranceType || '',
    };

    return (
        <Modal
            open={open}
            onCancel={handleCancel}
            closeIcon={null}
            centered
            width={560}
            footer={null}
            styles={{ body: { padding: 8 } }}
        >
            <Formik
                initialValues={formInitialValues}
                validationSchema={validationSchema}
                enableReinitialize
                validateOnChange={false}
                onSubmit={values => handleSubmit(values)}
            >
                {({ handleSubmit: submitForm }: FormikProps<QuoteFormValues>) => (
                    <Form layout="vertical">
                        <Flex justify="space-between" align="center" className="mb-8">
                            <Typography.Text className="text-2xl font-semibold">
                                {vehicleNumber
                                    ? `Request a Quote for ${vehicleNumber}`
                                    : 'Request a Quote'}
                            </Typography.Text>
                            <Button
                                type="text"
                                shape="circle"
                                icon={<CloseOutlined />}
                                onClick={handleCancel}
                            />
                        </Flex>

                        <TextInput
                            name="fullName"
                            type="text"
                            label="Full Name"
                            placeholder="Enter Full Name"
                            allowAlphabetsAndSpaceOnly
                            isRequired
                        />
                        <TextInput
                            name="mobileNumber"
                            type="text"
                            label="Mobile Number"
                            placeholder="Enter Mobile Number"
                            allowNumbersOnly
                            maxLength={10}
                            inputMode="numeric"
                            isRequired
                        />
                        <TextInput
                            name="email"
                            type="text"
                            label="Email"
                            placeholder="Enter Email"
                            allowEmailsOnly
                            inputMode="email"
                            isRequired
                        />
                        <SelectInput
                            name="insuranceType"
                            label="Insurance Type"
                            placeholder="Select Insurance Type"
                            options={insuranceTypeOptions}
                            isRequired
                        />

                        <Flex gap={20} className="mt-6">
                            <Button
                                size="large"
                                danger
                                className="flex-1"
                                onClick={handleCancel}
                            >
                                Cancel
                            </Button>
                            <Button
                                size="large"
                                type="primary"
                                danger
                                className="flex-1"
                                loading={isLoading}
                                onClick={() => submitForm()}
                            >
                                Submit Request
                            </Button>
                        </Flex>
                    </Form>
                )}
            </Formik>
        </Modal>
    );
};

export default RequestQuoteModal;
