import { useState } from 'react';

import { DownloadOutlined, LoadingOutlined, UploadOutlined } from '@ant-design/icons';
import { Modal, Form, Button, Typography, Flex, Input } from 'antd';
import { Formik } from 'formik';

import { useBulkUploadApi } from '../../hooks/employeeHooks/useBulkUploadApi';
import GetExcelTemplate from '../../hooks/employeeHooks/useGetExceltemplate';
import { fileSchema } from '../../schema/bulkSchema';
import { BulkUploadPayload } from '../../types/types';

type BulkUploadModalProps = {
    open: boolean;
    handleCancel: () => void;
};

const BulkUploadModal = ({ open, handleCancel }: BulkUploadModalProps) => {
    const { getBulkExcelTemplate, isLoading: excelLoading } = GetExcelTemplate();
    const { BulkUpload, isLoading } = useBulkUploadApi();

    const [fileName, setFileName] = useState<string | null>(null);
    const [form] = Form.useForm();

    const handleUpload = async (values: any) => {
        const selectedFile = values.file;

        const formData = new FormData();
        formData.append('file', selectedFile, selectedFile.name);

        const payload: BulkUploadPayload = {
            file: formData.get('file') as File,
        };

        try {
            await BulkUpload(payload);

            handleCancel();
        } catch (error) {
            console.error('Error uploading file:', error);
        }
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
            footer={null}
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
                                <Typography.Text className="mt-2 text-blue-500 uploaded-file-name">
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
                                style={{ marginTop: '1rem' }}
                            >
                                Submit
                            </Button>
                            <Button onClick={() => handleCancel()} style={{ marginTop: '1rem' }}>
                                Cancel
                            </Button>
                        </Flex>
                        <Flex className="mt-3">
                            <Typography.Link
                                onClick={getBulkExcelTemplate}
                                style={{
                                    color: 'rgb(74 222 128)',
                                    cursor: 'pointer',
                                    gap: '5px',
                                    display: 'inline-flex',
                                }}
                            >
                                {excelLoading ? <LoadingOutlined spin /> : <DownloadOutlined />}
                                Download Excel Template
                            </Typography.Link>
                        </Flex>
                    </Form>
                )}
            </Formik>
        </Modal>
    );
};

export default BulkUploadModal;
