import { useState } from 'react';

import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { Modal, Form, Button, Typography, Flex, Input } from 'antd';
import { Formik } from 'formik';

import { useProductsBulkUpload } from '../../../hooks/useProductsBulkUpload';
import { fileSchema } from '../../../schema/bulkSchema';
import { BulkProductsUploadPayload } from '../../../types/products';

type BulkUploadModalProps = {
    open: boolean;
    handleCancel: () => void;
};

const BulkUploadModal = ({ open, handleCancel }: BulkUploadModalProps) => {
    const { getProductBulkUploadTemplate, BulkUpload, isLoading, isTempLoading } =
        useProductsBulkUpload();

    const [fileName, setFileName] = useState<string | null>(null);
    const [form] = Form.useForm();

    const handleUpload = async (values: any) => {
        const payload: BulkProductsUploadPayload = {
            file: values.file as File,
        };
        await BulkUpload(payload);
        handleCancel();
    };

    return (
        <Modal
            title={
                <Flex justify="space-between" align="center">
                    <Typography.Text className="text-sm">Bulk Upload</Typography.Text>
                </Flex>
            }
            open={open}
            onCancel={handleCancel}
            footer={null} // Remove the footer from here
        >
            <Formik
                initialValues={{
                    file: null,
                }}
                validationSchema={fileSchema}
                onSubmit={values => handleUpload(values)}
            >
                {({ values, handleChange, isSubmitting, setFieldValue, errors, handleSubmit }) => (
                    <Form form={form}>
                        {' '}
                        {/* Add onSubmit handler to the Form component */}
                        <Flex vertical className="mt-5 ">
                            <Typography.Text className="">Upload Excel</Typography.Text>
                            <Input
                                name="file"
                                type="file"
                                onChange={event => {
                                    const files = event.currentTarget.files
                                        ? event.currentTarget.files[0]
                                        : null;
                                    if (files) {
                                        setFieldValue('file', files);
                                        setFileName(files.name);
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
                            {fileName && ( // Conditionally render the file name
                                <Typography.Text className="mt-2 text-red-500 uploaded-file-name">
                                    {fileName}
                                </Typography.Text>
                            )}
                            {errors.file && (
                                <div className="text-red-500 error-message"> {errors.file} </div>
                            )}
                        </Flex>
                        <Flex gap={10}>
                            <Button
                                key="submit"
                                type="primary"
                                danger
                                htmlType="submit" // Specify htmlType as "submit"
                                loading={isSubmitting || isLoading}
                                onClick={() => handleSubmit()}
                                style={{ marginTop: '1rem' }} // Add some margin to separate it from the input
                            >
                                Submit
                            </Button>
                            <Button
                                onClick={() => handleCancel()}
                                style={{ marginTop: '1rem' }} // Add some margin to separate it from the input
                            >
                                Cancel
                            </Button>
                        </Flex>
                        <Button
                            className="mt-3 text-green-400"
                            type="link"
                            icon={<DownloadOutlined />}
                            loading={isTempLoading}
                            onClick={getProductBulkUploadTemplate}
                            style={{ color: 'rgb(74 222 128)' }}
                        >
                            Download Excel Template
                        </Button>
                    </Form>
                )}
            </Formik>
        </Modal>
    );
};

export default BulkUploadModal;
