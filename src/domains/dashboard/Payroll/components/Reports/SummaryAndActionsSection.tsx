import React from 'react';

import { Flex, Typography, Button } from 'antd';

interface SummaryAndActionsSectionProps {
    totalDeductionClaimed: string; // e.g., '₹400,000'
    remainingTaxableIncome: string; // e.g., '₹400,000'
    onSubmit?: () => void;
    onCancel?: () => void;
    loading: boolean;
}

const SummaryAndActionsSection: React.FC<SummaryAndActionsSectionProps> = ({
    totalDeductionClaimed,
    remainingTaxableIncome,
    onSubmit,
    onCancel,
    loading,
}) => (
    <>
        <Flex gap={15} vertical className="xs:p-3 md:p-6 mt-4 bg-[#F8F8F8]">
            <Flex justify="space-between">
                <Typography.Text>Total Deduction Claimed</Typography.Text>
                <Typography.Text className="font-medium">{totalDeductionClaimed}</Typography.Text>
            </Flex>
            <Flex justify="space-between">
                <Typography.Text>Remaining Taxable Income</Typography.Text>
                <Typography.Text className="font-medium">{remainingTaxableIncome}</Typography.Text>
            </Flex>
        </Flex>

        <Flex gap={20} className="xs:mt-2 md:mt-4">
            <Button
                className="px-5"
                type="primary"
                danger
                htmlType="submit"
                onClick={onSubmit}
                loading={loading}
            >
                Submit
            </Button>
            <Button className="px-5" danger htmlType="button" onClick={onCancel}>
                Cancel
            </Button>
        </Flex>
    </>
);

export default SummaryAndActionsSection;
