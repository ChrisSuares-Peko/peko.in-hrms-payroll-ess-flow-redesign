import React, { useState } from 'react';

import { Button, Col, Drawer, Flex, Form, Row, Select, Space } from 'antd';
import { Typography } from 'antd/lib';
import { ErrorMessage, Formik } from 'formik';
import { Link } from 'react-router-dom';

import TextAreaInput from '@components/atomic/inputs/TextAreaInput';
// import TaxFileUploadInput from '@src/domains/dashboard/TaxAndMore/components/taxRegistration/forms/TaxFileUpload';

import useUpdateCorporateTax from '../../hooks/useUpdateCorporateTax';
import taxSchema from '../../schema/CorporateTaxSchema';
import { Records } from '../../types/corporateTaxTypes';

interface modalProps {
    open: boolean;
    handleCancel: () => void;
    data?: Records;
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
}
const CorporateTaxModal = ({ open, handleCancel, data, setRefresh }: modalProps) => {
    const [status, setStatus] = useState(data?.status);
    const { isLoading, statusUpdate } = useUpdateCorporateTax();
    const handleChange = (value: string) => {
        setStatus(value);
    };
    return (
        <Drawer
            title="Corporate Tax Registration Details"
            width={550}
            onClose={handleCancel}
            open={open}
        >
            <Flex vertical>
                <Typography.Text className="text-base font-bold mt-2">
                    Company Information:
                </Typography.Text>
                <Flex justify="space-between" className="mt-5">
                    <Typography.Text className="text-base">Company Name</Typography.Text>
                    <Typography.Text className="text-base">{data?.companyName}</Typography.Text>
                </Flex>

                {data?.tradeLicenseDoc.map((item, index) => (
                    <Flex justify="space-between" className="mt-5" key={index}>
                        <Typography.Text className="text-base">
                            Copy of Trade License {index + 1}
                        </Typography.Text>

                        <Link
                            to={Object.values(item)[0]}
                            style={{ color: '#FF3A3A' }}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            View
                        </Link>
                    </Flex>
                ))}

                <Flex justify="space-between" className="mt-5">
                    <Typography.Text className="text-base">
                        Memorandum of Association or Articles of Association
                    </Typography.Text>
                    {data?.corporateGovernanceDoc && (
                        <Link
                            to={data.emiratesIDDoc}
                            style={{ color: '#FF3A3A' }}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            View
                        </Link>
                    )}
                </Flex>
                <Flex justify="space-between" className="mt-5">
                    <Typography.Text className="text-base">
                        Copy of Emirates ID (Owner)
                    </Typography.Text>
                    {data?.emiratesIDDoc && (
                        <Link
                            to={data.emiratesIDDoc}
                            style={{ color: '#FF3A3A' }}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            View
                        </Link>
                    )}
                </Flex>
                <Flex justify="space-between" className="mt-5">
                    <Typography.Text className="text-base">
                        Copy of Passport (Owner)
                    </Typography.Text>
                    {data?.passportDoc && (
                        <Link
                            to={data.passportDoc}
                            style={{ color: '#FF3A3A' }}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            View
                        </Link>
                    )}
                </Flex>
                <Flex justify="space-between" className="mt-5">
                    <Typography.Text className="text-base">Corporate Tax Period</Typography.Text>
                    <Typography.Text className="text-base">{data?.taxPeriod}</Typography.Text>
                </Flex>
                <Typography.Text className="text-base font-bold mt-5">
                    Contact Information:
                </Typography.Text>
                <Flex justify="space-between" className="mt-5">
                    <Typography.Text className="text-base">
                        Authorized Contact Person
                    </Typography.Text>
                    <Typography.Text className="text-base">{data?.contactPerson}</Typography.Text>
                </Flex>
                <Flex justify="space-between" className="mt-5">
                    <Typography.Text className="text-base">Mobile Number</Typography.Text>
                    <Typography.Text className="text-base">{data?.phoneNumber}</Typography.Text>
                </Flex>
                <Flex justify="space-between" className="mt-5">
                    <Typography.Text className="text-base">Email ID</Typography.Text>
                    <Typography.Text className="text-base">{data?.email}</Typography.Text>
                </Flex>
                {(data?.status === 'RE UPLOAD' || data?.status === 'PENDING') && (
                    <Flex justify="space-between" className="mt-5">
                        <Typography.Text className="text-base">Status</Typography.Text>
                        <Select
                            className="w-32"
                            defaultValue={status}
                            style={{ width: 120 }}
                            onChange={handleChange}
                            options={
                                data.status === 'RE UPLOAD'
                                    ? [{ value: 'RE UPLOAD', label: 'RE UPLOAD' }]
                                    : [
                                          { value: 'PENDING', label: 'PENDING' },
                                          { value: 'RE UPLOAD', label: 'RE UPLOAD' },
                                          { value: 'COMPLETED', label: 'COMPLETED' },
                                      ]
                            }
                        />
                    </Flex>
                )}

                {status === 'RE UPLOAD' || status === 'COMPLETED' ? (
                    <Formik
                        initialValues={{ remarks: data?.remarks || '', corporateTax: '' }}
                        onSubmit={async values => {
                            const resp = statusUpdate(
                                status,
                                data?.id,
                                values.remarks,
                                values.corporateTax
                            );
                            if (await resp) {
                                setRefresh(true);
                                handleCancel();
                            }
                        }}
                        validationSchema={taxSchema(status)}
                    >
                        {({ handleSubmit }) => (
                            <Form onFinish={handleSubmit} layout="vertical">
                                {status === 'RE UPLOAD' && (
                                    <Row className="mt-6" gutter={[20, 20]}>
                                        <Col xs={24} md={24}>
                                            <TextAreaInput
                                                name="remarks"
                                                label="Remarks"
                                                placeholder="Enter remarks"
                                            />
                                        </Col>
                                    </Row>
                                )}
                                {status === 'COMPLETED' && data?.status !== 'COMPLETED' && (
                                    <>
                                        {/* Render form fields for 'completed' status here */}
                                        {/* <TaxFileUploadInput
                                            // existingFileUrl={taxData?.corporateGovernanceDoc}
                                            label="Corporate Tax Certificate"
                                            name="corporateTax.base64"
                                            setFile={setFile}
                                            format="corporateTax.format"
                                            showNotification
                                            showFileName
                                            isrequired
                                            classes=""
                                        /> */}
                                        <ErrorMessage
                                            name="corporateTax"
                                            render={msg => (
                                                <div
                                                    className="error-message -mt-5"
                                                    style={{ color: '#FF3A3A' }}
                                                >
                                                    {msg}
                                                </div>
                                            )}
                                        />
                                    </>
                                )}

                                <Flex justify="end" style={{ padding: '20px 0' }}>
                                    <Space>
                                        <Button onClick={handleCancel}>Cancel</Button>
                                        <Button
                                            type="primary"
                                            danger
                                            htmlType="submit"
                                            loading={isLoading}
                                        >
                                            Submit
                                        </Button>
                                    </Space>
                                </Flex>
                            </Form>
                        )}
                    </Formik>
                ) : null}

                {status !== 'RE UPLOAD' &&
                    data?.status !== 'COMPLETED' &&
                    status !== 'COMPLETED' && (
                        <Flex justify="end" style={{ padding: '20px 0' }}>
                            <Space>
                                <Button onClick={handleCancel}>Cancel</Button>
                                <Button
                                    disabled
                                    type="primary"
                                    danger
                                    // onClick={() => handleUpdate(status, data?.id)}
                                    loading={isLoading}
                                >
                                    Submit
                                </Button>
                            </Space>
                        </Flex>
                    )}
            </Flex>
        </Drawer>
    );
};

export default CorporateTaxModal;
