import { Col, Flex, Row, Typography } from 'antd';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import { balanceSheetStatement, BsColumn, BsRow, BsSubSection } from '../../utils/balanceSheetData';
import SectionCard from '../profitLoss/SectionCard';

interface BalanceSheetStatementCardProps {
    assets: BsColumn;
    liabilities: BsColumn;
}

const { Text } = Typography;

const StatementRowItem = ({ row }: { row: BsRow }) => {
    const amount = Number.isFinite(row.amount) ? row.amount : 0;
    const isNegative = amount < 0;
    const amountText = `₹${formatNumberWithLocalString(Math.abs(amount))}`;
    const displayAmount = isNegative ? `(${amountText})` : amountText;

    if (row.kind === 'total') {
        return (
            <Flex
                justify="space-between"
                align="center"
                gap={8}
                className="w-full rounded-lg border border-success-border bg-success-surface px-3 py-2"
            >
                <Text className="min-w-0 break-words text-sm font-semibold text-ink">
                    {row.label}
                </Text>
                <Text className="shrink-0 whitespace-nowrap pl-2 text-sm font-semibold text-success">
                    {displayAmount}
                </Text>
            </Flex>
        );
    }

    if (row.kind === 'subtotal') {
        const toneColor = row.tone === 'error' ? '#FF4F4F' : '#43B75D';
        return (
            <Flex
                justify="space-between"
                align="center"
                gap={8}
                className="w-full rounded-lg bg-surfaceGray px-3 py-2"
            >
                <Text className="min-w-0 break-words text-sm font-medium text-ink">
                    {row.label}
                </Text>
                <Text
                    className="shrink-0 whitespace-nowrap pl-2 text-sm font-medium"
                    style={{ color: toneColor }}
                >
                    {displayAmount}
                </Text>
            </Flex>
        );
    }

    return (
        <Flex
            justify="space-between"
            align="center"
            gap={8}
            className="w-full border-b border-slate-100 px-3 py-2"
        >
            <Text className="min-w-0 break-words text-sm text-slate-500">{row.label}</Text>
            <Text
                className="shrink-0 whitespace-nowrap pl-2 text-sm"
                style={{ color: isNegative ? '#FF4F4F' : '#475569' }}
            >
                {displayAmount}
            </Text>
        </Flex>
    );
};

const renderColumn = (col: BsColumn) => (
    <Flex vertical gap={12} className="w-full">
        <Text className="mb-1 text-sm font-semibold text-ink">{col.title}</Text>
        {col.sections.map((section: BsSubSection) => (
            <Flex vertical gap={6} key={section.heading} className="w-full">
                <Text className="mt-3 text-xs font-medium tracking-wide text-slate-400">
                    {section.heading}
                </Text>
                {section.rows.map((row, index) => (
                    <StatementRowItem key={`${section.heading}-${index}`} row={row} />
                ))}
            </Flex>
        ))}
        <StatementRowItem row={col.total} />
    </Flex>
);

const BalanceSheetStatementCard = ({ assets, liabilities }: BalanceSheetStatementCardProps) => (
    <SectionCard title={balanceSheetStatement.title}>
        <Row gutter={[24, 24]} className="w-full">
            <Col xs={24} xl={12}>
                {renderColumn(assets)}
            </Col>
            <Col xs={24} xl={12}>
                {renderColumn(liabilities)}
            </Col>
        </Row>
    </SectionCard>
);

export default BalanceSheetStatementCard;
