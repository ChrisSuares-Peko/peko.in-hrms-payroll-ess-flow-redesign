
import React, { useEffect, useRef, useState } from 'react';

import { ArrowLeftOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Col, Flex, Form, Modal, Row, Skeleton, Space, Tabs, Tag, Typography } from 'antd';
import { Formik, FormikProps } from 'formik';

import SelectInput from '@src/components/atomic/inputs/SelectInput';
import TextInput from '@src/components/atomic/inputs/TextInput';
import ConfirmationModal from '@src/components/molecular/modals/ConfirmationModal';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import VirtualAccountDetailsDrawer from './VirtualAccountDetailsDrawer';
import bankIcon from '../assets/bankIcons/bank.svg';
import globalIcon from '../assets/bankIcons/global.svg';
import useAddDomesticBankAccountApi from '../hooks/useAddDomesticBankAccountApi';
import useDeleteDomesticBankAccountApi from '../hooks/useDeleteDomesticBankAccountApi';
import useEditDomesticBankAccountApi from '../hooks/useEditDomesticBankAccountApi';
import useGetDomesticBankAccountsApi from '../hooks/useGetDomesticBankAccountsApi';
import useNupayMerchants from '../hooks/useNupayMerchants';
import useNupayWalletBalance from '../hooks/useNupayWalletBalance';
import { usePaymentLinkOnboarding } from '../hooks/usePaymentLinkOnboarding';
import useSetPrimaryBankAccountApi from '../hooks/useSetPrimaryBankAccountApi';
import { addAccountValidationSchema } from '../schema/manageBankAccountsModal';
import { AddDomesticBankAccountPayload, DomesticBankAccount } from '../types';
import { currencyOptions, accountTypeOptions, addFormLabels, addFormSubtitles } from '../utils/mockData';

const { Text, Title } = Typography;

// ─── Validation & Initial Values ─────────────────────────────────────────────

const addAccountInitialValues = {
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    currency: '',
    accountType: '',
    branchName: '',
};



// ─── Account Card ─────────────────────────────────────────────────────────────

interface AccountCardProps {
    account: DomesticBankAccount;
    onEdit: (account: DomesticBankAccount) => void;
    onDelete: (id: number) => void;
    onSetPrimary: (id: number) => void;
    setPrimaryLoading: boolean;
    readOnly?: boolean;
    suppressPrimary?: boolean;
}

const AccountCard: React.FC<AccountCardProps> = ({ account, onEdit, onDelete, onSetPrimary, setPrimaryLoading, readOnly, suppressPrimary }) => (
    <Card
        style={{ borderRadius: 12, borderColor: '#e5e7eb' }}
        styles={{ body: { padding: '14px 16px' } }}
    >
        <Flex justify="space-between" align="center">
            <Flex gap={8} align="center">
                <Text strong style={{ fontSize: 14 }}>
                    {account.accountHolderName ?? account.name}
                </Text>
                {account.isPrimary && !suppressPrimary && (
                    <Tag color="green" style={{ margin: 0, borderRadius: 8 }}>
                        Primary
                    </Tag>
                )}
            </Flex>
            {!readOnly && (
                <Flex gap={4} align="center">
                    {!account.isPrimary && !suppressPrimary && (
                        <Button
                            size="small"
                            style={{ borderRadius: 6, fontSize: 12 }}
                            loading={setPrimaryLoading}
                            onClick={() => onSetPrimary(account.id)}
                        >
                            Set as Primary
                        </Button>
                    )}
                    <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined style={{ color: '#FF4D4F' }} />}
                        onClick={() => onEdit(account)}
                    />
                    <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined style={{ color: '#FF4D4F' }} />}
                        onClick={() => onDelete(account.id)}
                    />
                </Flex>
            )}
        </Flex>

        <Row
            gutter={[12, 8]}
            style={{ marginTop: 10, background: '#f9fafb', borderRadius: 8, padding: '10px 12px' }}
        >
            {account.bankName && (
                <Col span={12}>
                    <Text type="secondary" style={{ fontSize: 11 }}>Bank Name</Text>
                    <br />
                    <Text style={{ fontSize: 12 }}>{account.bankName}</Text>
                </Col>
            )}
            <Col span={12}>
                <Text type="secondary" style={{ fontSize: 11 }}>Account Number</Text>
                <br />
                <Text style={{ fontSize: 12 }}>{account.accountNumber}</Text>
            </Col>
            <Col span={12}>
                <Text type="secondary" style={{ fontSize: 11 }}>IFSC Code</Text>
                <br />
                <Text style={{ fontSize: 12 }}>{account.ifscCode}</Text>
            </Col>
            <Col span={12}>
                <Text type="secondary" style={{ fontSize: 11 }}>Currency</Text>
                <br />
                <Text style={{ fontSize: 12 }}>{account.currency}</Text>
            </Col>
            {account.branchName && (
                <Col span={12}>
                    <Text type="secondary" style={{ fontSize: 11 }}>Branch Name</Text>
                    <br />
                    <Text style={{ fontSize: 12 }}>{account.branchName}</Text>
                </Col>
            )}
        </Row>
    </Card>
);

// ─── Add / Edit Account Form ──────────────────────────────────────────────────

interface AddAccountFormProps {
    activeTab: string;
    editData?: DomesticBankAccount;
    isLoading?: boolean;
    onBack: () => void;
    onSubmit: (payload: AddDomesticBankAccountPayload) => Promise<void>;
}

const AddAccountForm: React.FC<AddAccountFormProps> = ({ activeTab, editData, isLoading, onBack, onSubmit }) => {
    const formikRef = useRef<FormikProps<typeof addAccountInitialValues>>(null);
    const isEditMode = !!editData;

    const initialValues = editData
        ? {
              accountHolderName: editData.accountHolderName ?? editData.name ?? '',
              bankName: editData.bankName ?? '',
              accountNumber: editData.accountNumber,
              ifscCode: editData.ifscCode,
              currency: editData.currency,
              accountType: editData.accountType?.toLowerCase() ?? '',
              branchName: editData.branchName ?? '',
          }
        : addAccountInitialValues;

    const handleFormSubmit = async (values: typeof addAccountInitialValues) => {
        await onSubmit({
            accountHolderName: values.accountHolderName,
            bankName: values.bankName,
            accountNumber: values.accountNumber,
            ifscCode: values.ifscCode,
            currency: values.currency,
            accountType: values.accountType || undefined,
            branchName: values.branchName || undefined,
        });
    };

    return (
        <>
            <Flex align="center" gap={10} style={{ marginBottom: 16 }}>
                <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack} size="small" />
                <Space direction="vertical" size={2}>
                    <Title level={5} className="m-0">
                        {isEditMode ? 'Edit Domestic Account' : addFormLabels[activeTab]}
                    </Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {isEditMode ? 'Update your bank account details' : addFormSubtitles[activeTab]}
                    </Text>
                </Space>
            </Flex>

            <Formik
                innerRef={formikRef}
                enableReinitialize
                initialValues={initialValues}
                validationSchema={addAccountValidationSchema}
                onSubmit={handleFormSubmit}
            >
                <Form layout="vertical" className="w-full">
                    <Row gutter={12}>
                        <Col span={12}>
                            <TextInput
                                name="accountHolderName"
                                label="Account Holder Name"
                                placeholder="Enter account holder name"
                                type="text"
                                isRequired
                                allowAlphabetsAndSpaceOnly
                                maxLength={50}
                            />
                        </Col>
                        <Col span={12}>
                            <TextInput
                                name="bankName"
                                label="Bank Name"
                                placeholder="e.g. HDFC Bank"
                                type="text"
                                isRequired
                                maxLength={50}
                                allowAlphabetsAndSpaceOnly
                            />
                        </Col>
                    </Row>

                    <Row gutter={12}>
                        <Col span={12}>
                            <TextInput
                                name="accountNumber"
                                label="Account Number"
                                placeholder="Enter account number"
                                type="text"
                                isRequired
                                allowNumbersOnly
                                maxLength={18}
                            />
                        </Col>
                        <Col span={12}>
                            <SelectInput
                                name="currency"
                                label="Currency"
                                placeholder="Select currency"
                                isRequired
                                options={currencyOptions}
                            />
                        </Col>
                    </Row>

                    <Row gutter={12}>
                        <Col span={12}>
                            <TextInput
                                name="ifscCode"
                                label="IFSC Code"
                                placeholder="e.g. HDFC0001234"
                                type="text"
                                isRequired
                                maxLength={11}
                                allowUpperCaseOnly
                                allowAlphabetsAndNumbersOnly
                            />
                        </Col>
                        <Col span={12}>
                            <SelectInput
                                name="accountType"
                                label="Account Type"
                                placeholder="Select type"
                                isRequired
                                options={accountTypeOptions}
                            />
                        </Col>
                    </Row>

                    <Row gutter={12}>
                        <Col span={12}>
                            <TextInput
                                name="branchName"
                                label="Branch Name"
                                placeholder="Enter branch name (optional)"
                                type="text"
                                allowAlphabetsAndSpaceOnly
                                maxLength={50}
                            />
                        </Col>
                    </Row>
                </Form>
            </Formik>

            <Flex justify="flex-end" gap={8} style={{ marginTop: 8 }}>
                <Button onClick={onBack} style={{ borderRadius: 8 }}>
                    Cancel
                </Button>
                <Button
                    type="primary"
                    loading={isLoading}
                    onClick={() => formikRef.current?.submitForm()}
                    style={{ borderRadius: 8, background: '#FF4D4F', borderColor: '#FF4D4F' }}
                >
                    {isEditMode ? 'Save Changes' : 'Add Account'}
                </Button>
            </Flex>
        </>
    );
};

// ─── Main Modal ───────────────────────────────────────────────────────────────

interface ManageBankAccountsModalProps {
    visible: boolean;
    onClose: () => void;
}

const ManageBankAccountsModal: React.FC<ManageBankAccountsModalProps> = ({ visible, onClose }) => {
    const dispatch = useAppDispatch();
    const [activeTab, setActiveTab] = useState('domestic');
    const [isAddingAccount, setIsAddingAccount] = useState(false);
    const [editAccount, setEditAccount] = useState<DomesticBankAccount | undefined>(undefined);
    const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
    const [accountToDelete, setAccountToDelete] = useState<number | null>(null);

    const [loadFundsOpen, setLoadFundsOpen] = useState(false);

    const { getDomesticBankAccounts, data: domesticAccounts, isLoading } = useGetDomesticBankAccountsApi();
    const { addDomesticBankAccount, isLoading: addLoading } = useAddDomesticBankAccountApi();
    const { editDomesticBankAccount, isLoading: editLoading } = useEditDomesticBankAccountApi();
    const { deleteBankAccount, isLoading: deleteLoading } = useDeleteDomesticBankAccountApi();
    const { setPrimaryBankAccount, isLoading: setPrimaryLoading } = useSetPrimaryBankAccountApi();
    const { fetchStatus, record: onboardingRecord, loading: onboardingLoading } = usePaymentLinkOnboarding();
    const { statusData: nupayStatus } = useNupayMerchants();
    const { balance, isLoading: balanceLoading, fetchBalance, ifsc: walletVaIfsc } = useNupayWalletBalance();

    const virtualAccountNumber = nupayStatus?.vaNumber ?? null;
    const vaIfsc = nupayStatus?.vaIfsc ?? walletVaIfsc ?? null;

    useEffect(() => {
        if (visible) {
            getDomesticBankAccounts();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    useEffect(() => {
        if (!visible) return;
        fetchStatus();
        if (activeTab === 'virtual') fetchBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, activeTab]);

    const handleTabChange = (key: string) => {
        setActiveTab(key);
        setIsAddingAccount(false);
        setEditAccount(undefined);
    };

    const handleClose = () => {
        setActiveTab('domestic');
        setIsAddingAccount(false);
        setEditAccount(undefined);
        onClose();
    };

    const handleAdd = async (payload: AddDomesticBankAccountPayload) => {
        const res = await addDomesticBankAccount(payload);
        if (res) {
            setIsAddingAccount(false);
            dispatch(showToast({ description: 'Bank account added successfully', variant: 'success' }));
            getDomesticBankAccounts();
        }
    };

    const handleEdit = async (payload: AddDomesticBankAccountPayload) => {
        if (!editAccount) return;
        const res = await editDomesticBankAccount(editAccount.id, payload);
        if (res) {
            setEditAccount(undefined);
            setIsAddingAccount(false);
            dispatch(showToast({ description: 'Bank account updated successfully', variant: 'success' }));
            getDomesticBankAccounts();
        }
    };

    const handleSetPrimary = async (accountId: number) => {
        const res = await setPrimaryBankAccount(accountId);
        if (res) {
            dispatch(showToast({ description: 'Primary account updated successfully', variant: 'success' }));
            getDomesticBankAccounts();
        }
    };

    const showFormView = isAddingAccount || !!editAccount;

    const onboardingPrimaryAccount: DomesticBankAccount | null =
        onboardingRecord && onboardingRecord.status === 'active' && onboardingRecord.accountNumber
            ? {
                  id: -1, // sentinel; never used (read-only card)
                  accountHolderName: onboardingRecord.businessName,
                  bankName: onboardingRecord.bankName ?? undefined,
                  accountNumber: onboardingRecord.accountNumber,
                  ifscCode: onboardingRecord.ifsc ?? '', // onboarding field is `ifsc`, not `ifscCode`
                  currency: 'INR', // this is the INR/domestic tab
                  isPrimary: true,
              }
            : null;

    const realDomesticAccounts = onboardingPrimaryAccount
        ? domesticAccounts.filter(a => a.accountNumber !== onboardingPrimaryAccount.accountNumber)
        : domesticAccounts;

    const redIconFilter = 'brightness(0) saturate(100%) invert(32%) sepia(80%) saturate(2878%) hue-rotate(328deg) brightness(100%) contrast(110%)';

    const tabDescription = activeTab === 'domestic'
        ? 'Manage your domestic bank accounts for INR transactions'
        : 'Manage your virtual accounts for automated collections';

    const renderDomesticTab = () => {
        if (isLoading || onboardingLoading) {
            return (
                <Space direction="vertical" size={12} className="w-full">
                    {[1, 2].map(i => (
                        <Card key={i} style={{ borderRadius: 12 }}>
                            <Skeleton active />
                        </Card>
                    ))}
                </Space>
            );
        }
        return (
            <Space direction="vertical" size={12} className="w-full">
                {onboardingPrimaryAccount && (
                    <AccountCard
                        key="onboarding-primary"
                        account={onboardingPrimaryAccount}
                        readOnly
                        onEdit={() => {}}
                        onDelete={() => {}}
                        onSetPrimary={() => {}}
                        setPrimaryLoading={false}
                    />
                )}
                {realDomesticAccounts.map(account => (
                    <AccountCard
                        key={account.id}
                        account={account}
                        suppressPrimary={!!onboardingPrimaryAccount}
                        onEdit={acc => { setEditAccount(acc); }}
                        onDelete={id => { setAccountToDelete(id); setConfirmDeleteVisible(true); }}
                        onSetPrimary={handleSetPrimary}
                        setPrimaryLoading={setPrimaryLoading}
                    />
                ))}
                {realDomesticAccounts.length === 0 && !onboardingPrimaryAccount && (
                    <Text type="secondary" style={{ textAlign: 'center', display: 'block', padding: 24 }}>
                        No domestic accounts found.
                    </Text>
                )}
            </Space>
        );
    };

    const getBalanceText = () => {
        if (balanceLoading) return '...';
        if (balance !== null) return `₹${balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        return '—';
    };

    const renderVirtualTab = () => {
        if (balanceLoading) {
            return (
                <Card style={{ borderRadius: 12 }}>
                    <Skeleton active />
                </Card>
            );
        }
        if (!virtualAccountNumber) {
            return (
                <Text type="secondary" style={{ textAlign: 'center', display: 'block', padding: 24 }}>
                    No virtual account found.
                </Text>
            );
        }
        return (
            <Card style={{ borderRadius: 12, borderColor: '#e5e7eb' }} styles={{ body: { padding: '16px' } }}>
                <Flex justify="space-between" align="flex-start" style={{ marginBottom: 10 }}>
                    <Flex vertical gap={4}>
                        <Flex align="center" gap={8} wrap="wrap">
                            <Text strong style={{ fontSize: 14 }}>Virtual Account</Text>
                            <Tag color="green" style={{ borderRadius: 8, margin: 0 }}>Active</Tag>
                            <Tag color="blue" style={{ borderRadius: 8, margin: 0 }}>KYC Done</Tag>
                            <Tag color="orange" style={{ borderRadius: 8, margin: 0 }}>Payment Ins</Tag>
                        </Flex>
                    </Flex>
                    <Flex vertical align="flex-end" gap={2}>
                        <Text type="secondary" style={{ fontSize: 11 }}>Balance</Text>
                        <Text strong style={{ fontSize: 15, color: '#43b75d' }}>
                            {getBalanceText()}
                        </Text>
                    </Flex>
                </Flex>

                <Row gutter={[12, 8]} style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
                    <Col span={12}>
                        <Text type="secondary" style={{ fontSize: 11 }}>Account Number</Text>
                        <br />
                        <Text style={{ fontSize: 12 }}>{virtualAccountNumber}</Text>
                    </Col>
                    {vaIfsc && (
                        <Col span={12}>
                            <Text type="secondary" style={{ fontSize: 11 }}>IFSC Code</Text>
                            <br />
                            <Text style={{ fontSize: 12 }}>{vaIfsc}</Text>
                        </Col>
                    )}
                </Row>

                <Button
                    type="primary"
                    block
                    style={{ borderRadius: 8, background: '#FF4D4F', borderColor: '#FF4D4F' }}
                    onClick={() => setLoadFundsOpen(true)}
                >
                    View full details &amp; manage
                </Button>
            </Card>
        );
    };

    const tabItems = [
        {
            key: 'domestic',
            label: (
                <Flex align="center" gap={6}>
                    {/* bank.svg is already red — grey it out when inactive */}
                    <img src={bankIcon} alt="" style={{ width: 16, height: 16, filter: activeTab === 'domestic' ? 'none' : 'grayscale(1)' }} />
                    Domestic Accounts
                </Flex>
            ),
        },
        {
            key: 'virtual',
            label: (
                <Flex align="center" gap={6}>
                    {/* global.svg is grey by default — apply red filter when active */}
                    <img src={globalIcon} alt="" style={{ width: 16, height: 16, filter: activeTab === 'virtual' ? redIconFilter : 'none' }} />
                    Virtual Accounts
                </Flex>
            ),
        },
    ];

    return (
        <>
            <Modal
                open={visible && !loadFundsOpen}
                onCancel={handleClose}
                footer={null}
                centered
                width={900}
                modalRender={(node) => (
                    <div style={{ borderRadius: 16, overflow: 'hidden' }}>{node}</div>
                )}
                title={
                    <Title level={4} className="m-0">
                        Manage Bank Accounts
                    </Title>
                }
                bodyStyle={{ paddingTop: 0, overflowY: 'visible', overflowX: 'hidden', maxHeight: 'none', borderRadius: 16 }}
                style={{ borderRadius: 16, overflow: 'hidden' }}
            >
                {showFormView ? (
                    <AddAccountForm
                        activeTab={activeTab}
                        editData={editAccount}
                        isLoading={editAccount ? editLoading : addLoading}
                        onBack={() => { setIsAddingAccount(false); setEditAccount(undefined); }}
                        onSubmit={editAccount ? handleEdit : handleAdd}
                    />
                ) : (
                    <>
                        <Tabs
                            activeKey={activeTab}
                            onChange={handleTabChange}
                            items={tabItems}
                            size="small"
                            style={{ marginBottom: 4 }}
                        />

                        <Flex gap={12} align="center" style={{ marginBottom: 16 }}>
                            <Text type="secondary">
                                {tabDescription}
                            </Text>
                            {activeTab === 'domestic' && (
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={() => setIsAddingAccount(true)}
                                   
                                >
                                    Add Bank Account
                                </Button>
                            )}
                        </Flex>

                        {activeTab === 'domestic' ? renderDomesticTab() : renderVirtualTab()}
                    </>
                )}
            </Modal>

            <VirtualAccountDetailsDrawer
                open={loadFundsOpen}
                onClose={() => setLoadFundsOpen(false)}
                onboardingRecord={{
                    virtualAccountNumber,
                    virtualIfsc: vaIfsc,
                    status: virtualAccountNumber ? 'active' : null,
                }}
                balance={balance}
                balanceLoading={balanceLoading}
            />

            <ConfirmationModal
                isOpen={confirmDeleteVisible}
                title="Are you sure you want to delete this bank account?"
                description="This action cannot be undone."
                handleCancel={() => { setConfirmDeleteVisible(false); setAccountToDelete(null); }}
                isLoading={deleteLoading}
                handleSubmit={async () => {
                    if (!accountToDelete) return;
                    const res = await deleteBankAccount(accountToDelete);
                    if (res) {
                        setConfirmDeleteVisible(false);
                        setAccountToDelete(null);
                        dispatch(showToast({ description: 'Bank account deleted successfully', variant: 'success' }));
                        getDomesticBankAccounts();
                    }
                }}
            />
        </>
    );
};

export default ManageBankAccountsModal;
