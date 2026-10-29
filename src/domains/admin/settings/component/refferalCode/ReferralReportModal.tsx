import React, { useEffect, useState } from 'react';

import { DownloadOutlined } from '@ant-design/icons';
import { Button, Col, Drawer, Flex, Form, Row, Typography } from 'antd';
import dayjs from 'dayjs';
import { Formik } from 'formik';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';

import referalReport from '../../schema/referralReport';

type ReferralReportModalProps = {
    isOpen: boolean;
    handleCancel: () => void;
    count: number;
    downloadReport: (values: { fromDate: string; toDate: string; referralCode: string }) => void;
    fetchReferralReports: (params: {
        fromDate: string;
        toDate: string;
        partnerId?: number;
        referralCode: string;
    }) => void;
    refPartnerId?: number | undefined;
    referralCode: string;
};

const ReferralReportModal = ({
    isOpen,
    handleCancel,
    count,
    downloadReport,
    fetchReferralReports,
    refPartnerId,
    referralCode,
}: ReferralReportModalProps) => {
    const [fromDate, setFromDate] = useState<string>('');
    const [toDate, setToDate] = useState<string>('');

    // Trigger the API call when the date range changes
    useEffect(() => {
        if (fromDate && toDate) {
            fetchReferralReports({ fromDate, toDate, partnerId: refPartnerId, referralCode });
        }
    }, [fromDate, toDate, fetchReferralReports, referralCode, refPartnerId]);

    return (
        <Formik
            initialValues={{
                fromDate: '',
                toDate: '',
            }}
            onSubmit={async values => {
                downloadReport({
                    fromDate: values.fromDate,
                    toDate: values.toDate,
                    referralCode,
                });
            }}
            validationSchema={referalReport}
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
                        open={isOpen}
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
                                <DatePickerInput
                                    name="fromDate"
                                    label="From Date"
                                    placeholder="Select from date"
                                    classes="rounded-sm w-full"
                                    handleChange={(value: string | string[]) => {
                                        if (value === '') {
                                            setFieldValue('fromDate', '');
                                            fetchReferralReports({
                                                fromDate: '',
                                                toDate,
                                                partnerId: refPartnerId,
                                                referralCode,
                                            });
                                        } else {
                                            const dateString = Array.isArray(value)
                                                ? value[0]
                                                : value; // Handle both string and string[]
                                            if (dateString) {
                                                setFieldValue('fromDate', dateString);
                                                if (dateString && toDate && dateString >= toDate) {
                                                    setFieldValue('toDate', '');
                                                    setToDate('');
                                                }
                                                setFromDate(dateString);
                                            }
                                        }
                                    }}
                                />
                                <DatePickerInput
                                    name="toDate"
                                    label="To Date"
                                    placeholder="Select to date"
                                    classes="rounded-sm w-full"
                                    handleChange={(value: string | string[]) => {
                                        if (value === '') {
                                            setToDate('');
                                            setFieldValue('toDate', '');
                                            fetchReferralReports({
                                                fromDate,
                                                toDate: '',
                                                partnerId: refPartnerId,
                                                referralCode,
                                            });
                                        } else {
                                            const dateString = Array.isArray(value)
                                                ? value[0]
                                                : value; // Handle both string and string[]
                                            if (dateString) {
                                                setToDate(dateString);
                                            }
                                        }
                                    }}
                                    minDate={dayjs(fromDate)}
                                />
                                <Row className="mt-2">
                                    <Col>
                                        <Typography.Text className="mr-0">
                                            Referral used by (users):
                                        </Typography.Text>
                                        <span className="ml-1">{count.toString()}</span>
                                    </Col>
                                </Row>
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

export default ReferralReportModal;
