import { useEffect, useState } from 'react';

import { Col, Flex, Row, Skeleton, Typography } from 'antd';

import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import { deleteVirtualAccount, updateVirtualAccount } from '@domains/dashboard/paymentLinks/api';
import useGetVirtualAccountBalance from '@domains/dashboard/paymentLinks/hooks/useGetVirtualAccountBalance';
import useGetVirtualAccountDetails from '@domains/dashboard/paymentLinks/hooks/useGetVirtualAccountDetails';
import useGetVirtualAccountStatement from '@domains/dashboard/paymentLinks/hooks/useGetVirtualAccountStatement';
import { usePaymentLinkOnboarding } from '@domains/dashboard/paymentLinks/hooks/usePaymentLinkOnboarding';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import AddRemoveFundsModal from './AddRemoveFundsModal';
import { LABEL_COLOR } from './constants';
import EditVirtualAccountModal from './EditVirtualAccountModal';
import VADetailCard from './VADetailCard';
import VARecentTransactions from './VARecentTransactions';
import VASummaryCard from './VASummaryCard';
import { removeFundsFromVirtualAccountApi } from '../../api/virtualAccount';

const { Text } = Typography;

interface VirtualAccountTabProps {
    onViewAllTransactions: () => void;
}

const VirtualAccountTab = ({ onViewAllTransactions }: VirtualAccountTabProps) => {
    const dispatch = useAppDispatch();
    const { id, role } = useAppSelector((state) => state.reducer.auth);

    const { isLoading: balLoading, balance, accountName, virtualAccountNumber, ifsc, fetchBalance } =
        useGetVirtualAccountBalance();
    const { rows, isLoading: stmtLoading, fetchStatement } = useGetVirtualAccountStatement();
    const { details, isLoading: detailsLoading, refetch: refetchDetails } = useGetVirtualAccountDetails();
    const { record: onboarding, fetchStatus } = usePaymentLinkOnboarding();

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    const [showEditVa, setShowEditVa] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showFundsModal, setShowFundsModal] = useState(false);
    const [isWithdrawing, setIsWithdrawing] = useState(false);

    const editInitialValues = {
        name: details?.name ?? '',
        emailAddress: details?.email ?? '',
        mobileNumber: details?.mobile ?? '',
        panNumber: details?.pan ?? '',
        address: details?.address ?? '',
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        const ok = await deleteVirtualAccount({ userId: id, userType: role });
        setIsDeleting(false);
        if (ok) {
            dispatch(showToast({ description: 'Virtual account deleted successfully', variant: 'success' }));
            setShowDeleteConfirm(false);
        }
    };

    const handleUpdate = async (values: typeof editInitialValues) => {
        setIsUpdating(true);
        const ok = await updateVirtualAccount({
            userId: id,
            userType: role,
            name: values.name,
            pan: values.panNumber,
            email: values.emailAddress || undefined,
            mobile: values.mobileNumber || undefined,
            address: values.address || undefined,
        });
        setIsUpdating(false);
        if (ok) {
            dispatch(showToast({ description: 'Virtual account updated successfully', variant: 'success' }));
            setShowEditVa(false);
            refetchDetails();
            fetchBalance();
        }
    };

    const handleWithdrawFunds = async ({
        amount,
        transferType,
        remarks,
    }: {
        amount: number;
        transferType: 'IMPS';
        remarks: string;
    }) => {
        setIsWithdrawing(true);
        const result = await removeFundsFromVirtualAccountApi({
            userId: id,
            userType: role,
            amount,
            transferType,
            remarks,
        });
        setIsWithdrawing(false);

        if (!result) {
            return false;
        }

        dispatch(showToast({
            description: 'Remove funds request initiated successfully',
            variant: 'success',
        }));
        setShowFundsModal(false);
        fetchBalance();
        fetchStatement();
        return true;
    };

    if ((balLoading || detailsLoading) && !virtualAccountNumber) {
        return <Skeleton active paragraph={{ rows: 6 }} />;
    }

    if (!virtualAccountNumber && !balLoading) {
        return (
            <Flex justify="center" align="center" style={{ padding: '60px 0' }}>
                <Text style={{ color: LABEL_COLOR }}>No virtual account found.</Text>
            </Flex>
        );
    }

    return (
        <>
            <VASummaryCard accountName={accountName} virtualAccountNumber={virtualAccountNumber} />

            <Row gutter={[24, 24]} align="top" wrap>
                <Col xs={24} xl={16} style={{ minWidth: 0 }}>
                    <VADetailCard
                        accountName={accountName}
                        activatedAt={details?.activatedAt ?? null}
                        balance={balance}
                        balLoading={balLoading}
                        fetchBalance={fetchBalance}
                        virtualAccountNumber={virtualAccountNumber}
                        ifsc={ifsc}
                        details={details}
                        onEdit={() => setShowEditVa(true)}
                        onDelete={() => setShowDeleteConfirm(true)}
                        onManageFunds={() => setShowFundsModal(true)}
                    />
                </Col>
                <VARecentTransactions
                    rows={rows.slice(0, 4)}
                    isLoading={stmtLoading}
                    onViewAll={onViewAllTransactions}
                />
            </Row>

            <ConfirmationModal
                isOpen={showDeleteConfirm}
                handleCancel={() => setShowDeleteConfirm(false)}
                title="Delete Virtual Account"
                description="Are you sure you want to delete this virtual account? This will also affect your Payment Links and Payouts."
                handleSubmit={handleDelete}
                isLoading={isDeleting}
            />

            <EditVirtualAccountModal
                open={showEditVa}
                onClose={() => setShowEditVa(false)}
                initialValues={editInitialValues}
                onSubmit={handleUpdate}
                isLoading={isUpdating}
            />

            <AddRemoveFundsModal
                open={showFundsModal}
                onClose={() => setShowFundsModal(false)}
                accountHolderName={accountName}
                virtualAccountNumber={virtualAccountNumber}
                ifsc={ifsc}
                availableBalance={balance}
                isWithdrawing={isWithdrawing}
                onWithdraw={handleWithdrawFunds}
                bankDetails={{
                    accountHolderName: onboarding?.businessName ?? null,
                    bankName: onboarding?.bankName ?? null,
                    accountNumber: onboarding?.accountNumber ?? null,
                    ifscCode: onboarding?.ifsc ?? null,
                }}
            />
        </>
    );
};

export default VirtualAccountTab;
