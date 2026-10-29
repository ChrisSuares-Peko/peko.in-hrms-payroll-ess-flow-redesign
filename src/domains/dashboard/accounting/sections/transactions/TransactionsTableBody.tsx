import { Checkbox, Empty, Spin, Typography } from 'antd';

import TransactionGroup from './TransactionGroup';
import {
    TRANSACTION_GRID_COLS,
    Transaction,
    TransactionMonthGroup,
    transactionColumns,
} from '../../utils/transactionsData';

const { Text } = Typography;

interface TransactionsTableBodyProps {
    groups: TransactionMonthGroup[];
    loading: boolean;
    allSelected: boolean;
    someSelected: boolean;
    onToggleSelectAll: () => void;
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

const TransactionsTableBody = ({
    groups,
    loading,
    allSelected,
    someSelected,
    onToggleSelectAll,
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
}: TransactionsTableBodyProps) => {
    const renderBody = () => {
        if (loading) return <Spin className="!flex justify-center py-16" />;
        if (groups.length === 0) {
            return <Empty className="py-16" description="No transactions match your filters" />;
        }
        return groups.map(group => (
            <TransactionGroup
                key={group.month}
                month={group.month}
                transactions={group.transactions}
                selectedIds={selectedIds}
                editingId={editingId}
                onToggleSelect={onToggleSelect}
                onStartEdit={onStartEdit}
                onStopEdit={onStopEdit}
                onSaveNote={onSaveNote}
                onToggleRecurring={onToggleRecurring}
                onToggleHide={onToggleHide}
                onSetCategory={onSetCategory}
                onChangeAccount={onChangeAccount}
                onLinkDocument={onLinkDocument}
                onUnlink={onUnlink}
                onRemoveDoc={onRemoveDoc}
            />
        ));
    };

    return (
        <div className="overflow-x-auto rounded-3xl border border-borderSubtle bg-white">
            <div className="min-w-min">
                <div
                    className={`hidden ${TRANSACTION_GRID_COLS} items-center gap-x-4 rounded-t-3xl border-b border-borderSubtle bg-surfaceGray px-6 py-4 lg:grid`}
                >
                    <Checkbox
                        checked={allSelected}
                        indeterminate={!allSelected && someSelected}
                        onChange={onToggleSelectAll}
                    />
                    {transactionColumns.slice(1).map((label, index) => (
                        <Text
                            key={`${label}-${index}`}
                            className="text-sm font-medium text-muted"
                        >
                            {label}
                        </Text>
                    ))}
                </div>

                {groups.length > 0 && (
                    <div className="flex items-center gap-2 rounded-t-3xl border-b border-borderSubtle bg-surfaceGray px-4 py-3 lg:hidden">
                        <Checkbox
                            checked={allSelected}
                            indeterminate={!allSelected && someSelected}
                            onChange={onToggleSelectAll}
                        />
                        <Text className="text-sm font-medium text-muted">Select all</Text>
                    </div>
                )}

                {renderBody()}
            </div>
        </div>
    );
};

export default TransactionsTableBody;
