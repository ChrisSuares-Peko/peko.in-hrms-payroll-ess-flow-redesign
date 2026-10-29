import { useState } from 'react';

import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { Modal, Form, Button, Typography, Flex, Upload, Col } from 'antd';
import { RcFile } from 'antd/es/upload';
import { Formik } from 'formik';
import Lottie from 'react-lottie';
import * as Yup from 'yup';

import fileUploadingLottie from '@assets/animation/fileUploading.json';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

const { Text } = Typography;

type BulkUploadModalProps = {
    open: boolean;
    handleCancel: () => void;
    handleBulkUpload: (file: File) => void;
    maxFileSize?: number;
    isUploading?: boolean;
    isTemplateFileLoading?: boolean;
    handleTemplateDownload?: () => void;
};

const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: fileUploadingLottie,
};

const BulkUploadModal = ({
    open,
    handleCancel,
    handleBulkUpload,
    maxFileSize = 200,
    isUploading = false,
    isTemplateFileLoading = false,
    handleTemplateDownload,
}: BulkUploadModalProps) => {
    const [fileName, setFileName] = useState<string | null>(null);
    const dispatch = useAppDispatch();
    const [form] = Form.useForm();

    const handleUpload = async (values: any) => {
        const file = values.file as File;
        await handleBulkUpload(file);
        handleCancel();
    };

    const allowedFileTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
    ];
    const beforeUpload = (file: RcFile) => {
        const isAllowedFileType = allowedFileTypes.includes(file.type);
        if (!isAllowedFileType) {
            dispatch(
                showToast({
                    description: `Please upload a file in Excel format.`,
                    variant: 'error',
                })
            );
        }
        const isLtmaxFileSizeKB = file.size / 1024 <= maxFileSize;
        if (!isLtmaxFileSizeKB) {
            dispatch(
                showToast({
                    description: `file size should be smaller than ${maxFileSize} KB`,
                    variant: 'error',
                })
            );
        }
        return isAllowedFileType && isLtmaxFileSizeKB;
    };

    return (
        <Modal
            title={
                <Flex justify="space-between" align="center">
                    <Text className="text-sm">Bulk Upload</Text>
                </Flex>
            }
            open={open}
            onCancel={handleCancel}
            footer={null}
            centered
        >
            <Formik
                initialValues={{
                    file: null,
                }}
                validationSchema={Yup.object().shape({
                    file: Yup.mixed()
                        .required('Please upload a file in excel format')
                        .test('fileFormat', 'Please upload a file in excel format', value => {
                            if (!value) return false;
                            const file = value as File;
                            return [
                                'application/vnd.ms-excel',
                                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                            ].includes(file.type);
                        }),
                })}
                onSubmit={async values => {
                    await handleUpload(values);
                }}
            >
                {({ isSubmitting, setFieldValue, errors, handleSubmit }) => (
                    <Form form={form}>
                        <Flex vertical className="mt-5">
                            <Text>Upload Excel</Text>
                            <Upload
                                multiple={false}
                                name="file"
                                maxCount={1}
                                listType="picture"
                                className="avatar-uploader custom-upload mt-5"
                                showUploadList={false}
                                beforeUpload={beforeUpload}
                                customRequest={({ file, onSuccess }: any) => {
                                    if (file) {
                                        setFileName(file.name);
                                        setFieldValue('file', file);
                                        onSuccess('ok');
                                    }
                                }}
                            >
                                <Button
                                    className=" h-9"
                                    size="small"
                                    style={{ width: '472px' }}
                                    icon={<UploadOutlined />}
                                >
                                    Upload New
                                </Button>
                            </Upload>

                            {fileName && (
                                <Text className="uploaded-file-name mt-2 text-blue-400">
                                    {fileName}
                                </Text>
                            )}
                            {errors.file && (
                                <div className="error-message text-red-500 my-3">{errors.file}</div>
                            )}
                        </Flex>

                        {isUploading ? (
                            <Lottie options={defaultOptions} height={100} />
                        ) : (
                            <Flex gap={10} className="flex-col sm:flex-row sm:justify-between">
                                <Col className="mt-4">
                                    <Button
                                        key="submit"
                                        type="primary"
                                        htmlType="submit"
                                        danger
                                        loading={isUploading || isSubmitting}
                                        className=" mr-5 px-5"
                                        onClick={() => handleSubmit()}
                                    >
                                        Submit
                                    </Button>
                                    <Button onClick={handleCancel} className="px-5">
                                        Cancel
                                    </Button>
                                </Col>
                                {handleTemplateDownload && (
                                    <Button
                                        className="text-green-400 mt-3"
                                        type="link"
                                        icon={<DownloadOutlined />}
                                        loading={isTemplateFileLoading}
                                        onClick={handleTemplateDownload}
                                        style={{ color: 'rgb(74 222 128)' }}
                                    >
                                        Download Excel Template
                                    </Button>
                                )}
                            </Flex>
                        )}
                    </Form>
                )}
            </Formik>
        </Modal>
    );
};

export default BulkUploadModal;
