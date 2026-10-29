import React from 'react';

import { Button, Drawer, Flex, Form, Space, Typography } from 'antd';
import { Formik } from 'formik';
import { Link } from 'react-router-dom';

import CustomFileUploadInput from '@components/atomic/inputs/CustomFileUploadInput';

import { LogisticsCorporateRecord } from '../../api/logistics';

interface Props {
    open: boolean;
    onClose: () => void;
    record: LogisticsCorporateRecord;
    isUploading: boolean;
    onUpload: (base64String: string, imageFormat: string) => Promise<boolean>;
}

const LogisticsCorporateDrawer = ({ open, onClose, record, isUploading, onUpload }: Props) => (
    <Drawer title="Logistics Corporate Details" width={500} onClose={onClose} open={open}>
        <Flex vertical gap={16}>
            <Typography.Text className="text-base font-bold">
                Corporate Business PAN
            </Typography.Text>

            <Flex justify="space-between" align="center">
                <Typography.Text className="text-base">Business PAN Document</Typography.Text>
                {record.businessPanUrl ? (
                    <Link
                        to={record.businessPanUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#FF3A3A' }}
                    >
                        View
                    </Link>
                ) : (
                    <Typography.Text type="secondary">Not uploaded</Typography.Text>
                )}
            </Flex>

            <Formik
                initialValues={{ base64String: '', imageFormat: '' }}
                onSubmit={async (values, { resetForm }) => {
                    if (!values.base64String) return;
                    const success = await onUpload(values.base64String, values.imageFormat);
                    if (success) {
                        resetForm();
                        onClose();
                    }
                }}
            >
                {({ handleSubmit, values }) => (
                    <Form onFinish={handleSubmit} layout="vertical">
                        <CustomFileUploadInput
                            name="base64String"
                            label="Upload Business PAN (replaces existing)"
                            format="imageFormat"
                            maxFileSize={5120}
                        />
                        <Flex justify="end" style={{ paddingTop: 12 }}>
                            <Space>
                                <Button onClick={onClose}>Cancel</Button>
                                <Button
                                    type="primary"
                                    danger
                                    htmlType="submit"
                                    loading={isUploading}
                                    disabled={!values.base64String}
                                >
                                    Upload PAN
                                </Button>
                            </Space>
                        </Flex>
                    </Form>
                )}
            </Formik>
        </Flex>
    </Drawer>
);

export default LogisticsCorporateDrawer;
