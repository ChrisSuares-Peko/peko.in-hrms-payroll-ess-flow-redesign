import { useState } from 'react';

import { Button, Card, Flex, Grid, Skeleton, Tabs, Typography } from 'antd';
import type { Dayjs } from 'dayjs';
import * as yup from 'yup';

import SettlementRequestDrawer from '../components/SettlementRequestDrawer';
import VirtualAccountDetailsModal from '../components/VirtualAccountDetailsModal';
// import VirtualAccountSettlementRequestsTab from '../components/VirtualAccountSettlementRequestsTab';
import VirtualAccountStatementTab from '../components/VirtualAccountStatementTab';
import useCreateSettlementRequest from '../hooks/useCreateSettlementRequest';
import useGetSettlementRequests from '../hooks/useGetSettlementRequests';
import useGetVirtualAccountBalance from '../hooks/useGetVirtualAccountBalance';
import useGetVirtualAccountStatement from '../hooks/useGetVirtualAccountStatement';
import { createSettlementRequestSchema } from '../schema/settlementRequestSchema';
import { formatAmount } from '../utils/data';

const VirtualAccountStatement = () => {
    const screens = Grid.useBreakpoint();

    const {
        isLoading: isBalanceLoading,
        balance,
        accountName,
        virtualAccountNumber,
        ifsc,
    } = useGetVirtualAccountBalance();

    const { isLoading, accountDetails, rows, page, setPage, dateRange, setDateRange } =
        useGetVirtualAccountStatement();

    const { refetch: refetchRequests } = useGetSettlementRequests();
    const { loading: isSubmitting, submitSettlementRequest } = useCreateSettlementRequest();

    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [requestAmount, setRequestAmount] = useState<number | null>(null);
    const [requestRemarks, setRequestRemarks] = useState('');
    const [amountError, setAmountError] = useState('');

    const resetRequestModalState = () => {
        setRequestAmount(null);
        setRequestRemarks('');
        setAmountError('');
    };

    const handleCloseRequestModal = () => {
        setIsRequestModalOpen(false);
        resetRequestModalState();
    };

    const handleCreateRequest = async () => {
        try {
            await createSettlementRequestSchema(balance).validate(
                { amount: requestAmount, remarks: requestRemarks },
                { abortEarly: false },
            );
        } catch (err) {
            if (err instanceof yup.ValidationError) {
                const amountErr = err.inner.find(e => e.path === 'amount');
                if (amountErr) setAmountError(amountErr.message);
            }
            return;
        }

        setAmountError('');

        const result = await submitSettlementRequest({
            amount: requestAmount!,
            remarks: requestRemarks.trim() || undefined,
        });

        if (result) {
            handleCloseRequestModal();
            refetchRequests();
        }
    };

    const handleDateRangeChange = (values: [Dayjs | null, Dayjs | null] | null) => {
        if (values?.[0] && values?.[1]) {
            setDateRange([values[0].startOf('day'), values[1].endOf('day')]);
            setPage(1);
        }
    };

    return (
        <Flex vertical gap={20} className="p-4 md:p-6">
            <Flex vertical gap={4}>
                <Typography.Title level={3} className="!mb-0 !font-bold">
                    Virtual Account Statement
                </Typography.Title>
                <Typography.Text className="text-gray-500">
                    View your virtual account summary and recent statement entries
                </Typography.Text>
            </Flex>

            {/* Balance card */}
            <Card className="rounded-xl !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)]" bordered={false}>
                <Flex justify="space-between" align="center" wrap="wrap" gap={16}>
                    <Flex vertical gap={6}>
                        <Typography.Text className="text-xs font-medium uppercase tracking-[0.08em] text-[#667085]">
                            Available Balance
                        </Typography.Text>
                        {isBalanceLoading ? (
                            <Skeleton.Input active size="large" style={{ width: 180 }} />
                        ) : (
                            <Typography.Text className="text-[28px] font-semibold text-[#1F2A44]">
                                {balance != null ? formatAmount(balance) : '—'}
                            </Typography.Text>
                        )}
                        {!isBalanceLoading && virtualAccountNumber && (
                            <Typography.Text className="text-sm text-[#667085]">
                                {accountName ?? ''}{accountName && virtualAccountNumber ? ' · ' : ''}{virtualAccountNumber}
                                {ifsc ? ` · ${ifsc}` : ''}
                            </Typography.Text>
                        )}
                    </Flex>

                    <Button type="primary" danger onClick={() => setIsDetailsModalOpen(true)}>
                        View Account Details
                    </Button>
                </Flex>
            </Card>

            <Tabs
                defaultActiveKey="statement"
                items={[
                    {
                        key: 'statement',
                        label: 'Statement',
                        children: (
                            <VirtualAccountStatementTab
                                isLoading={isLoading}
                                rows={rows}
                                page={page}
                                dateRange={dateRange}
                                onPageChange={setPage}
                                onDateRangeChange={handleDateRangeChange}
                            />
                        ),
                    },
                    // {
                    //     key: 'settlement-requests',
                    //     label: 'Settlement Requests',
                        
                    //     children: (
                    //         <VirtualAccountSettlementRequestsTab
                    //             requests={requests}
                    //             isLoading={isRequestsLoading}
                    //             onCreateRequest={() => setIsRequestModalOpen(true)}
                    //         />
                    //     ),
                    // },
                ]}
            />

            <SettlementRequestDrawer
                open={isRequestModalOpen}
                width={screens.sm ? 460 : '100%'}
                onClose={handleCloseRequestModal}
                onSubmit={handleCreateRequest}
                loading={isSubmitting}
                amount={requestAmount}
                onAmountChange={value => {
                    setRequestAmount(value);
                    if (!value || value <= 0) {
                        setAmountError('Amount must be greater than ₹0');
                    } else if (balance != null && value > balance) {
                        setAmountError(
                            `Amount cannot exceed your available balance of ${formatAmount(balance)}`,
                        );
                    } else {
                        setAmountError('');
                    }
                }}
                amountError={amountError}
                remarks={requestRemarks}
                onRemarksChange={value => setRequestRemarks(value)}
                remarksError=""
            />

            <VirtualAccountDetailsModal
                open={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                accountDetails={
                    virtualAccountNumber
                        ? { accountName, virtualAccountNumber, ifsc }
                        : accountDetails
                }
            />
        </Flex>
    );
};

export default VirtualAccountStatement;
