import { Card, Flex, Typography, Divider } from 'antd';

type EmailDetailsProps = {
    orderCount: number | undefined;
    emailCount?: number;
};

export const PayrollSlipCard = ({ orderCount, emailCount }: EmailDetailsProps) => (
    <>
        {/* Card For Large Screen  */}
        <Card className="mt-4 xs:hidden md:block rounded-lg" size="small">
            <Flex wrap="wrap" justify="space-around">
                <Flex gap={5} justify="space-around">
                    <Flex vertical gap={5} justify="space-around" align="start">
                        <Typography.Text
                            className="text-valueText font-medium"
                            style={{ fontSize: '1.246rem' }}
                        >
                            {orderCount}
                        </Typography.Text>
                        <Typography.Text
                            className="text-salarySubText mt-2"
                            style={{ fontSize: ' 0.935rem' }}
                        >
                            Total Payslip
                        </Typography.Text>
                    </Flex>
                </Flex>

                <Flex gap={5} justify="space-around">
                    <Divider type="vertical" className="h-16 me-6 xs:hidden md:inline" />
                    <Flex vertical gap={5} justify="space-around" align="start">
                        <Typography.Text
                            className="text-valueText font-medium"
                            style={{ fontSize: '1.246rem' }}
                        >
                            {emailCount}
                        </Typography.Text>
                        <Typography.Text
                            className="text-salarySubText mt-2"
                            style={{ fontSize: ' 0.935rem' }}
                        >
                            Payslip Emailed
                        </Typography.Text>
                    </Flex>
                </Flex>

                <Flex gap={5} justify="space-around">
                    <Divider type="vertical" className="h-16 me-6 xs:hidden md:inline" />
                    <Flex vertical gap={5} justify="space-around" align="start">
                        <Typography.Text
                            className="text-valueText font-medium"
                            style={{ fontSize: '1.246rem' }}
                        >
                            2
                        </Typography.Text>
                        <Typography.Text
                            className="text-salarySubText mt-2"
                            style={{ fontSize: ' 0.935rem' }}
                        >
                            Conflicted Payslip
                        </Typography.Text>
                    </Flex>
                </Flex>
            </Flex>
        </Card>
        {/* Card For Large Screen  End */}

        {/* Card For Small Screen */}
        <Flex gap="small" className="mt-4 md:hidden">
            <Card size="small" className="bg-bgGray border-0">
                <Flex vertical justify="center" align="center" gap="small">
                    <Typography.Text
                        className="text-valueText font-medium"
                        style={{ fontSize: '1.246rem' }}
                    >
                        {orderCount}
                    </Typography.Text>
                    <Typography.Text
                        className="text-salarySubText mt-2"
                        style={{ fontSize: ' 0.935rem' }}
                    >
                        Total Payslip
                    </Typography.Text>
                </Flex>
            </Card>
            <Card size="small" className="bg-bgGray border-0">
                <Flex vertical justify="center" align="center" gap="small">
                    <Typography.Text
                        className="text-valueText font-medium"
                        style={{ fontSize: '1.246rem' }}
                    >
                        {emailCount}
                    </Typography.Text>
                    <Typography.Text
                        className="text-salarySubText mt-2"
                        style={{ fontSize: ' 0.935rem' }}
                    >
                        Payslip Emailed
                    </Typography.Text>
                </Flex>
            </Card>
            <Card size="small" className="bg-bgGray border-0">
                <Flex vertical justify="center" align="center" gap="small">
                    <Typography.Text
                        className="text-valueText font-medium"
                        style={{ fontSize: '1.246rem' }}
                    >
                        2
                    </Typography.Text>
                    <Typography.Text
                        className="text-salarySubText mt-2"
                        style={{ fontSize: ' 0.935rem' }}
                    >
                        Conflicted Payslip
                    </Typography.Text>
                </Flex>
            </Card>
        </Flex>
        {/* Card For Small Screen End  */}
    </>
);
