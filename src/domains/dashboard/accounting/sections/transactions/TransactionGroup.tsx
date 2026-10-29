import { useState } from 'react';

import { DownOutlined, RightOutlined } from '@ant-design/icons';
import { Button, Tag, Typography } from 'antd';

import TransactionRow from './TransactionRow';
import { Transaction } from '../../utils/transactionsData';

const { Text } = Typography;

interface TransactionGroupProps {
    month: string;
    transactions: Transaction[];
    selectedIds: Set<string>;
    editingId: string | null;
    onToggleSelect: (id: string) => void;
    onStartEdit: (id: string) => void;
    onStopEdit: () => void;
    onSaveNote: (id: string, note: string) => void;
    onToggleRecurring: (id: string, current: boolean) => void;
    onToggleHide: (id: string, current: boolean) => void;
    onSetCategory: (id: string, category: string) => void;
    onChangeAccount: (id: string, account: string) => Promise<boolean>;
    onLinkDocument: (txn: Transaction) => void;
    onUnlink: (id: string, linkId: number) => void;
    onRemoveDoc: (id: string, documentId: number) => void;
}

const TransactionGroup = ({
    month,
    transactions,
    selectedIds,
    editingId,
    onToggleSelect,
    onStartEdit,
    onStopEdit,
    onSaveNote,
    onToggleRecurring,
    onToggleHide,
    onSetCategory,
    onChangeAccount,
    onLinkDocument,
    onUnlink,
    onRemoveDoc,
}: TransactionGroupProps) => {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <section>
            <Button
                type="text"
                block
                onClick={() => setCollapsed(prev => !prev)}
                className="!flex !h-auto !items-center !justify-start !gap-3 !rounded-none !bg-warning-surface !px-6 !py-3 hover:!bg-amber-100"
            >
                {collapsed ? (
                    <RightOutlined className="!text-xs !text-bodyText" />
                ) : (
                    <DownOutlined className="!text-xs !text-bodyText" />
                )}
                <Text className="text-sm font-semibold text-ink">{month}</Text>
                <Tag className="!m-0 !rounded-full !border-borderSubtle !bg-white !px-2.5 !py-0.5 !text-xs !font-medium !text-muted">
                    {transactions.length} transactions
                </Tag>
            </Button>

            {!collapsed &&
                transactions.map(txn => (
                    <TransactionRow
                        key={txn.id}
                        transaction={txn}
                        selected={selectedIds.has(txn.id)}
                        editing={editingId === txn.id}
                        hidden={txn.statuses.includes('hidden')}
                        onToggleSelect={() => onToggleSelect(txn.id)}
                        onStartEdit={() => onStartEdit(txn.id)}
                        onStopEdit={onStopEdit}
                        onSaveNote={note => onSaveNote(txn.id, note)}
                        onToggleRecurring={() => onToggleRecurring(txn.id, Boolean(txn.recurring))}
                        onToggleHide={() => onToggleHide(txn.id, txn.statuses.includes('hidden'))}
                        onAcceptCategory={() => onSetCategory(txn.id, txn.category.label)}
                        onChangeCategory={category => onSetCategory(txn.id, category)}
                        onChangeAccount={account => onChangeAccount(txn.id, account)}
                        onLinkDocument={() => onLinkDocument(txn)}
                        onUnlink={linkId => onUnlink(txn.id, linkId)}
                        onRemoveDoc={documentId => onRemoveDoc(txn.id, documentId)}
                    />
                ))}
        </section>
    );
};

export default TransactionGroup;
