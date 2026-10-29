
import { Col, Flex, Row, Typography } from 'antd';

import Chart from '@src/domains/dashboard/Payroll/components/Dashboard/Chart';
import OneTimePaymentForm from '@src/domains/dashboard/Payroll/components/Dashboard/OneTimePaymentForm';
import QuickAccessCards from '@src/domains/dashboard/Payroll/components/Dashboard/QuickAccessCards';
import StatCards from '@src/domains/dashboard/Payroll/components/Dashboard/StatCards';
import { useScrollToTop } from '@src/hooks/useScrollToTop';

const { Text } = Typography;

const SalaryDashboard = () => {
    useScrollToTop();

    return (
        <Flex vertical gap={45} style={{ padding: '24px 16px 48px', width: '100%' }}>
            {/* Header */}
            <Flex vertical gap={10}>
                <Text style={{ fontSize: 20, fontWeight: 500, color: '#101828' }}>
                    Salary Dashboard
                </Text>
                <Text style={{ fontSize: 14, lineHeight: '22px', color: '#6A7282' }}>
                    Your payroll command centre — track disbursements, monitor balances, and run
                    salary cycles all in one place.
                </Text>
            </Flex>

            {/* Two-column layout */}
            <Row gutter={[{ xs: 0, sm: 16, lg: 30 }, 30]} align="stretch">
                {/* Left column */}
                <Col xs={24} lg={17}>
                    <Flex vertical gap={40}>
                        <StatCards />
                        <QuickAccessCards />

                        {/* Payroll Costs Chart */}
                        <Chart />
                    </Flex>
                </Col>

                {/* Right column — One-Time Payments */}
                <Col xs={24} lg={7}>
                    <OneTimePaymentForm />
                </Col>
            </Row>
        </Flex>
    );
};

export default SalaryDashboard;
