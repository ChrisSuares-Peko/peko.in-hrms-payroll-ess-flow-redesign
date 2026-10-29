import { Flex, Pagination } from 'antd';

import BulkActionsBar from './BulkActionsBar';
import LinkDocumentModal from './LinkDocumentModal';
import TransactionsTableBody from './TransactionsTableBody';
import { useTransactionActions } from './useTransactionActions';
import { TransactionMonthGroup, TransactionTab } from '../../utils/transactionsData';

const PAGE_SIZE_OPTIONS = ['10', '20', '50', '100'];

interface TransactionsTableProps {
    groups: TransactionMonthGroup[];
    loading: boolean;

    onRefetch: () => void;

    activeTab: TransactionTab['key'];

    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number, pageSize: number) => void;
}

const TransactionsTable = ({
    groups,
    loading,
    onRefetch,
    activeTab,
    page,
    pageSize,
    total,
    onPageChange,
}: TransactionsTableProps) => {
    const {
        editingId,
        setEditingId,
        selectedIds,
        setSelectedIds,
        linkingTxn,
        setLinkingTxn,
        allSelected,
        someSelected,
        toggleId,
        handleToggleSelectAll,
        handleSaveNote,
        handleToggleRecurring,
        handleToggleHide,
        handleSetCategory,
        handleChangeAccount,
        handleUnlink,
        handleRemoveDoc,
        selectedCount,
        clearSelection,
        exporting,
        handleExportSelected,
        hideLabel,
        handleBulkHide,
        handleBulkRecurring,
        handleBulkCategorize,
    } = useTransactionActions({ groups, onRefetch, activeTab });

    return (
        <>
            <TransactionsTableBody
                groups={groups}
                loading={loading}
                allSelected={allSelected}
                someSelected={someSelected}
                onToggleSelectAll={handleToggleSelectAll}
                selectedIds={selectedIds}
                editingId={editingId}
                onToggleSelect={id => setSelectedIds(prev => toggleId(prev, id))}
                onStartEdit={id => setEditingId(id)}
                onStopEdit={() => setEditingId(null)}
                onSaveNote={handleSaveNote}
                onToggleRecurring={handleToggleRecurring}
                onToggleHide={handleToggleHide}
                onSetCategory={handleSetCategory}
                onChangeAccount={handleChangeAccount}
                onLinkDocument={setLinkingTxn}
                onUnlink={handleUnlink}
                onRemoveDoc={handleRemoveDoc}
            />

            {total > 0 && (
                <Flex justify="end" className="pt-2">
                    <Pagination
                        current={page}
                        pageSize={pageSize}
                        total={total}
                        showSizeChanger
                        pageSizeOptions={PAGE_SIZE_OPTIONS}
                        onChange={onPageChange}
                        disabled={loading}
                        showTotal={count => `${count} transactions`}
                        className="!flex !items-center [&_.ant-pagination-options]:!order-first [&_.ant-pagination-options]:!ml-0 [&_.ant-pagination-options]:!mr-3"
                    />
                </Flex>
            )}

            {selectedCount > 0 && (
                <BulkActionsBar
                    count={selectedCount}
                    onCategorize={handleBulkCategorize}
                    onMarkRecurring={handleBulkRecurring}
                    hideLabel={hideLabel}
                    onHide={handleBulkHide}
                    exporting={exporting}
                    onExport={handleExportSelected}
                    onClear={clearSelection}
                />
            )}

            <LinkDocumentModal
                open={Boolean(linkingTxn)}
                transaction={linkingTxn}
                onClose={() => setLinkingTxn(null)}
                onLinked={onRefetch}
            />
        </>
    );
};

export default TransactionsTable;
