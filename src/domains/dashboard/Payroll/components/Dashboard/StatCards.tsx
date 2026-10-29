import { Col, Flex, Row, Skeleton, Typography } from 'antd';

import { useGetPaymentVirtualAccountBalance } from '@src/domains/dashboard/Payroll/hooks/useGetPaymentVirtualAccountBalance';
import { useGetSalarySummary } from '@src/domains/dashboard/Payroll/hooks/useGetSalarySummary';
import { statCards } from '@src/domains/dashboard/Payroll/utils/dashboard/salaryDashboardData';

const { Text } = Typography;

const fmtDecimal = (val: number | null) =>
    val !== null ? `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';

const StatCards = () => {
    const { data: summary, isLoading: summaryLoading } = useGetSalarySummary();
    const { balance, isLoading: balanceLoading } = useGetPaymentVirtualAccountBalance();

    const values = [
        fmtDecimal(summary?.currentMonthDue ?? null),
        fmtDecimal(summary?.lastMonthRolledOut ?? null),
        fmtDecimal(balance),
    ];

    const isLoading = summaryLoading || balanceLoading;

    return (
        <Row gutter={[12, 12]}>
            {statCards.map((card, i) => (
                <Col key={i} xs={24} sm={8}>
                    <Flex
                        vertical
                        align="flex-start"
                        gap={8}
                        className="p-3 md:p-[22px_28px]"
                        style={{
                            background: card.bg,
                            borderRadius: 22,
                            height: '100%',
                        }}
                    >
                        <Flex
                            align="center"
                            justify="center"
                            style={{
                                width: 40,
                                height: 40,
                                background: '#FFFFFF',
                                borderRadius: '50%',
                                flexShrink: 0,
                            }}
                        >
                            {card.icon}
                        </Flex>
                        <Text className="text-xs text-[#6B7280] md:text-[13px]">
                            {card.label}
                        </Text>
                        {isLoading ? (
                            <Skeleton.Input active size="small" style={{ width: 80 }} />
                        ) : (
                            <Text className="text-sm font-bold text-[#101828] md:text-2xl">
                                {values[i]}
                            </Text>
                        )}
                    </Flex>
                </Col>
            ))}
        </Row>
    );
};

export default StatCards;
