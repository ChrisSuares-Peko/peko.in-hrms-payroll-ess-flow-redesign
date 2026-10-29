import React from 'react';

import { Col, Flex, Image, Row, Typography } from 'antd';
import dayjs from 'dayjs';
import { capitalize } from 'lodash';

import StatusBadge from './StatusBadge';
import TextCard from './TextCard';
import { formatMoney } from '../utils/pricingCalc';

interface PlanDetailsProps {
    planIcon?: string;
    PlanName: string;
    Amount?: number;
    AmountPaid: number;
    Date: string | Date;
    paymentStatus: string;
    applicationStatus: string;
    // Native pricing currency (INR, USD, …). INR only after the payment step.
    currency?: string;
}
const PlanDetails = ({
    planIcon,
    PlanName,
    Amount,
    AmountPaid,
    Date,
    paymentStatus,
    applicationStatus,
    currency = 'INR',
}: PlanDetailsProps) => (
    <Flex
        className="flex-col h-full p-8 px-5 sm:px-10 mt-10 border border-gray-200 border-solid w-full md:flex-row rounded-2xl shadow-md"
        justify="space-between"
        align="center"
    >
        <Flex align="center" className="flex flex-col md:flex-row flex-1 items-start gap-8">
            {planIcon && (
                <Image
                    src={planIcon}
                    alt="Plan Icon"
                    preview={false}
                    className="max-w-[120px] max-h-[80px] object-contain"
                />
            )}
            <Row gutter={[10, 20]} className="w-full">
                <Row>
                    <Typography.Text className="text-xl font-semibold">{PlanName} </Typography.Text>
                </Row>
                <Row className="w-full" gutter={[0, 10]}>
                    <TextCard
                        label="Submission Date"
                        value={(() => {
                            const d = dayjs(Date);
                            return d.isValid() ? d.format('YYYY-MM-DD') : 'N/A';
                        })()}
                    />
                    <TextCard
                        label={
                            applicationStatus === 'saved' || applicationStatus === 'draft'
                                ? 'Due Amount'
                                : 'Amount Paid'
                        }
                        value={formatMoney(AmountPaid, currency)}
                    />
                    <TextCard label="Payment Status" value={capitalize(paymentStatus)} />
                    <Col xs={24} sm={12} md={7} lg={6}>
                        <Flex vertical gap={3}>
                            <Typography.Text className="font-medium">
                                <StatusBadge status={applicationStatus} />
                            </Typography.Text>
                            <Typography.Text className="text-gray-400">
                                Application Status
                            </Typography.Text>
                        </Flex>
                    </Col>
                    {/* <TextCard
                        label="Application Status"
                        value={<StatusBadge status={applicationStatus} />}
                    /> */}
                </Row>
            </Row>
        </Flex>
    </Flex>
);

export default PlanDetails;
