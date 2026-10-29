import { useState } from 'react';

import { Col, Flex, Row } from 'antd';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import CreatePaymentLinkModal from '../components/CreatePaymentLinkModal';
import CollectPaymentSection from '../components/paymentLinkPage/CollectPaymentSection';
import PaymentLinkPageHeader from '../components/paymentLinkPage/PaymentLinkPageHeader';
import PaymentLinkStatsCards from '../components/paymentLinkPage/PaymentLinkStatsCards';
import RecentTransactionsCard from '../components/paymentLinkPage/RecentTransactionsCard';
import useGetDashboardData from '../hooks/useGetDashboardData';
import { CollectPaymentAction } from '../types/paymentLinkTypes';

const PaymentLink = () => {
    const navigate = useNavigate();
    const [modalOpen, setModalOpen] = useState(false);

    const {
        activePaymentLinksCount,
        totalAmountThisMonth,
        transactions,
        isLoading,
        fetchDashboardData,
    } = useGetDashboardData();

    const handleCollectOptionClick = (modalType: CollectPaymentAction) => {
        if (modalType === 'createLink') setModalOpen(true);
    };

    return (
        <Flex vertical gap={20} className="p-4 md:p-6">
            <PaymentLinkPageHeader onCreatePaymentLink={() => setModalOpen(true)} />

            {/* Two-column layout */}
            <Row gutter={24} align="stretch">
                {/* Left: stats + collect payment */}
                <Col xs={24} lg={16}>
                    <Flex vertical gap={24}>
                        <PaymentLinkStatsCards
                            activePaymentLinksCount={activePaymentLinksCount}
                            totalAmountThisMonth={totalAmountThisMonth}
                            isLoading={isLoading}
                        />
                        <CollectPaymentSection onOptionClick={handleCollectOptionClick} />
                    </Flex>
                </Col>

                {/* Right: Recent Transactions */}
                <Col xs={24} lg={8}>
                    <RecentTransactionsCard
                        transactions={transactions}
                        isLoading={isLoading}
                        onViewAll={() => navigate(paths.paymentLinks.Transactions)}
                    />
                </Col>
            </Row>

            <CreatePaymentLinkModal
                open={modalOpen}
                onSubmit={fetchDashboardData}
                onClose={() => setModalOpen(false)}
            />
        </Flex>
    );
};

export default PaymentLink;
