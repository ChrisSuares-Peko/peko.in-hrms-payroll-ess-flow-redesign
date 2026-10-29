import { useState } from 'react';

import { DownloadOutlined } from '@ant-design/icons';
import { Button, Col, Drawer, Flex, Form, Row, Skeleton, Typography } from 'antd';
import dayjs from 'dayjs';
import { Formik } from 'formik';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import usePartnersForCorporate from '@src/domains/admin/users/hooks/usePartnersForCorporate';

import UseUpdateReferalCodes from '../../hooks/UseUpdateReferalCodes';
import referalDownload from '../../schema/referralDownload';
import { DownloadReferral, refresh } from '../../types/refferalCode';

type DepartmentModalProps = {
    open: boolean;
    handleCancel: () => void;
    data?: DownloadReferral;
    fetchGeneralReferralReports: ({
        fromDate,
        toDate,
        PartnerId,
    }: {
        fromDate: string;
        toDate: string;
        PartnerId?: number | undefined;
    }) => Promise<void>;
};

const RefferralDownloadModal = ({
    open,
    handleCancel,
    data,
    setRefresh,
    fetchGeneralReferralReports,
}: DepartmentModalProps & refresh) => {
    const { isLoading } = UseUpdateReferalCodes({
        handleCancel,
        setRefresh,
    });

    const { partnerData } = usePartnersForCorporate('');
    const [fromDate, setFromDate] = useState<string>('');
    const [toDate, setToDate] = useState<string>('');

    return (
        <Formik
            initialValues={{
                id: data?.id || '',
                referralCode: data?.referralCode || '',
                partnerId: data?.partnerId,
                fromDate: data?.fromDate || '',
                toDate: data?.toDate || '',
            }}
            isLoading={isLoading}
            onSubmit={async values =>
                fetchGeneralReferralReports({
                    fromDate: values.fromDate,
                    toDate: values.toDate,
                    PartnerId: values.partnerId,
                })
            }
            validationSchema={referalDownload}
        >
            {formikBag => {
                const { setFieldValue } = formikBag;
                const onClickSubmit = (e: React.MouseEvent<HTMLElement>) => {
                    e.preventDefault();
                    formikBag.handleSubmit();
                };
                return (
                    <Drawer
                        title="Referral Report"
                        open={open}
                        onClose={() => {
                            handleCancel();
                        }}
                        closeIcon={null}
                        // destroyOnClose
                        width={470}
                        styles={{
                            body: { paddingInline: 20, paddingBlock: 16 },
                            header: { paddingInline: 20 },
                        }}
                        zIndex={20}
                        footer={
                            <Flex justify="end">
                                <Button
                                    key="back"
                                    onClick={() => {
                                        handleCancel();
                                    }}
                                    className="px-5"
                                >
                                    Cancel
                                </Button>
                            </Flex>
                        }
                    >
                        <Flex vertical className="w-full ">
                            <Form layout="vertical">
                                {partnerData ? (
                                    <SelectInput
                                        name="partnerId"
                                        options={partnerData.map(option => ({
                                            ...option,
                                            value:
                                                option.value === ''
                                                    ? null
                                                    : option.value.toString(),
                                        }))}
                                        placeholder="Please select a partner"
                                        label="Select Partner"
                                        isRequired
                                        allowClear
                                    />
                                ) : (
                                    <Skeleton.Input active block />
                                )}
                                <DatePickerInput
                                    name="fromDate"
                                    label="From Date"
                                    placeholder="Select from date"
                                    classes="rounded-sm w-full"
                                    handleChange={(value: string | string[]) => {
                                        const dateString = Array.isArray(value) ? value[0] : value;

                                        if (dateString) {
                                            setFieldValue('fromDate', dateString);

                                            if (dateString && toDate && dateString >= toDate) {
                                                setFieldValue('toDate', '');
                                                setToDate('');
                                            }
                                            setFromDate(dateString);
                                        }
                                    }}
                                />
                                <DatePickerInput
                                    name="toDate"
                                    label="To Date"
                                    placeholder="Select to date"
                                    classes="rounded-sm w-full"
                                    handleChange={(value: string | string[]) => {
                                        const dateString = Array.isArray(value) ? value[0] : value; // Handle both string and string[]
                                        if (dateString) {
                                            setToDate(dateString);
                                        }
                                    }}
                                    minDate={dayjs(fromDate)}
                                />
                                <Row align="middle" justify="start" className="mt-4">
                                    <Col>
                                        <Typography.Text className="mr-2">
                                            Download Report
                                        </Typography.Text>{' '}
                                        {/* Adding a label */}
                                    </Col>
                                    <Col>
                                        <Button
                                            icon={
                                                <DownloadOutlined className="text-iconRed text-lg" />
                                            }
                                            danger
                                            type="default"
                                            className="font-medium flex align-middle justify-between"
                                            download
                                            onClick={onClickSubmit}
                                        >
                                            Download
                                        </Button>
                                    </Col>
                                </Row>
                            </Form>
                        </Flex>
                    </Drawer>
                );
            }}
        </Formik>
    );
};

export default RefferralDownloadModal;
