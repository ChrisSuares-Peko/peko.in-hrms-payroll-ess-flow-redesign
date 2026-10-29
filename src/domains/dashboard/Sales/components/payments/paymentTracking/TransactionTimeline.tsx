import { Card, Flex, Typography } from 'antd';

import { CARD_BODY_CLASS } from '../../../constants/style';
import { PaymentDetailsData } from '../../../types/payments';
import { formatDate } from '../../../utils/helperFunctions';

function TransactionTimeline({ data }: { data: PaymentDetailsData | null }) {
    const steps = data?.timeline ?? [];

    return (
        <Card classNames={{ body: CARD_BODY_CLASS }} className="rounded-xl">
            <Typography.Text className="text-base font-semibold leading-6">
                Transaction Timeline
            </Typography.Text>
            {steps.length > 0 ? (
                <Flex vertical gap={0} className="mt-2">
                    {steps.map((step, i) => {
                        const isLast = i === steps.length - 1;
                        const isDate = step.time && step.time.includes('T');
                        const displayTime = isDate ? formatDate(step.time) : step.time;
                        return (
                            <Flex key={i} gap={16} align="flex-start">
                                {/* Dot + line column */}
                                <Flex vertical align="center" className="flex-shrink-0 w-4">
                                    <div className="w-4 h-4 rounded-full flex-shrink-0 bg-[#26A411]" />
                                    {!isLast && (
                                        <div
                                            className="w-0.5 mt-1 bg-[#26A411]"
                                            style={{ minHeight: 36 }}
                                        />
                                    )}
                                </Flex>
                                {/* Text column */}
                                <Flex vertical gap={1} className="pb-5">
                                    <Typography.Text
                                        className="text-sm font-semibold leading-5 text-[#26A411]"
                                    >
                                        {step.label}
                                    </Typography.Text>
                                    <Typography.Text className="text-gray-500 text-xs font-normal leading-5">
                                        {displayTime}
                                    </Typography.Text>
                                </Flex>
                            </Flex>
                        );
                    })}
                </Flex>
            ) : (
                <Typography.Text className="text-gray-400 text-xs">
                    No timeline available
                </Typography.Text>
            )}
        </Card>
    );
}

export default TransactionTimeline;
