import { useState } from 'react';

import { DownloadOutlined, LoadingOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Flex, Form, Input, Modal, Typography } from 'antd';
import { Formik } from 'formik';

import { useBulkCustomerUploadApi } from '../../hooks/customer/useBulkCustomerUploadApi';
import { useCustomerExcelTemplate } from '../../hooks/customer/useCustomerExcelTemplate';
import { bulkCustomerFileSchema } from '../../schema/customer/bulkCustomerSchema';

type BulkUploadCustomerModalProps = {
    open: boolean;
    handleCancel: () => void;
};

const BulkUploadCustomerModal = ({ open, handleCancel }: BulkUploadCustomerModalProps) => {
    const { downloadTemplate, isLoading: templateLoading } = useCustomerExcelTemplate();
    const { uploadBulkCustomers, isLoading } = useBulkCustomerUploadApi();
    const [fileName, setFileName] = useState<string | null>(null);

    return (
        <Modal
            title={
                <Typography.Text className="text-sm font-medium">
                    Bulk Upload Customer
                </Typography.Text>
            }
            open={open}
            onCancel={handleCancel}
            footer={null}
        >
            <Formik
                initialValues={{ file: null as File | null }}
                validationSchema={bulkCustomerFileSchema}
                onSubmit={async values => {
                    if (values.file) {
                        const success = await uploadBulkCustomers(values.file);
                        if (success) handleCancel();
                    }
                }}
            >
                {({ isSubmitting, setFieldValue, errors, handleSubmit }) => (
                    <Form onFinish={handleSubmit}>
                        <Flex vertical className="mt-5">
                            <Typography.Text>Upload Excel</Typography.Text>
                            <Input
                                name="file"
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={event => {
                                    const file = event.currentTarget.files
                                        ? event.currentTarget.files[0]
                                        : null;
                                    if (file) {
                                        setFieldValue('file', file);
                                        setFileName(file.name);
                                    }
                                }}
                                style={{ display: 'none' }}
                            />
                            <Button
                                className="mt-4"
                                icon={<UploadOutlined />}
                                onClick={() => document.getElementsByName('file')[0]?.click()}
                            >
                                Upload New
                            </Button>
                            {fileName && (
                                <Typography.Text className="mt-2 text-blue-500">
                                    {fileName}
                                </Typography.Text>
                            )}
                            {errors.file && (
                                <div className="text-red-500 mt-1">{errors.file as string}</div>
                            )}
                        </Flex>
                        <Flex gap={10} className="mt-4">
                            <Button
                                type="primary"
                                danger
                                htmlType="submit"
                                loading={isSubmitting || isLoading}
                            >
                                Submit
                            </Button>
                            <Button onClick={handleCancel}>Cancel</Button>
                        </Flex>
                        <Flex className="mt-3">
                            <Typography.Link
                                onClick={downloadTemplate}
                                style={{
                                    color: 'rgb(74 222 128)',
                                    cursor: 'pointer',
                                    gap: '5px',
                                    display: 'inline-flex',
                                }}
                            >
                                {templateLoading ? <LoadingOutlined spin /> : <DownloadOutlined />}
                                Download Excel Template
                            </Typography.Link>
                        </Flex>
                    </Form>
                )}
            </Formik>
        </Modal>
    );
};

export default BulkUploadCustomerModal;
