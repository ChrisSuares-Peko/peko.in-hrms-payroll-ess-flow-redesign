import React, { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Row, Typography, Button, Flex, Upload, Col, UploadProps, Input } from 'antd';
import { Formik, Form } from 'formik';

import GenericTable from '@components/atomic/GenericTable';
import SelectInput from '@components/atomic/inputs/SelectInput';
import useGetAllForm24qs from '@src/domains/dashboard/Payroll/hooks/reports/useGetAllForm24qs';
import GetExcelTemplate from '@src/domains/dashboard/Payroll/hooks/reports/useGetForm24Template';
import GetForm24Api from '@src/domains/dashboard/Payroll/hooks/reports/useUploadForm24Api';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';
import { yearsData } from '@utils/yearData';

import StepsSidebar from './StepsSidebar';
import UploadFormSection from './UploadFormSection';
import { validationSchema } from '../../schema/reportandForms/form24Schema';
import { form24Columns, steps, quarterOptions } from '../../utils/form24/data';




const Form24QTab: React.FC = () => {
    const { uploadFile, isLoading: uploadLoading } = GetForm24Api();
    // GetExcelTemplate hook to download the Excel template
    const { getExcelTemplate, isLoading: excelLoading } = GetExcelTemplate();

    const dispatch = useAppDispatch();

    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState<{ search: string, year: string }>({ search: '', year: '' });

    // Pass both year and search text to hook — backend handles all filtering
    const { isLoading: getForm24Loading, form24List } = useGetAllForm24qs(
        search.year || undefined,
        search.search || undefined
    );


    const getBase64 = (file: File): Promise<string | null> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });

    const handleFileValidation = async (file: File) => {
        const isExcel =
            file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.type === 'application/vnd.ms-excel';
        if (!isExcel) {
            dispatch(
                showToast({
                    description: 'You can only upload Excel files (.xls, .xlsx).',
                    variant: 'warning',
                })
            );
            return false;
        }
        const isLt20M = file.size / 1024 / 1024 <= 20;
        if (!isLt20M) {
            dispatch(
                showToast({
                    description: 'File must be smaller than 20 MB.',
                    variant: 'warning',
                })
            );
            return false;
        }
        return true;
    };

    const handleSubmit = async (values: any) => {
        await uploadFile(values.file.file, values.quarter);
    };

    return (
        <>
            <Flex gap={30} align="center" className="mb-4">
                <Typography.Title level={5} className="m-0">
                    Download Form 24Q
                </Typography.Title>
                <Button loading={excelLoading} onClick={getExcelTemplate} danger>
                    Download Excel File
                </Button>
            </Flex>

            <Formik
                initialValues={{ quarter: '', file: null }}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
            >
                {({ setFieldValue, values, errors }) => {
                    const uploadProps: UploadProps = {
                        name: 'file',
                        multiple: false,
                        maxCount: 1,
                        showUploadList: false,
                        accept: '.xls,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
                        beforeUpload: async file => {
                            if (!values.quarter) {
                                dispatch(
                                    showToast({
                                        description:
                                            'Please select the Quarter before uploading the file.',
                                        variant: 'warning',
                                    })
                                );
                                return Upload.LIST_IGNORE;
                            }

                            setLoading(true);
                            const isValid = await handleFileValidation(file);
                            if (isValid) {
                                const base64 = await getBase64(file);
                                setFieldValue('file', {
                                    file,
                                    base64,
                                    name: file.name,
                                });
                                dispatch(
                                    showToast({
                                        description: 'File uploaded successfully',
                                        variant: 'success',
                                    })
                                );
                            }
                            setLoading(false);
                            return Upload.LIST_IGNORE;
                        },
                        onDrop: async e => {
                            const { files } = e.dataTransfer;
                            if (files.length > 0) {
                                const file = files[0];
                                const isValid = await handleFileValidation(file);
                                if (isValid) {
                                    const base64 = await getBase64(file);
                                    setFieldValue('file', {
                                        file,
                                        base64,
                                        name: file.name,
                                    });
                                }
                            }
                        },
                    };

                    return (
                        <Form>
                            <Row gutter={[24, 24]}>
                                <Col xs={24} md={18}>
                                    <SelectInput
                                        name="quarter"
                                        options={quarterOptions}
                                        placeholder="Select Quarter"
                                        label="Quarter"
                                        isRequired
                                    />

                                    <UploadFormSection
                                        uploadProps={uploadProps}
                                        loading={loading}
                                        uploadedFileName={values.file ? 'form24' : null}
                                        error={errors.file as string}
                                    />

                                    <Button
                                        className="mt-4"
                                        htmlType="submit"
                                        loading={uploadLoading}
                                        type="primary"
                                       
                                    >
                                        Submit
                                    </Button>
                                </Col>

                                <Col xs={24} md={6}>
                                    <StepsSidebar steps={steps} />
                                </Col>
                                <Col xs={24}>
                                    <Row gutter={[16, 16]}>
                                        <Col xs={24} md={21}>
                                            <Input
                                                placeholder="Search"
                                                prefix={<SearchOutlined />}
                                                value={search.search}
                                                allowClear
                                                // onChange={handleSearch}
                                                onChange={(e) => setSearch({ ...search, search: e.target.value })}
                                            />
                                        </Col>
                                        <Col xs={24} md={3}>
                                            <SelectInput
                                                name="year"
                                                options={yearsData}
                                                placeholder="Select Year"
                                                allowClear
                                                handleChange={(e) => setSearch({ ...search, year: e })}
                                            />
                                        </Col>
                                    </Row>
                                    <GenericTable
                                        rowKey={record => record.key}
                                        bordered={false}
                                        columns={form24Columns}
                                        dataSource={form24List}
                                        loading={getForm24Loading}
                                        pagination={false}
                                        className="w-full mt-8"
                                    />
                                </Col>
                            </Row>
                        </Form>
                    );
                }}
            </Formik>
        </>
    );
};

export default Form24QTab;
