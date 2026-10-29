import { Badge, Flex, Progress, Tag, Typography } from 'antd';

import { RevenueCollectionHealthType } from '../../../types/payments';
import { formatAmount } from '../../../utils/helperFunctions';

type Props = {
    revenueSegments: RevenueCollectionHealthType[];
    totalInvoiced: number;
};

function RevenueCollectionHealth({ revenueSegments, totalInvoiced }: Props) {
    return (
        <Flex vertical gap={12} className="bg-[#F9F9F9] rounded-2xl p-6">
            <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
                <Typography.Text className="text-lg font-semibold leading-6">
                    Revenue Collection Health
                </Typography.Text>
                <Tag
                    className="rounded-full px-3 py-[2px] text-xs font-semibold border-0 m-0"
                    color="#ECFDF5"
                    style={{ color: '#43B75D' }}
                >
                    {revenueSegments[0].pct}% Collection Rate
                </Tag>
            </Flex>
            <Typography.Text className="text-[#64748B] text-xs">
                Total Invoiced:{' '}
                <Typography.Text className="text-[#475569] text-xs font-bold">
                    {formatAmount(totalInvoiced)}
                </Typography.Text>
            </Typography.Text>
            <Flex className="w-full h-3" gap={3}>
                {revenueSegments
                    .filter(s => s.pct > 0)
                    .map((s, i, arr) => {
                        const isFirst = i === 0;
                        const isLast = i === arr.length - 1;
                        let roundClass =
                            '[&_.ant-progress-bg]:!rounded-none [&_.ant-progress-inner]:!rounded-none';
                        if (isFirst) {
                            roundClass =
                                '[&_.ant-progress-bg]:!rounded-l-full [&_.ant-progress-inner]:!rounded-l-full';
                        }
                        if (isLast) {
                            roundClass =
                                '[&_.ant-progress-bg]:!rounded-r-full [&_.ant-progress-inner]:!rounded-r-full';
                        }
                        return (
                            <Progress
                                key={s.label}
                                percent={100}
                                showInfo={false}
                                strokeColor={s.color}
                                trailColor="transparent"
                                className={`[&_.ant-progress-bg]:!h-3 [&_.ant-progress-outer]:!py-0 m-0 ${roundClass}`}
                                style={{ flex: s.pct }}
                            />
                        );
                    })}
            </Flex>
            <Flex gap={16} wrap="wrap">
                {revenueSegments.map(s => (
                    <Flex key={s.label} align="center" gap={6}>
                        <Badge color={s.color} />
                        <Typography.Text className="text-[#475569] text-xs">
                            {s.label} ({s.pct}%){' '}
                            <Typography.Text className="text-[#475569] text-xs font-bold">
                                {formatAmount(s.amount)}
                            </Typography.Text>
                        </Typography.Text>
                    </Flex>
                ))}
            </Flex>
        </Flex>
    );
}

export default RevenueCollectionHealth;
