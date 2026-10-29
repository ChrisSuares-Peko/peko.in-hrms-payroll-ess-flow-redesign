import React from 'react';

import { Col, Form, Row, Typography, Button, Flex, Input, DatePicker } from 'antd';
import dayjs from 'dayjs';
import { useFormikContext } from 'formik';

import FileUploadInput from '@components/atomic/inputs/FileUploadInput';

const { Text } = Typography;

type Props = {
    onChange?: (data: any) => void;
    fieldName?: string;
};

interface SummaryAndActionsSectionProps {
    onSubmit?: () => void;
    onCancel?: () => void;
}

const FormBVerification: React.FC<SummaryAndActionsSectionProps & Props> = ({
    onSubmit,
    onCancel,
    onChange,
    fieldName = 'verification',
}: any) => {
    const { setFieldValue,values } = useFormikContext<any>();
    const [form] = Form.useForm();

    const v = values?.[fieldName] ?? {};

    const handleChange = (value: string, field: string) => {
        const updatedData = { ...v, [field]: value };
        setFieldValue(fieldName, updatedData);
        onChange?.(updatedData);
    };

    const blockNonAlpha = (e: React.KeyboardEvent) => {
        if (e.key.length === 1 && !/[a-zA-Z ]/.test(e.key)) e.preventDefault();
    };

    // const blockNonNumeric = (e: React.KeyboardEvent) => {
    //     if (e.key.length === 1 && !/[0-9]/.test(e.key)) e.preventDefault();
    // };

    const handleFinish = () => {};

    return (
        <Flex vertical className="mt-6">
            <Typography.Title level={5}>Verification</Typography.Title>
            <Typography.Text type="secondary" className="block mb-3">
                (Please complete the details below)
            </Typography.Text>

            <Form layout="vertical" form={form} onFinish={handleFinish} className="w-full">
                {/* Inline sentence with inputs */}
                <Form.Item shouldUpdate noStyle>
                    {() => (
                        <Text className="block leading-8">
                            I,&nbsp;
                            <Input
                                className="m-2 w-full sm:w-64 md:w-72"
                                placeholder="Enter name"
                                value={v.declarantName ?? ''}
                                onKeyDown={blockNonAlpha}
                                onChange={e => handleChange(e.target.value, 'declarantName')}
                            />
                            &nbsp;son/daughter of
                            <Input
                                className="m-2 w-full sm:w-64 md:w-72"
                                placeholder="Enter parent name"
                                value={v.fatherOrSpouseName ?? ''}
                                onKeyDown={blockNonAlpha}
                                onChange={e => handleChange(e.target.value, 'fatherOrSpouseName')}
                            />
                            &nbsp;working in the capacity of
                            <Input
                                className="m-2 w-full sm:w-56 md:w-64"
                                placeholder="Enter designation"
                                value={v.capacity ?? ''}
                                onKeyDown={blockNonAlpha}
                                onChange={e => handleChange(e.target.value, 'capacity')}
                            />
                            &nbsp;do hereby certify that a sum of Rs.&nbsp;
                            <Input
                                className="m-2 w-full sm:w-56 md:w-64"
                                placeholder="Enter amount in words"
                                value={v.amountInDeducted ?? ''}
                                onKeyDown={blockNonAlpha}
                                onChange={e => handleChange(e.target.value.replace(/[^a-zA-Z ]/g, ''), 'amountInDeducted')}
                            />
                            &nbsp;amount (in words) has been deducted and a sum of Rs.&nbsp;
                            <Input
                                className="m-2 w-full sm:w-64 md:w-72"
                                placeholder="Enter amount in words"
                                value={v.amountInDeposited ?? ''}
                                onKeyDown={blockNonAlpha}
                                onChange={e => handleChange(e.target.value.replace(/[^a-zA-Z ]/g, ''), 'amountInDeposited')}
                            />
                            &nbsp;amount (in words) has been deposited to the credit of the Central
                            Government. I further certify that the information given above is true,
                            complete and correct and is based on the books of account, documents,
                            TDS statements, TDS deposited and other available records.
                        </Text>
                    )}
                </Form.Item>

                {/* Other details */}
                {/* Row 1: Date + Full Name */}
                {/* Row 1: Date + Full Name */}
                <Row className="mt-5" gutter={[16, 16]}>
                    <Col xs={24} md={8}>
                        <Form.Item label="Date">
                            <DatePicker
                                style={{ width: '100%' }}
                                value={v.date ? dayjs(v.date, 'YYYY-MM-DD') : null}
                                format="DD/MM/YYYY"
                                onChange={date =>
                                    handleChange(date ? date.format('YYYY-MM-DD') : '', 'date')
                                }
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={{ span: 8, offset: 8 }}>
                        <Form.Item label="Full Name">
                            <Input
                                placeholder="Enter full name"
                                value={v.fullName ?? ''}
                                onKeyDown={blockNonAlpha}
                                onChange={e => handleChange(e.target.value, 'fullName')}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                {/* Row 2: Place + Signature */}
                <Row gutter={[16, 16]}>
                    <Col xs={24} md={8}>
                        <Form.Item label="Place">
                            <Input
                                placeholder="Enter place"
                                value={v.place ?? ''}
                                onChange={e => handleChange(e.target.value, 'place')}
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={{ span: 8, offset: 8 }}>
                        <Form.Item label="(Signature of person responsible for deduction of tax)">
                            <FileUploadInput
                                name="signatureUrl"
                                format="signatureFormat"
                                showFileName
                                allowedFileTypes={['image/jpeg', 'image/png']}
                                maxFileSize={300}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                {/* Row 3: Designation */}
                <Row gutter={[16, 16]}>
                    <Col xs={24} md={8}>
                        <Form.Item label="Designation">
                            <Input
                                placeholder="Enter designation"
                                value={v.designation ?? ''}
                                onKeyDown={blockNonAlpha}
                                onChange={e => handleChange(e.target.value, 'designation')}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={[12, 12]} justify="start">
                    <Col xs={24} sm={12} md={6} lg={4}>
                        <Button type="primary" danger onClick={onSubmit} className="w-full">
                            Submit
                        </Button>
                    </Col>
                    <Col xs={24} sm={12} md={6} lg={4}>
                        <Button type="default" onClick={onCancel} className="w-full">
                            Cancel
                        </Button>
                    </Col>
                </Row>
            </Form>
        </Flex>
    );
};

export default FormBVerification;
