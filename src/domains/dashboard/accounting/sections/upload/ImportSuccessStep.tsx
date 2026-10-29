import { CheckOutlined } from '@ant-design/icons';
import { Col, Flex, Row, Typography } from 'antd';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import StepFooter from './StepFooter';
import { ParsedStatementSummary } from '../../api/transactions';
import cardIcon from '../../assets/card.svg';
import { ImportStat, importedSummary } from '../../utils/uploadData';

const { Title, Text } = Typography;

interface ImportSuccessStepProps {
    summary: ParsedStatementSummary;
    onUploadAnother: () => void;
    onViewTransactions: () => void;
}

const money = (n: number) => `₹${formatNumberWithLocalString(n)}`;

const ImportSuccessStep = ({
    summary,
    onUploadAnother,
    onViewTransactions,
}: ImportSuccessStepProps) => {
    const range =
        summary.statementStart && summary.statementEnd
            ? `${summary.statementStart} – ${summary.statementEnd}`
            : importedSummary.account;

    const stats: ImportStat[] = [
        {
            key: 'imported',
            label: 'Total imported',
            value: String(summary.totalImported),
            caption: 'Transactions',
            bg: '#FDF6F0',
        },
        {
            key: 'credits',
            label: 'Total credits',
            value: money(summary.credits.amount),
            caption: `${summary.credits.count} Transactions`,
            bg: '#ECF0FC',
        },
        {
            key: 'debits',
            label: 'Total debits',
            value: money(summary.debits.amount),
            caption: `${summary.debits.count} Transactions`,
            bg: '#EBF6F1',
        },
        {
            key: 'categorized',
            label: 'Categorized',
            value: `${summary.categorizedPercent}%`,
            caption: `of ${summary.totalImported}`,
            bg: '#FCF9FF',
        },
    ];

    return (
        <Flex vertical gap={24} className="w-full">
            <Flex vertical align="center" gap={12} className="w-full">
                <Flex
                    align="center"
                    justify="center"
                    className="size-[120px] rounded-full bg-emerald-50"
                >
                    <Flex
                        align="center"
                        justify="center"
                        className="size-[90px] rounded-full bg-emerald-100"
                    >
                        <Flex
                            align="center"
                            justify="center"
                            className="size-[60px] rounded-full bg-success"
                        >
                            <CheckOutlined className="text-2xl text-white" />
                        </Flex>
                    </Flex>
                </Flex>
                <Title level={2} className="!mb-0 !text-2xl !font-medium !text-black md:!text-2xl">
                    {importedSummary.title}
                </Title>
                <Flex vertical gap={4} className="w-full">
                    <Text className="text-center text-sm text-slate-600 md:text-base">{range}</Text>
                    <Text className="text-center text-sm text-slate-400 md:text-base">
                        {importedSummary.subtitle}
                    </Text>
                </Flex>
            </Flex>

            <Row gutter={[16, 16]} align="stretch" className="w-full">
                {stats.map(stat => (
                    <Col key={stat.key} xs={24} sm={12} className="flex">
                        <Flex
                            vertical
                            gap={4}
                            justify="center"
                            className="h-full w-full rounded-[22px] px-7 py-5"
                            style={{ backgroundColor: stat.bg }}
                        >
                            <Text className="text-sm text-bodyText">{stat.label}</Text>
                            <Text className="text-xl font-semibold text-ink">{stat.value}</Text>
                            <Text className="text-sm text-bodyText opacity-50">{stat.caption}</Text>
                        </Flex>
                    </Col>
                ))}
            </Row>

            <Flex
                gap={16}
                align="center"
                className="w-full rounded-[22px] border border-borderStrong bg-surfaceGray p-6"
            >
                <img src={cardIcon} alt="" aria-hidden className="size-9 shrink-0" />
                <Flex vertical gap={4} className="min-w-0">
                    <Text className="text-sm font-medium text-bodyText md:text-base">
                        {importedSummary.reviewBanner.title}
                    </Text>
                    <Text className="text-sm text-slate-400">
                        {importedSummary.reviewBanner.description}
                    </Text>
                </Flex>
            </Flex>

            <StepFooter
                secondaryLabel={importedSummary.uploadAnotherLabel}
                onSecondary={onUploadAnother}
                primaryLabel={importedSummary.viewTransactionsLabel}
                onPrimary={onViewTransactions}
            />
        </Flex>
    );
};

export default ImportSuccessStep;
