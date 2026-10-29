import React, { useState } from 'react';

import { Button, Col, Drawer, Flex, Form, Row, Select, Space } from 'antd';
import { Typography } from 'antd/lib';
import dayjs from 'dayjs';
import { Formik } from 'formik';
import { Link } from 'react-router-dom';

import TextAreaInput from '@components/atomic/inputs/TextAreaInput';

import KeyValueDisplay from './KeyValueDisplay';
import ShareholderInfo from './ShareHolderInfo';
import { StatusEnum } from './utils/statusEnum';
import useUpdateStatusApi from '../../hooks/vendorPayout/useUpdateStatusApi';
import vendorSchema from '../../schema/VendorSchema';
import { CorporateRecord } from '../../types/vendorPayout';

interface modalProps {
    open: boolean;
    handleCancel: () => void;
    data?: CorporateRecord;
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
    mode: string;
}
const VendorModal = ({ open, handleCancel, data, setRefresh, mode }: modalProps) => {
    const today = dayjs();
    const todayFormatted = today.format('YYYY-MM-DD');
    const oneMonthAgoFormatted = today.subtract(1, 'month').format('YYYY-MM-DD');
    const [status, setStatus] = useState(data?.status);
    const { isLoading, statusUpdate } = useUpdateStatusApi({
        searchText: '',
        page: 1,
        pageSize: 10,
        itemsPerPage: 10,
        sort: 'DESC',
        sortField: '',
        from: oneMonthAgoFormatted,
        to: todayFormatted,
    });

    const handleChange = (value: string) => {
        setStatus(value);
    };
    const modalHeading = mode === 'add' ? 'Add Vendor Details' : 'Edit Vendor Details';
    return (
        <Drawer title={modalHeading} width={550} onClose={handleCancel} open={open}>
            <Flex vertical>
                <Typography.Text className="mt-2 text-base font-bold">
                    Company Information:
                </Typography.Text>
                <KeyValueDisplay label="Company Name" value={data?.companyName || '-'} />
                <KeyValueDisplay label="TL Number" value={data?.TLNumber || '-'} />
                <KeyValueDisplay
                    label="TL Issuing Authority"
                    value={data?.TLIssuingAuthority || '-'}
                />
                <KeyValueDisplay label="VAT TRN" value={data?.VATTRN || '-'} />

                <Flex justify="space-between" className="mt-5">
                    <Typography.Text className="text-base">Trade License</Typography.Text>
                    {data?.tradeLicense ? (
                        <Link
                            to={data?.tradeLicense}
                            style={{ color: '#FF3A3A' }}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            View
                        </Link>
                    ) : (
                        <Typography.Text>-</Typography.Text>
                    )}
                </Flex>

                <KeyValueDisplay
                    label="Website"
                    value={
                        <Link
                            to={data?.offWebsite || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {data?.offWebsite || '-'}
                        </Link>
                    }
                />
                <KeyValueDisplay label="Email" value={data?.offEmail || '-'} />
                <Typography.Text className="mt-5 text-base font-bold">
                    Contact Information:
                </Typography.Text>

                <KeyValueDisplay
                    label="Contact Person Name"
                    value={data?.contactPersonName || '-'}
                />
                <KeyValueDisplay label="Phone Number" value={data?.phoneNumber || '-'} />
                {data?.shareholders.map((shareholder, index) => (
                    <ShareholderInfo key={index} shareholder={shareholder} />
                ))}

                <Typography.Text className="mt-5 text-base font-bold">
                    Legal Information:
                </Typography.Text>
                <KeyValueDisplay label="Legal Status" value={data?.legalStatus || '-'} />
                <KeyValueDisplay label="Nature of Business" value={data?.natureOfBusiness || '-'} />
                <KeyValueDisplay
                    label="Country of Incorporation"
                    value={data?.countryOfIncorporation || '-'}
                />

                <Typography.Text className="mt-5 text-base font-bold">
                    Authorized Person:
                </Typography.Text>

                <KeyValueDisplay
                    label="Authorized Person Name"
                    value={data?.authorizedPersonName || '-'}
                />
                <KeyValueDisplay
                    label="Authorized Person Nationality"
                    value={data?.authorizedPersonNationality || '-'}
                />

                {(data?.status === StatusEnum.RE_UPLOAD || StatusEnum.PENDING) && (
                    <Flex justify="space-between" className="mt-5">
                        <Typography.Text className="text-base">Status</Typography.Text>
                        <Select
                            className="w-32"
                            defaultValue={status}
                            style={{ width: 120 }}
                            onChange={handleChange}
                            options={[
                                { value: StatusEnum.PENDING, label: StatusEnum.PENDING },
                                { value: StatusEnum.RE_UPLOAD, label: StatusEnum.RE_UPLOAD },
                                { value: StatusEnum.COMPLETED, label: StatusEnum.COMPLETED },
                            ]}
                        />
                    </Flex>
                )}

                {status === StatusEnum.RE_UPLOAD || status === StatusEnum.COMPLETED ? (
                    <Formik
                        initialValues={{ remarks: data?.remarks || '' }}
                        onSubmit={async values => {
                            const resp = statusUpdate(status, data?.id, values.remarks);
                            if (await resp) {
                                setRefresh(true);
                                handleCancel();
                            }
                        }}
                        validationSchema={vendorSchema(status)}
                    >
                        {({ handleSubmit }) => (
                            <Form onFinish={handleSubmit} layout="vertical">
                                {status === StatusEnum.RE_UPLOAD && (
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
                ) : (
                    ''
                )}

                {status !== StatusEnum.RE_UPLOAD &&
                    data?.status !== StatusEnum.COMPLETED &&
                    status !== StatusEnum.COMPLETED && (
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

export default VendorModal;
