import { Flex, Typography } from 'antd';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import ReportCardState from './ReportCardState';
import SectionCard from './SectionCard';
import { detailedStatementTitle, StatementRow, StatementSection } from '../../utils/profitLossData';

const { Text } = Typography;

const rowContainerClass = (emphasis?: StatementRow['emphasis']): string => {
    switch (emphasis) {
        case 'warning':
            return 'rounded-lg border border-warning-border bg-warning-surface px-3';
        case 'success':
            return 'border-t border-slate-200 px-3 pt-3';
        case 'subtotal':
            return 'rounded-lg bg-surfaceGray px-3';
        default:
            return 'border-b border-slate-100 px-3';
    }
};

const rowTextColor = (emphasis?: StatementRow['emphasis']): string => {
    switch (emphasis) {
        case 'success':
            return '#43B75D';
        case 'warning':
        case 'subtotal':
            return '#1E293B';
        default:
            return '#64748B';
    }
};

const StatementRowItem = ({ row }: { row: StatementRow }) => {
    const isEmphasis = Boolean(row.emphasis);
    const isNegative = row.amount < 0;
    const formatted = `₹${formatNumberWithLocalString(Math.abs(row.amount))}`;
    const amountText = isNegative ? `(${formatted})` : formatted;
    const baseColor = rowTextColor(row.emphasis);
    const amountColor = isNegative ? '#FF4F4F' : baseColor;

    return (
        <Flex
            align="center"
            justify="space-between"
            gap={12}
            className={`w-full py-2 ${rowContainerClass(row.emphasis)}`}
        >
            <Text
                className={`text-sm ${isEmphasis ? 'font-medium' : ''}`}
                style={{ color: baseColor }}
            >
                {row.label}
            </Text>
            <Text
                className={`text-sm ${isEmphasis ? 'font-medium' : ''}`}
                style={{ color: amountColor }}
            >
                {amountText}
            </Text>
        </Flex>
    );
};

interface DetailedPnlCardProps {
    sections: StatementSection[];
    loading?: boolean;
}

const DetailedPnlCard = ({ sections, loading }: DetailedPnlCardProps) => {
    const isEmpty = !loading && sections.length === 0;

    return (
        <SectionCard title={detailedStatementTitle}>
            {loading || isEmpty ? (
                <ReportCardState loading={loading} />
            ) : (
                <Flex vertical className="w-full">
                    {sections.map((section: StatementSection, sectionIndex) => (
                        <Flex
                            vertical
                            gap={6}
                            key={section.key}
                            className={`w-full ${sectionIndex === 0 ? '' : 'mt-4'}`}
                        >
                            {section.heading && (
                                <Text className="text-xs font-medium tracking-wide text-slate-400">
                                    {section.heading}
                                </Text>
                            )}
                            {section.rows.map(row => (
                                <StatementRowItem key={row.label} row={row} />
                            ))}
                        </Flex>
                    ))}
                </Flex>
            )}
        </SectionCard>
    );
};

export default DetailedPnlCard;
