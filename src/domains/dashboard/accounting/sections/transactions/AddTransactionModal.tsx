import { useState } from 'react';

import { CloseOutlined } from '@ant-design/icons';
import { Button, Flex, Modal, Typography } from 'antd';

import { useAppSelector } from '@src/hooks/store';

import AddTransactionFields from './AddTransactionFields';
import AddTransactionReceiptUpload from './AddTransactionReceiptUpload';
import LinkDocumentInvoiceTab from './LinkDocumentInvoiceTab';
import { useAddTransactionForm } from './useAddTransactionForm';
import useLinkableInvoices from './useLinkableInvoices';
import { LinkableInvoice } from '../../api/transactions';
import { LinkDocumentTabKey, linkDocumentTabs } from '../../utils/linkDocumentData';
import { addTransactionModal } from '../../utils/transactionsData';

const { Title, Text } = Typography;

interface AddTransactionModalProps {
    open: boolean;
    onClose: () => void;

    onCreated?: () => void;
}

// Add-transaction has no existing transaction, so nothing is pre-linked.
const NO_LINKED_IDS = new Set<string>();

const AddTransactionModal = ({ open, onClose, onCreated }: AddTransactionModalProps) => {
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);

    const [activeTab, setActiveTab] = useState<LinkDocumentTabKey>('peko-hub');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<Record<string, LinkableInvoice>>({});

    const { invoices, loadingInvoices } = useLinkableInvoices({
        open,
        activeTab,
        search,
        userId,
        userType,
    });

    const {
        fileInputRef,
        receiptName,
        kind,
        setKind,
        amount,
        setAmount,
        date,
        setDate,
        category,
        subcategory,
        setSubcategory,
        subcategoryOptions,
        description,
        setDescription,
        submitting,
        errors,
        reset,
        handleFiles,
        handleCategoryChange,
        handleSubmit,
    } = useAddTransactionForm({ onClose, onCreated });

    const isInvoice = activeTab === 'invoice';
    const isPekoHub = activeTab === 'peko-hub';

    const toggleSelect = (invoice: LinkableInvoice) => {
        setSelected(prev => {
            const next = { ...prev };
            const key = String(invoice.id);
            if (next[key]) delete next[key];
            else next[key] = invoice;
            return next;
        });
    };

    const handleAfterClose = () => {
        reset();
        setActiveTab('peko-hub');
        setSearch('');
        setSelected({});
    };

    return (
        <Modal
            open={open}
            onCancel={onClose}
            afterClose={handleAfterClose}
            footer={null}
            closable={false}
            centered
            width="min(680px, 95vw)"
            styles={{
                content: { borderRadius: 28, padding: 0, overflow: 'hidden' },
                body: { padding: 0 },
            }}
        >
            <Flex
                vertical
                gap={20}
                className="max-h-[90vh] overflow-y-auto px-6 py-7 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-8"
            >
                <Flex align="flex-start" justify="space-between" gap={12}>
                    <Flex vertical gap={2} className="min-w-0">
                        <Title
                            level={3}
                            className="!mb-0 !text-xl !font-semibold !text-ink md:!text-xl"
                        >
                            {addTransactionModal.title}
                        </Title>
                        <Text className="text-sm text-muted">{addTransactionModal.subtitle}</Text>
                    </Flex>
                    <Button
                        type="text"
                        aria-label="Close"
                        icon={<CloseOutlined />}
                        onClick={onClose}
                        className="!h-auto shrink-0 !p-1 !text-slate-400 hover:!text-bodyText"
                    />
                </Flex>

                <Flex wrap="wrap" gap={8}>
                    {linkDocumentTabs.map(tab => {
                        const isActive = tab.key === activeTab;
                        return (
                            <Button
                                key={tab.key}
                                shape="round"
                                type={isActive ? 'primary' : 'text'}
                                danger={isActive}
                                onClick={() => setActiveTab(tab.key)}
                                className={
                                    isActive
                                        ? '!font-medium'
                                        : '!font-medium !text-muted hover:!bg-slate-100 hover:!text-bodyText'
                                }
                            >
                                {tab.label}
                            </Button>
                        );
                    })}
                </Flex>

                {isInvoice ? (
                    <LinkDocumentInvoiceTab
                        search={search}
                        setSearch={setSearch}
                        invoices={invoices}
                        loadingInvoices={loadingInvoices}
                        selected={selected}
                        selectedCount={Object.keys(selected).length}
                        linkedInvoiceIds={NO_LINKED_IDS}
                        toggleSelect={toggleSelect}
                    />
                ) : (
                    <Flex vertical gap={20}>
                        {isPekoHub && (
                            <AddTransactionReceiptUpload
                                fileInputRef={fileInputRef}
                                receiptName={receiptName}
                                handleFiles={handleFiles}
                            />
                        )}

                        <AddTransactionFields
                            kind={kind}
                            setKind={setKind}
                            amount={amount}
                            setAmount={setAmount}
                            date={date}
                            setDate={setDate}
                            category={category}
                            handleCategoryChange={handleCategoryChange}
                            subcategory={subcategory}
                            setSubcategory={setSubcategory}
                            subcategoryOptions={subcategoryOptions}
                            description={description}
                            setDescription={setDescription}
                            errors={errors}
                        />
                    </Flex>
                )}

                {isInvoice ? (
                    <Button
                        type="primary"
                        danger
                        onClick={onClose}
                        className="!h-12 w-full !rounded-xl"
                    >
                        Close
                    </Button>
                ) : (
                    <Flex gap={12} className="w-full flex-col sm:flex-row">
                        <Button
                            size="large"
                            onClick={onClose}
                            disabled={submitting}
                            className="!h-12 flex-1 !rounded-xl !border-borderSubtle !text-danger"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            size="large"
                            onClick={handleSubmit}
                            loading={submitting}
                            className="!h-12 flex-1 !rounded-xl"
                        >
                            Add Transaction
                        </Button>
                    </Flex>
                )}
            </Flex>
        </Modal>
    );
};

export default AddTransactionModal;
