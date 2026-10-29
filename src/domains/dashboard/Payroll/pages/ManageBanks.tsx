import { useMemo, useState } from 'react';

import { BankOutlined, CreditCardOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Flex, Tabs, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import { paths } from '@routes/paths';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import BankAccountModal from '../components/ManageBanks/BankAccountModal';
import { RED, VALUE_COLOR, LABEL_COLOR } from '../components/ManageBanks/constants';
import DomesticBankTab from '../components/ManageBanks/DomesticBankTab';
import VirtualAccountTab from '../components/ManageBanks/VirtualAccountTab';
import useGetOrganizationSetting from '../hooks/OrganizationSettings/useGetOrganizationDetailsApi';
import useOrganizationSettingsApi from '../hooks/OrganizationSettings/useOrganizationSettingsApi';
import useSalaryRolloutBanksApi from '../hooks/useSalaryRolloutBanksApi';
import { ManageBankDisplayAccount, SalaryRolloutBankPayload } from '../types/bankAccount';

const { Text } = Typography;
const PAYROLL_SETTINGS_BANK_ID = 'payroll-settings-bank-details';
const getBankDuplicateKey = (accountNumber?: string, ifscCode?: string) =>
    `${String(accountNumber || '').trim()}::${String(ifscCode || '').trim().toUpperCase()}`;

const ManageBanks = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { id } = useAppSelector((state) => state.reducer.auth);
    const { bankDetails } = useAppSelector((state) => state.reducer.orgSettings);
    const { isLoading: isSettingsLoading } = useGetOrganizationSetting();
    const { updateBankDetails, isLoading: isBankDetailsSaving } = useOrganizationSettingsApi();
    const {
        accounts: manageBankAccounts,
        isLoading: isManageBanksLoading,
        add,
        update,
        remove,
    } = useSalaryRolloutBanksApi();

    const [activeTab, setActiveTab] = useState<'domestic' | 'virtual'>('domestic');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState<ManageBankDisplayAccount | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const payrollSettingsBankAccount = useMemo<ManageBankDisplayAccount | null>(() => {
        if (!bankDetails?.accountNumber) return null;

        return {
            _id: PAYROLL_SETTINGS_BANK_ID,
            corporateUser: String(id ?? ''),
            accountHolderName: bankDetails.accountHolderName || '',
            bankName: bankDetails.bankName || '',
            accountNumber: bankDetails.accountNumber || '',
            ifscCode: bankDetails.ifscCode || '',
            accountType: 'current',
            branch: bankDetails.branchAddress || null,
            currency: 'INR',
            isPrimary: true,
            createdAt: '',
            updatedAt: '',
            accountSource: 'PAYROLL_SETTINGS',
        };
    }, [bankDetails, id]);

    const accounts = useMemo<ManageBankDisplayAccount[]>(() => {
        const seenBankKeys = new Set<string>();
        if (payrollSettingsBankAccount) {
            seenBankKeys.add(getBankDuplicateKey(
                payrollSettingsBankAccount.accountNumber,
                payrollSettingsBankAccount.ifscCode
            ));
        }

        const normalizedManageBanks = manageBankAccounts.map((account) => ({
            ...account,
            accountSource: 'MANAGE_BANKS' as const,
        })).filter((account) => {
            const key = getBankDuplicateKey(account.accountNumber, account.ifscCode);
            if (seenBankKeys.has(key)) return false;
            seenBankKeys.add(key);
            return true;
        });

        if (!payrollSettingsBankAccount) {
            return normalizedManageBanks;
        }

        return [payrollSettingsBankAccount, ...normalizedManageBanks];
    }, [manageBankAccounts, payrollSettingsBankAccount]);

    const isLoading = isSettingsLoading || isBankDetailsSaving || isManageBanksLoading;

    const handleCardClick = (accountId: string) =>
        setExpandedId((prev) => (prev === accountId ? null : accountId));

    const saveBankDetails = async (values: SalaryRolloutBankPayload) => {
        const ok = await updateBankDetails({
            accountHolderName: values.accountHolderName,
            bankName: values.bankName,
            accountNumber: values.accountNumber,
            ifscCode: values.ifscCode,
            branchAddress: values.branch || '',
        });
        return ok;
    };

    const hasDuplicateBankAccount = (values: SalaryRolloutBankPayload, currentAccountId?: string) => {
        const nextKey = getBankDuplicateKey(values.accountNumber, values.ifscCode);
        return accounts.some((account) => (
            account._id !== currentAccountId &&
            getBankDuplicateKey(account.accountNumber, account.ifscCode) === nextKey
        ));
    };

    const showDuplicateError = () => {
        dispatch(showToast({
            description: 'Bank account already exists',
            variant: 'error',
        }));
    };

    const handleAdd = async (values: SalaryRolloutBankPayload) => {
        if (hasDuplicateBankAccount(values)) {
            showDuplicateError();
            return;
        }
        const ok = await add(values);
        if (ok) setShowAddModal(false);
    };

    const handleUpdate = async (values: SalaryRolloutBankPayload) => {
        if (!editingAccount) return;
        if (hasDuplicateBankAccount(values, editingAccount._id)) {
            showDuplicateError();
            return;
        }
        const ok = editingAccount.accountSource === 'PAYROLL_SETTINGS'
            ? await saveBankDetails(values)
            : await update(editingAccount._id, values);
        if (ok) setEditingAccount(null);
    };

    const handleDelete = async () => {
        if (!deletingId) return;
        await remove(deletingId);
        setDeletingId(null);
        if (expandedId === deletingId) setExpandedId(null);
    };

    const handleViewAllTransactions = () => {
        navigate(`/${paths.payroll.index}/${paths.payroll.manageBanks}/${paths.payroll.manageBankTransactions}`);
    };

    return (
        <div style={{ padding: 'clamp(16px, 2vw, 32px)', maxWidth: 1600 }}>
            <Flex justify="space-between" align="flex-start" wrap="wrap" gap={16} style={{ marginBottom: 24 }}>
                <Flex vertical gap={4}>
                    <Text style={{ fontSize: 'clamp(20px, 1.6vw, 28px)', fontWeight: 700, color: VALUE_COLOR }}>
                        Manage Accounts
                    </Text>
                    <Text style={{ fontSize: 'clamp(12px, 0.9vw, 15px)', color: LABEL_COLOR }}>
                        View and manage your linked bank accounts
                    </Text>
                </Flex>
                {activeTab !== 'virtual' && (
                    <Button
                        icon={<PlusOutlined />}
                        onClick={() => setShowAddModal(true)}
                        style={{
                            height: 38,
                            borderRadius: 8,
                            background: RED,
                            borderColor: RED,
                            color: '#fff',
                            fontWeight: 500,
                            fontSize: 'clamp(12px, 0.88vw, 14px)',
                        }}
                    >
                        Add Bank Account
                    </Button>
                )}
            </Flex>

            <Tabs
                activeKey={activeTab}
                onChange={(key) => {
                    setActiveTab(key as 'domestic' | 'virtual');
                    setExpandedId(null);
                }}
                style={{ '--ant-color-primary': RED } as React.CSSProperties}
                tabBarStyle={{ marginBottom: 20 }}
                items={[
                    {
                        key: 'domestic',
                        label: (
                            <Flex align="center" gap={6}>
                                <BankOutlined />
                                <span style={{ fontSize: 'clamp(13px, 0.95vw, 15px)', fontWeight: 500 }}>
                                    Domestic Bank Accounts
                                </span>
                            </Flex>
                        ),
                        children: (
                            <DomesticBankTab
                                accounts={accounts}
                                isLoading={isLoading}
                                expandedId={expandedId}
                                onCardClick={handleCardClick}
                                onAdd={() => setShowAddModal(true)}
                                onEdit={setEditingAccount}
                                onDelete={setDeletingId}
                            />
                        ),
                    },
                    {
                        key: 'virtual',
                        label: (
                            <Flex align="center" gap={6}>
                                <CreditCardOutlined />
                                <span style={{ fontSize: 'clamp(13px, 0.95vw, 15px)', fontWeight: 500 }}>
                                    Virtual Accounts
                                </span>
                            </Flex>
                        ),
                        children: (
                            <VirtualAccountTab onViewAllTransactions={handleViewAllTransactions} />
                        ),
                    },
                ]}
            />

            <BankAccountModal
                open={showAddModal}
                mode="add"
                isLoading={isLoading}
                isBranchRequired={false}
                onClose={() => setShowAddModal(false)}
                onSubmit={handleAdd}
            />

            <BankAccountModal
                open={!!editingAccount}
                mode="edit"
                initial={editingAccount ?? undefined}
                isLoading={isLoading}
                isBranchRequired={editingAccount?.accountSource === 'PAYROLL_SETTINGS'}
                onClose={() => setEditingAccount(null)}
                onSubmit={handleUpdate}
            />

            <ConfirmationModal
                isOpen={!!deletingId}
                handleCancel={() => setDeletingId(null)}
                title="Delete Bank Account"
                description="Are you sure you want to delete this bank account? This action cannot be undone."
                handleSubmit={handleDelete}
                isLoading={isLoading}
            />
        </div>
    );
};

export default ManageBanks;
