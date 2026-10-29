import { Flex } from 'antd';

import TypographyText from '@components/atomic/typography/typographyText';

import CopyableRow from '../shared/CopyableRow';

interface Props {
    displayId: string;
    customerName: string;
    linkedQuotation: string;
    startDate: string;
    contractType: string;
}

const AgreementSummaryCard = ({
    displayId,
    customerName,
    linkedQuotation,
    startDate,
    contractType,
}: Props) => {
    const fields = [
        { label: 'Agreement ID', value: displayId },
        { label: 'Customer', value: customerName },
        { label: 'Linked Quotation', value: linkedQuotation },
        { label: 'Start Date', value: startDate },
        { label: 'Contract Type', value: contractType },
    ];

    return (
        <Flex vertical className="rounded-2xl border border-[#E5E7EB] p-6 gap-5">
            <TypographyText className="text-sm font-semibold">Agreement Summary</TypographyText>
            <Flex wrap gap={8} className="[&>*]:flex-[0_0_calc(50%-4px)]">
                {fields.map(f => (
                    <CopyableRow
                        key={f.label}
                        title={f.label}
                        description={f.value}
                        isCopy={false}
                    />
                ))}
            </Flex>
        </Flex>
    );
};

export default AgreementSummaryCard;
