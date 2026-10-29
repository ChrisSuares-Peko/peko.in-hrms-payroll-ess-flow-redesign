import { Card, Flex, Typography, Statistic } from 'antd';

interface DeductionSummaryProps {
    deductionSummaryData:
        | {
              epf: number;
              esi: number;
              tds: number;
              lwf: number;
              totalDeduction: number;
          }[]
        | undefined;
}

const DeductionSummary = ({ deductionSummaryData }: DeductionSummaryProps) => {
    const summary = deductionSummaryData?.[0];
    const deductionData = [
        { label: 'EPF', amount: summary?.epf ?? 0, color: '#7B61FF' },
        { label: 'ESI', amount: summary?.esi ?? 0, color: '#5CE1E6' },
        { label: 'TDS', amount: summary?.tds ?? 0, color: '#F9C74F' },
    ];
    return (
        <Card className="rounded-3xl shadow-sm w-full mt-3">
            <Flex justify="space-between" align="center" className="mb-5">
                <Typography.Text className="!m-0 font-medium text-sm">
                    Deduction Summary
                </Typography.Text>
            </Flex>

            {/* Progress Bar */}
            <Flex className="w-full h-1.5 rounded-full flex overflow-hidden mb-6">
                {deductionData.map((item, idx) => (
                    <div
                        key={idx}
                        className="h-full"
                        style={{
                            width: `${100 / deductionData.length}%`,
                            backgroundColor: item.color,
                        }}
                    />
                ))}
            </Flex>

            <Flex justify="space-between" gap={10}>
                {deductionData.map((item, idx) => (
                    <Flex vertical key={idx} className=" rounded-xl px-4 py-3 w-full bg-gray-50">
                        <Flex align="center" gap={10}>
                            <span
                                className="h-1 w-1 rounded-full"
                                style={{ backgroundColor: item.color }}
                            />
                            <Typography.Text className='text-sm' strong>{item.label}</Typography.Text>
                        </Flex>
                        <Flex style={{ width: '200%' }}>
                            <Statistic
                                value={item.amount}
                                prefix="₹"
                                valueStyle={{
                                    color: item.color,
                                    fontStyle: 'bold',
                                    fontSize: '12px',
                                }}
                                groupSeparator=","
                                precision={2}
                                className="mt-2"
                            />
                        </Flex>
                    </Flex>
                ))}
            </Flex>
        </Card>
    );
};

export default DeductionSummary;
