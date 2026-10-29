import React, { useEffect, useState } from 'react';

import { Card, Col, Row, Skeleton, Space, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { InvoiceData } from '../../Procure/types';
import { StatCard, QuickActionCard, PayoutItem } from '../components';
import useAddBeneficiaryApi from '../hooks/useAddBeneficiaryApi';
import useDashBoardDetailsApi from '../hooks/useDashBoardDetailsApi';
import useGetAllPayoutsApi from '../hooks/useGetAllPayoutsApi';
import useNupayWalletBalance from '../hooks/useNupayWalletBalance';
import usePayoutStatusApi from '../hooks/usePayoutStatusApi';
import AddBeneficiaryDrawer from '../modals/AddBeneficiaryDrawer';
import AddBillModal from '../modals/AddBillModal';
import InvoiceSelectionModal from '../modals/InvoiceSelectionModal';
import MakePayoutModal from '../modals/MakePayoutModal';
import ManageBankAccountsModal from '../modals/ManageBankAccountsModal';
import ManageBeneficiariesModal from '../modals/ManageBeneficiariesModal';
import OtherBillsDrawer from '../modals/OtherBillsDrawer';
import PaymentDetailsDrawer from '../modals/PaymentDetailsDrawer';
import PayoutSuccessModal from '../modals/PayoutSuccessModal';
import RentDrawer from '../modals/RentDrawer';
import VendorPaymentsDrawer from '../modals/VendorPaymentsDrawer';
import { PendingRentPayout, PayoutTransferResponse } from '../types';
import { quickActions } from '../utils/mockData';
import { statDefinitions } from '../utils/stats';

const { Text, Title } = Typography;

const PayoutDashboard = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const {
        getDashboardDetails,
        data: dashboardData,
        isLoading: statsLoading,
    } = useDashBoardDetailsApi();
    const { addBeneficiary, isLoading: addBeneficiaryLoading } = useAddBeneficiaryApi();
    const { getAllPayouts, data: recentPayouts } = useGetAllPayoutsApi();
    const { startPolling, stopPolling } = usePayoutStatusApi();
    const { fetchBalance, balance: vaBalance, isLoading: vaBalanceLoading } = useNupayWalletBalance();

    const [isAddBillVisible, setAddBillVisible] = useState(false);
    const [isInvoiceModalVisible, setInvoiceModalVisible] = useState(false);
    const [isPaymentDetailsVisible, setPaymentDetailsVisible] = useState(false);
    const [isRentDrawerVisible, setRentDrawerVisible] = useState(false);
    const [isVendorDrawerVisible, setVendorDrawerVisible] = useState(false);
    const [isOtherBillsDrawerVisible, setOtherBillsDrawerVisible] = useState(false);
    const [isManageBeneficiariesVisible, setManageBeneficiariesVisible] = useState(false);
    const [isManageBankAccountsVisible, setManageBankAccountsVisible] = useState(false);
    const [isAddBeneficiaryVisible, setAddBeneficiaryVisible] = useState(false);
    const [isMakePayoutVisible, setMakePayoutVisible] = useState(false);
    const [isSuccessModalVisible, setSuccessModalVisible] = useState(false);
    const [selectedInvoices, setSelectedInvoices] = useState<InvoiceData[]>([]);
    const [pendingRentPayout, setPendingRentPayout] = useState<PendingRentPayout | null>(null);
    const [transactionData, setTransactionData] = useState<PayoutTransferResponse | null>(null);

    useEffect(() => {
        getDashboardDetails();
        getAllPayouts({ page: 1, itemsPerPage: 5 });
        fetchBalance();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const BILL_PAYOUT_ROUTE = '/payouts/bill-payout';
    const RENT_ROUTE = '/payouts/rent';
    const VENDOR_ROUTE = '/payouts/vendor-payments';
    const OTHER_BILLS_ROUTE = '/payouts/other-bills';

    const handleBillOptionSelect = (route: string) => {
        setAddBillVisible(false);
        if (route === BILL_PAYOUT_ROUTE) {
            setInvoiceModalVisible(true);
        } else if (route === RENT_ROUTE) {
            setRentDrawerVisible(true);
        } else if (route === VENDOR_ROUTE) {
            setVendorDrawerVisible(true);
        } else if (route === OTHER_BILLS_ROUTE) {
            setOtherBillsDrawerVisible(true);
        } else {
            navigate(route);
        }
    };

    const handleMakePayment = (invoices: InvoiceData[]) => {
        setSelectedInvoices(invoices);
        setInvoiceModalVisible(false);
        setPaymentDetailsVisible(true);
    };

    const handleProcessPayment = (result: PayoutTransferResponse | null) => {
        setTransactionData(result);
        setPaymentDetailsVisible(false);
        setSuccessModalVisible(true);
        fetchBalance();
    };

    const handleRentCreateBill = (data: PendingRentPayout) => {
        setPendingRentPayout(data);
        setRentDrawerVisible(false);
        setTimeout(() => setMakePayoutVisible(true), 300);
    };

    const handleMakePayoutProcess = (result: PayoutTransferResponse) => {
        setTransactionData({ ...result, amount: pendingRentPayout?.amount, paidAt: new Date().toISOString() });
        setMakePayoutVisible(false);
        setSuccessModalVisible(true);

        const isPending = result.transactionStatus?.toLowerCase() === 'pending';
        dispatch(showToast({
            description: isPending ? 'Payout initiated successfully. Processing...' : 'Payout completed successfully!',
            variant: 'success',
        }));

        getDashboardDetails();
        getAllPayouts({ page: 1, itemsPerPage: 5 });
        fetchBalance();

        if (isPending && result.transactionId) {
            startPolling(result.transactionId, resolved => {
                setTransactionData(resolved);
                getDashboardDetails();
                getAllPayouts({ page: 1, itemsPerPage: 5 });
                fetchBalance();
            });
        }
    };

    const handleSuccessClose = async () => {
        stopPolling();
        setSuccessModalVisible(false);
        setSelectedInvoices([]);
        setPendingRentPayout(null);
        setTransactionData(null);

        await getDashboardDetails();
        await getAllPayouts({ page: 1, itemsPerPage: 5 });
        fetchBalance();
    };

    if (statsLoading) {
        return <Skeleton active />;
    }

    return (
        <div>
            <Row justify="space-between" align="middle">
                <Col>
                    <Space direction="vertical" size={4}>
                        <Text className="text-lg font-medium sm:text-xl">Payouts</Text>
                        <Text type="secondary">
                            Manage outgoing payments, bills, and beneficiaries
                        </Text>
                    </Space>
                </Col>
            </Row>

            <Row gutter={[20, 20]} className="mt-6">
                <Col xs={24} lg={12}>
                    <Row gutter={[20, 20]} className="mb-6">
                        {statDefinitions.map(item => {
                            const valueMap: Record<string, string | undefined> = {
                                'total-payout': dashboardData?.totalPayoutsThisMonth
                                    ? parseFloat(
                                          dashboardData.totalPayoutsThisMonth.toString()
                                      ).toLocaleString('en-IN', {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                      })
                                    : '0.00',
                                'active-beneficiaries':
                                    dashboardData?.activeBeneficiaries?.toString(),
                                'va-balance': vaBalance !== null
                                    ? vaBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                    : '—',
                            };
                            const dynamicValue = valueMap[item.key] ?? item.value;

                            return (
                                <Col key={item.key} xs={24} sm={12} md={8}>
                                    <StatCard
                                        label={item.label}
                                        value={dynamicValue}
                                        icon={item.icon}
                                        bgColor={item.bgColor}
                                        prefix={item.prefix}
                                        iconColor={item.iconColor}
                                        loading={item.key === 'va-balance' ? vaBalanceLoading : undefined}
                                    />
                                </Col>
                            );
                        })}
                    </Row>

                    <Row justify="space-between" align="middle">
                        <Col>
                            <Title level={5} className="m-0">
                                Quick Action
                            </Title>
                        </Col>
                    </Row>

                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-4">
                        {quickActions.map(item => (
                            <QuickActionCard
                                key={item.key}
                                title={item.title}
                                icon={item.icon}
                                label={item.label}
                                onClick={() => {
                                    if (item.key === 'add-bill') {
                                        setAddBillVisible(true);
                                    } else if (item.key === 'add-beneficiary') {
                                        setAddBeneficiaryVisible(true);
                                    } else if (item.key === 'manage-beneficiaries') {
                                        setManageBeneficiariesVisible(true);
                                    } else if (item.key === 'bank-accounts') {
                                        setManageBankAccountsVisible(true);
                                    } else {
                                        navigate(item.route);
                                    }
                                }}
                            />
                        ))}
                    </div>
                </Col>

                <Col xs={24} lg={12}>
                    <Card
                        bordered={false}
                        className="rounded-2xl p-5 "
                        style={{ background: '#F9F9F9', height: '100%' }}
                    >
                        <Row justify="space-between" align="middle">
                            <Col>
                                <Title level={5} className="m-0">
                                    Recent Payouts
                                </Title>
                            </Col>
                            <Col>
                                <Text
                                    style={{ fontSize: 13, color: '#FF4D4F', cursor: 'pointer' }}
                                    onClick={() => navigate('/payouts/all-payouts')}
                                >
                                    View All
                                </Text>
                            </Col>
                        </Row>

                        {(Array.isArray(recentPayouts) ? recentPayouts : []).length > 0 ? (
                            <Space direction="vertical" size={12} className="w-full">
                                {(Array.isArray(recentPayouts) ? recentPayouts : []).map(item => (
                                    <PayoutItem
                                        key={item.id}
                                        name={item.payoutBeneficiary?.name ?? item.payeeName}
                                        category={item.category}
                                        date={item.transactionDate}
                                        amount={`₹${parseFloat(item.amount)?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                        status={item.status}
                                    />
                                ))}
                            </Space>
                        ) : (
                            <Row justify="center" style={{ padding: '20px 0' }}>
                                <Col>
                                    <Text type="secondary">No recent payouts available</Text>
                                </Col>
                            </Row>
                        )}
                    </Card>
                </Col>
            </Row>

            <AddBillModal
                visible={isAddBillVisible}
                onCancel={() => setAddBillVisible(false)}
                onSelect={handleBillOptionSelect}
            />

            <InvoiceSelectionModal
                visible={isInvoiceModalVisible}
                onCancel={() => setInvoiceModalVisible(false)}
                onBack={() => {
                    setInvoiceModalVisible(false);
                    setAddBillVisible(true);
                }}
                onMakePayment={handleMakePayment}
            />

            <PaymentDetailsDrawer
                visible={isPaymentDetailsVisible}
                selectedInvoices={selectedInvoices}
                onCancel={() => setPaymentDetailsVisible(false)}
                onProcessPayment={handleProcessPayment}
            />

            <RentDrawer
                visible={isRentDrawerVisible}
                onCancel={() => setRentDrawerVisible(false)}
                onBack={() => {
                    setRentDrawerVisible(false);
                    setAddBillVisible(true);
                }}
                onCreateBill={handleRentCreateBill}
            />

            <VendorPaymentsDrawer
                visible={isVendorDrawerVisible}
                onCancel={() => setVendorDrawerVisible(false)}
                onBack={() => {
                    setVendorDrawerVisible(false);
                    setAddBillVisible(true);
                }}
                onCreateBill={data => {
                    setPendingRentPayout(data);
                    setVendorDrawerVisible(false);
                    setTimeout(() => setMakePayoutVisible(true), 300);
                }}
            />

            <OtherBillsDrawer
                visible={isOtherBillsDrawerVisible}
                onCancel={() => setOtherBillsDrawerVisible(false)}
                onBack={() => {
                    setOtherBillsDrawerVisible(false);
                    setAddBillVisible(true);
                }}
                onCreateBill={data => {
                    setPendingRentPayout(data);
                    setOtherBillsDrawerVisible(false);
                    setTimeout(() => setMakePayoutVisible(true), 300);
                }}
            />

            <MakePayoutModal
                visible={isMakePayoutVisible}
                onCancel={() => setMakePayoutVisible(false)}
                payoutData={pendingRentPayout}
                onProcessPayment={handleMakePayoutProcess}
            />

            <PayoutSuccessModal
                visible={isSuccessModalVisible}
                onClose={handleSuccessClose}
                transactionData={transactionData}
            />

            <ManageBeneficiariesModal
                visible={isManageBeneficiariesVisible}
                onClose={() => setManageBeneficiariesVisible(false)}
                onUpdate={getDashboardDetails}
            />

            <ManageBankAccountsModal
                visible={isManageBankAccountsVisible}
                onClose={() => setManageBankAccountsVisible(false)}
            />

            <AddBeneficiaryDrawer
                visible={isAddBeneficiaryVisible}
                onCancel={() => setAddBeneficiaryVisible(false)}
                isLoading={addBeneficiaryLoading}
                virtualAccountNumber={undefined}
                onAdd={async payload => {
                    const res = await addBeneficiary(payload);
                    if (res) {
                        setAddBeneficiaryVisible(false);
                        dispatch(
                            showToast({
                                description: 'Beneficiary added successfully',
                                variant: 'success',
                            })
                        );
                        getDashboardDetails();
                    }
                }}
            />
        </div>
    );
};

export default PayoutDashboard;
