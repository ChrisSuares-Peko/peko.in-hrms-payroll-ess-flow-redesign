import React from 'react';

import { Button, Flex } from 'antd';

import TypographyText from '@components/atomic/typography/typographyText';

interface Props {
    used: number;
    max: number;
    onUpgrade?: () => void;
    isLoading?: boolean;
}

const clampPercent = (used: number, max: number) => {
    if (!max || max <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round((used / max) * 100)));
};

const EInvoiceLimitCard: React.FC<Props> = ({ used, max, onUpgrade, isLoading }) => {
    const percent = clampPercent(used, max);
    const usedWord = used === 1 ? 'e-invoice' : 'e-invoices';
    const maxWord = max === 1 ? 'e-invoice' : 'e-invoices';

    return (
        <Flex
            vertical
            gap={12}
            className="w-full p-4 md:p-5 bg-white rounded-2xl border border-[#E4E4E7]"
        >
            <TypographyText className="text-base font-semibold leading-6">
                E-Invoice Limit
            </TypographyText>

            <Flex
                align="center"
                className="h-1.5 w-full bg-[#E5E7EB] rounded-full overflow-hidden"
            >
                <div
                    className="h-1.5 bg-[#16A34A] rounded-full transition-[width]"
                    style={{ width: `${percent}%` }}
                />
            </Flex>

            <TypographyText className="text-[#6A7282] text-sm font-normal leading-5">
                {`${used} ${usedWord} used of ${max} ${maxWord}`}
            </TypographyText>

            <Button
                block
                loading={isLoading}
                onClick={onUpgrade}
                className="h-10 mt-1 bg-white border-[#FECACA] text-[#DC2626] hover:!bg-[#FEF2F2] hover:!text-[#DC2626] hover:!border-[#F87171] text-sm font-medium rounded-lg"
            >
                Upgrade
            </Button>
        </Flex>
    );
};

export default EInvoiceLimitCard;
