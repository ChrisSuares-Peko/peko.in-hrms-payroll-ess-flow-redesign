import { useState } from 'react';

import { Flex } from 'antd';

import useDebounce from '@src/hooks/useDebounce';

import { useTransactions } from '../hooks/useTransactions';
import InsightsPanel from '../sections/insights/InsightsPanel';
import AddTransactionModal from '../sections/transactions/AddTransactionModal';
import TransactionFilterTabs from '../sections/transactions/TransactionFilterTabs';
import TransactionsHeader from '../sections/transactions/TransactionsHeader';
import TransactionsTable from '../sections/transactions/TransactionsTable';
import TransactionsToolbar from '../sections/transactions/TransactionsToolbar';
import UploadStatementModal from '../sections/upload/UploadStatementModal';
import { TransactionFilters, TransactionTab } from '../utils/transactionsData';

const TransactionsLanding = () => {
    const [activeTab, setActiveTab] = useState<TransactionTab['key']>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState<TransactionFilters>({});
    const [insightsOpen, setInsightsOpen] = useState(false);
    const [addTxnOpen, setAddTxnOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);

    const debouncedSearch = useDebounce(searchQuery, 400);
    const {
        groups,
        counts,
        loading,
        recordsTotal,
        page,
        itemsPerPage,
        handlePageChange,
        refetch,
        exporting,
        downloadExport,
    } = useTransactions(activeTab, debouncedSearch, filters);

    return (
        <Flex vertical gap={24} className="px-2 py-5">
            <TransactionsHeader
                onAddViaReceipt={() => setAddTxnOpen(true)}
                onImport={() => setImportOpen(true)}
                // onInsights={() => setInsightsOpen(prev => !prev)} // Insights button temporarily hidden
            />

            <Flex gap={24} align="flex-start" className="flex-col xl:flex-row">
                <Flex vertical gap={16} className="min-w-0 flex-1">
                    <TransactionFilterTabs
                        activeTab={activeTab}
                        onChange={setActiveTab}
                        counts={counts}
                    />
                    <TransactionsToolbar
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        typeFilter={filters.type || 'all'}
                        onTypeChange={value =>
                            setFilters(prev => ({ ...prev, type: value === 'all' ? undefined : value }))
                        }
                        onApplyFilters={setFilters}
                        onExport={() => downloadExport('excel')}
                        exporting={exporting}
                    />
                    <TransactionsTable
                        groups={groups}
                        loading={loading}
                        onRefetch={refetch}
                        activeTab={activeTab}
                        page={page}
                        pageSize={itemsPerPage}
                        total={recordsTotal}
                        onPageChange={handlePageChange}
                    />
                </Flex>

                {insightsOpen && <InsightsPanel onClose={() => setInsightsOpen(false)} />}
            </Flex>

            <AddTransactionModal
                open={addTxnOpen}
                onClose={() => setAddTxnOpen(false)}
                onCreated={refetch}
            />

            <UploadStatementModal
                open={importOpen}
                onClose={() => setImportOpen(false)}
                onImported={refetch}
            />
        </Flex>
    );
};

export default TransactionsLanding;
