import React from 'react';

import { Flex, Row, Typography } from 'antd';
import dayjs from 'dayjs';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import VerificationTextCard from './VerificationTextCard';

type AddonHistoryRecord = {
    quantity: number;
    unitPrice: number;
    amountCharged: number;
    purchaseDate: string;
    expiresAt: string;
    status: string;
};

type Props = {
    record: AddonHistoryRecord;
};

const VerificationAddonHistoryCard = ({ record }: Props) => (
    <Flex
        className="flex-col h-full p-8 px-5 sm:px-10 mt-5 border border-gray-200 border-solid w-full md:flex-row rounded-2xl xs:bg-bgLightGray md:bg-white"
        justify="space-between"
        align="center"
    >
        <Flex className="flex flex-1">
            <Row gutter={[10, 20]} className="w-full">
                <Row>
                    <Typography.Text className="text-xl font-medium">
                        Verification Suite Add-on
                    </Typography.Text>
                </Row>
                <Row className="w-full" gutter={[0, 10]}>
                    <VerificationTextCard
                        label="Total Amount"
                        value={`₹ ${formatNumberWithLocalString(record.amountCharged)}`}
                    />
                    <VerificationTextCard
                        label="Total Verifications"
                        value={String(record.quantity)}
                    />
                    <VerificationTextCard
                        label="Status"
                        value={record.status}
                        valueColor="#05BE63"
                    />
                    <VerificationTextCard
                        label="Purchased On"
                        value={dayjs(record.purchaseDate).format('DD/MM/YYYY')}
                    />
                    <VerificationTextCard
                        label="Valid Until"
                        value={dayjs(record.expiresAt).format('DD/MM/YYYY')}
                    />
                </Row>
            </Row>
        </Flex>
    </Flex>
);

export default VerificationAddonHistoryCard;
