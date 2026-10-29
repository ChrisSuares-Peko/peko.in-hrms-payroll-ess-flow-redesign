import React from 'react';

import { Button, Flex, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useFormikContext } from 'formik';

import { formatNumberWithoutCommas } from '@utils/priceFormat';

const { Text } = Typography;

interface PlanCardType {
    validity: string;
    amount: number;
    description: string;
    handleClose: () => void;
}
const extractDataUsage = (description: string): string | null => {
    const match = description.match(/(\d+(\.\d+)?\s?(GB|MB)(\/day)?)/i);
    return match ? match[0] : null;
};

const formatDescription = (description: string): string =>
    description.replace(
        /(\d+(?:\.\d+)?)\s*rs\b/gi,
        (match, amount) => `₹ ${formatNumberWithoutCommas(parseFloat(amount), 2, 2)}`
    );

const PlanCard = ({ amount, validity, description, handleClose }: PlanCardType) => {
    const formik = useFormikContext();
    const dataUsage = extractDataUsage(description);
    const hasValidity = validity && validity.trim().toUpperCase() !== 'NA';

    const handleButtonClick = () => {
        formik.setFieldValue('amount', amount);
        handleClose();
    };

    const hasInfo = hasValidity || dataUsage;

    return (
        <Content
            className={`px-3 rounded-md bg-[#F9F9F9] mb-2 ${hasInfo ? 'py-5 gap-10' : 'py-3'}`}
        >
            {hasInfo && (
                <Flex justify="space-between" className="mb-2">
                    {hasValidity && (
                        <Flex vertical>
                            <Text className="font-semibold text-base">Validity</Text>
                            <Text className="text-textLightGray">{validity}</Text>
                        </Flex>
                    )}
                    {dataUsage && (
                        <Flex vertical className="text-center">
                            <Text className="font-semibold text-base">Data</Text>
                            <Text className="text-base">{dataUsage}</Text>
                        </Flex>
                    )}
                    <Button
                        danger
                        className="h-full !rounded-lg text-xs font-medium sm:text-sm sm:px-5"
                        onClick={handleButtonClick}
                    >
                        ₹ {amount}
                    </Button>
                </Flex>
            )}
            <Flex vertical gap={4}>
                <Flex justify="space-between" align="center">
                    <Text className="font-semibold text-base">Description</Text>
                    {!hasInfo && (
                        <Button
                            size="small"
                            danger
                            className="shrink-0 !rounded-lg text-xs font-medium sm:text-sm sm:px-3"
                            onClick={handleButtonClick}
                        >
                            ₹ {amount}
                        </Button>
                    )}
                </Flex>
                <Text className="font-normal text-base">{formatDescription(description)}</Text>
            </Flex>
        </Content>
    );
};

export default React.memo(PlanCard);
