import React, { useRef, useState } from 'react';

import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Flex, Tag, Typography } from 'antd';

import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import OtpModal from '@components/molecular/modals/OtpModal';

import AddDomesticAccount from './AddDomesticAccount';
import BankAccountsSkeleton from './BankAccountsSkeleton';
import BankCard from './BankCard';
import EmptyAccounts from './EmptyAccounts';
import useDomesticAccounts from '../../hooks/manageBankAccounts/useDomesticAccounts';
import { DomesticAccount } from '../../types/ManageBankAccounts';

interface DomesticAccountsProps {
    openAddForm?: boolean;
}

const DomesticAccounts: React.FC<DomesticAccountsProps> = ({ openAddForm = false }) => {
    const {
        accounts,
        isLoading,
        addDomesticAccount,
        editDomesticAccount,
        deleteDomesticAccount,
        setAsPrimary,
        sendOtpForBankAccount,
    } = useDomesticAccounts();

    const [isAdding, setIsAdding] = useState(openAddForm);
    const [editingAccount, setEditingAccount] = useState<DomesticAccount | null>(null);

    // Delete flow
    const [deletingAccount, setDeletingAccount] = useState<DomesticAccount | null>(null);
    const pendingDeleteRef = useRef<DomesticAccount | null>(null);
    const [isDeleteOtpOpen, setIsDeleteOtpOpen] = useState(false);
    const [isSendingDeleteOtp, setIsSendingDeleteOtp] = useState(false);

    // Set primary flow
    const pendingPrimaryRef = useRef<DomesticAccount | null>(null);
    const [isPrimaryOtpOpen, setIsPrimaryOtpOpen] = useState(false);
    const [isSendingPrimaryOtp, setIsSendingPrimaryOtp] = useState(false);

    // ── Delete handlers ──────────────────────────────────────────────
    const handleDeleteConfirm = async () => {
        if (!deletingAccount) return;
        pendingDeleteRef.current = deletingAccount;
        setIsSendingDeleteOtp(true);
        const sent = await sendOtpForBankAccount(
            pendingDeleteRef.current.accountNumber,
            String(pendingDeleteRef.current.id),
            'delete'
        );
        setIsSendingDeleteOtp(false);
        setDeletingAccount(null);
        if (sent) {
            setIsDeleteOtpOpen(true);
        } else {
            pendingDeleteRef.current = null;
        }
    };

    const handleDeleteOtpVerify = async (otp: string) => {
        const account = pendingDeleteRef.current;
        if (!account) return;
        const success = await deleteDomesticAccount(String(account.id), otp);
        if (success) {
            setIsDeleteOtpOpen(false);
            pendingDeleteRef.current = null;
        }
    };

    const handleDeleteOtpCancel = () => {
        setIsDeleteOtpOpen(false);
        pendingDeleteRef.current = null;
    };

    const handleDeleteOtpResend = async () => {
        const account = pendingDeleteRef.current;
        if (!account) return;
        await sendOtpForBankAccount(account.accountNumber, String(account.id), 'delete');
    };

    // ── Set primary handlers ─────────────────────────────────────────
    const handleSetPrimaryClick = async (account: DomesticAccount) => {
        pendingPrimaryRef.current = account;
        setIsSendingPrimaryOtp(true);
        const sent = await sendOtpForBankAccount(account.accountNumber, String(account.id));
        setIsSendingPrimaryOtp(false);
        if (sent) {
            setIsPrimaryOtpOpen(true);
        } else {
            pendingPrimaryRef.current = null;
        }
    };

    const handlePrimaryOtpVerify = async (otp: string) => {
        const account = pendingPrimaryRef.current;
        if (!account) return;
        const success = await setAsPrimary(String(account.id), otp);
        if (success) {
            setIsPrimaryOtpOpen(false);
            pendingPrimaryRef.current = null;
        }
    };

    const handlePrimaryOtpCancel = () => {
        setIsPrimaryOtpOpen(false);
        pendingPrimaryRef.current = null;
    };

    const handlePrimaryOtpResend = async () => {
        const account = pendingPrimaryRef.current;
        if (!account) return;
        await sendOtpForBankAccount(account.accountNumber, String(account.id));
    };

    if (isAdding) {
        return (
            <AddDomesticAccount
                onCancel={() => setIsAdding(false)}
                onSubmit={(values, otp) =>
                    addDomesticAccount(values, otp ?? '', () => setIsAdding(false))
                }
                isLoading={isLoading}
                sendOtp={sendOtpForBankAccount}
            />
        );
    }

    if (editingAccount) {
        return (
            <AddDomesticAccount
                onCancel={() => setEditingAccount(null)}
                onSubmit={(values, otp) =>
                    editDomesticAccount(String(editingAccount.id), values, otp ?? '', () =>
                        setEditingAccount(null)
                    )
                }
                isLoading={isLoading}
                defaultValues={editingAccount}
                sendOtp={(accountNumber, selectedId) =>
                    sendOtpForBankAccount(accountNumber, selectedId)
                }
            />
        );
    }

    return (
        <>
            <Flex vertical gap={16}>
                <Flex
                    vertical
                    gap={12}
                    className="md:flex-row md:items-center md:justify-between"
                >
                    <Typography.Text className="text-sm text-[#6A7282]">
                        Manage your domestic bank accounts for INR transactions
                    </Typography.Text>
                    <Button
                        type="primary"
                        danger
                        icon={<PlusOutlined />}
                        className="h-9 w-full md:w-auto px-4 text-sm font-medium rounded-lg"
                        onClick={() => setIsAdding(true)}
                    >
                        Add Domestic Account
                    </Button>
                </Flex>

                {isLoading && <BankAccountsSkeleton />}
                {!isLoading && accounts.length === 0 && <EmptyAccounts />}
                {!isLoading && accounts.length > 0 && (
                    <Flex vertical gap={12}>
                        {accounts.map(account => (
                            <BankCard
                                key={account.id}
                                name={account.accountHolderName}
                                badge={
                                    account.default === 1 ? (
                                        <Tag
                                            color="success"
                                            bordered={false}
                                            className="rounded-full text-xs font-medium px-3"
                                        >
                                            Primary
                                        </Tag>
                                    ) : undefined
                                }
                                actions={
                                    account.default === 1 ? (
                                        <Button
                                            type="link"
                                            danger
                                            icon={<EditOutlined />}
                                            className="p-0 h-auto text-sm font-medium"
                                            onClick={() => setEditingAccount(account)}
                                        />
                                    ) : (
                                        <Flex
                                            align="center"
                                            gap={12}
                                            wrap="wrap"
                                            justify="flex-end"
                                        >
                                            <Button
                                                className="h-8 w-full sm:w-auto px-4 text-sm border-[#E4E4E7] text-[#344054] rounded-lg"
                                                loading={
                                                    isSendingPrimaryOtp &&
                                                    pendingPrimaryRef.current?.id === account.id
                                                }
                                                onClick={() => handleSetPrimaryClick(account)}
                                            >
                                                Set as Primary
                                            </Button>
                                            <EditOutlined
                                                className="text-[#FF4F4F] cursor-pointer hover:text-red-500 text-base"
                                                onClick={() => setEditingAccount(account)}
                                            />
                                            <DeleteOutlined
                                                className="text-[#FF4F4F] cursor-pointer hover:text-red-500 text-base"
                                                onClick={() => setDeletingAccount(account)}
                                            />
                                        </Flex>
                                    )
                                }
                                fields={[
                                    { label: 'Bank Name', value: account.bankName },
                                    { label: 'Account Number', value: account.accountNumber },
                                    { label: 'IFSC Code', value: account.ifscCode },
                                    { label: 'Account Type', value: account.accountType },
                                    { label: 'Branch Name', value: account.bankBranch },
                                ]}
                            />
                        ))}
                    </Flex>
                )}
            </Flex>

            {/* Delete confirmation */}
            <ConfirmationModal
                isOpen={!!deletingAccount}
                handleCancel={() => setDeletingAccount(null)}
                handleSubmit={handleDeleteConfirm}
                title={`Delete ${deletingAccount?.accountHolderName ?? 'this account'}?`}
                description="This action cannot be undone."
                isLoading={isSendingDeleteOtp}
            />

            {/* Delete OTP */}
            <OtpModal
                isOpen={isDeleteOtpOpen}
                title="Verify Delete Account"
                handleCancel={handleDeleteOtpCancel}
                handleSubmit={handleDeleteOtpVerify}
                isLoading={isLoading}
                onResend={handleDeleteOtpResend}
                isOtpSending={isSendingDeleteOtp}
            />

            {/* Set primary OTP */}
            <OtpModal
                isOpen={isPrimaryOtpOpen}
                title="Verify Set as Primary"
                handleCancel={handlePrimaryOtpCancel}
                handleSubmit={handlePrimaryOtpVerify}
                isLoading={isLoading}
                onResend={handlePrimaryOtpResend}
                isOtpSending={isSendingPrimaryOtp}
            />
        </>
    );
};

export default React.memo(DomesticAccounts);
