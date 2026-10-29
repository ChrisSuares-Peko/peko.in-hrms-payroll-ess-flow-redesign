import { Button, Col, Flex, Row, Skeleton, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { useLocation, useNavigate } from 'react-router-dom';

import { TransactionData } from '../components/transactionDetailData';
import TransactionMainCard from '../components/TransactionMainCard';
import TransactionSettlementCard from '../components/TransactionSettlementCard';
import TransactionSidebar from '../components/TransactionSidebar';
import TransactionTimeline from '../components/TransactionTimeline';
import useGetTransactionDetail from '../hooks/useGetTransactionDetail';

const formatAmount = (amount: number) =>
    `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const formatDateTime = (value: string | null | undefined) => {
    if (!value) return '—';
    const parsed = dayjs(value);
    return parsed.isValid() ? parsed.format('MMM D, YYYY [at] h:mm A') : value;
};

const getSettlementAmount = (status: string, paymentAmount: number) => {
    if (status === 'SUCCESS') {
        return formatAmount(paymentAmount);
    }
    if (status === 'PENDING') {
        return 'Pending';
    }
    return '₹0';
};

const statusLabelMap: Record<string, TransactionData['status']> = {
    SUCCESS: 'Successful',
    PENDING: 'Pending',
    FAILED: 'Failed',
};

const TransactionDetail = () => {
    const navigate = useNavigate();
    // Get the passed state from the previous route (Transactions list) using useLocation hook
    const location = useLocation();
    // const key = location.state?.key;
    const  id  = location.state?.key;
    const { isLoading, data, notFound } = useGetTransactionDetail(id);
console.log(location)
    if (notFound) {
        return (
            <Flex vertical gap={20} className="p-4 md:p-6" align="center" justify="center" style={{ minHeight: 300 }}>
                <Typography.Title level={4}>Transaction not found</Typography.Title>
                <Button onClick={() => navigate(-1)}>Go Back</Button>
            </Flex>
        );
    }

    if (isLoading || !data) {
        return (
            <Flex vertical gap={20} className="p-4 md:p-6">
                <Skeleton active paragraph={{ rows: 8 }} />
            </Flex>
        );
    }

    const copy = (val: string, label: string) => {
        navigator.clipboard.writeText(val);
        message.success(`${label} copied`);
    };

    const txn: TransactionData = {
        transactionId: data?.transactionId ?? '—',
        dateTime: formatDateTime(data?.dateTime),
        amount: formatAmount(data?.amount ?? 0),
        paymentMode: data?.paymentMethod,
        status: statusLabelMap[data?.status ?? ''] ?? 'Pending',
        reference: data?.purpose_message,
        utrNumber: data?.utr || '—',
        customerName: data?.customerName,
        paymentLink: data?.paymentLink,
        customerPhone: data?.customerPhone,
        paymentAmount: formatAmount(data?.paymentAmount ?? 0),
        transactionCharges: '—',
        settlementAmount: getSettlementAmount(data?.status ?? '', data?.paymentAmount ?? 0),
        timeline: Array.isArray(data?.timeline)
            ? data.timeline.map(t => ({
                ...t,
                time: formatDateTime(t?.time),
            }))
            : [],
    };

    return (
        <Flex vertical gap={20} className="p-4 md:p-6">


            {/* Page Title */}
            <Flex vertical gap={4}>
                <Typography.Title level={3} className="!mb-0 !font-bold">
                    Transaction Details
                </Typography.Title>
                <Typography.Text className="text-gray-500 text-sm">
                    Complete information about this transaction
                </Typography.Text>
            </Flex>

            <Row gutter={[16, 16]}>
                {/* Left column */}
                <Col xs={24} lg={16}>
                    <Flex vertical gap={16}>
                        <TransactionMainCard
                            txn={txn}
                            onCopy={copy}
                        />
                        <TransactionSettlementCard
                            paymentAmount={txn.paymentAmount}
                            transactionCharges={txn.transactionCharges}
                            settlementAmount={txn.settlementAmount}
                            settlementUtr={data?.settlementUtr || '—'}
                            settledDate={data?.settledDate ? formatDateTime(data.settledDate) : '—'}
                        />
                        <TransactionTimeline timeline={txn?.timeline} />
                    </Flex>
                </Col>

                {/* Right column */}
                <Col xs={24} lg={8}>
                    <TransactionSidebar
                        paymentMode={txn.paymentMode}
                        onNavigateDashboard={() => navigate(-2)}
                        onNavigateTransactions={() => navigate(-1)}
                    />
                </Col>
            </Row>
        </Flex>
    );
};

export default TransactionDetail;
