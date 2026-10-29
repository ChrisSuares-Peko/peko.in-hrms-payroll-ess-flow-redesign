import { useState } from 'react';

import TransactionDetailModal from './TransactionDetailModal';
import TransactionsListPage, {
    ExternalTransactionFilters,
    TransactionDropdownOptions,
} from './TransactionsListPage';
import { TransactionApprovalHandlers, TransactionsVariant } from './TransactionsTable';
import { TransactionRow } from '../../../utils/types';

interface TransactionsSectionProps {
    variant?: TransactionsVariant;
    hideHeader?: boolean;
    hideActions?: boolean;
    externalFilters?: ExternalTransactionFilters;
    onOptionsChange?: (opts: TransactionDropdownOptions) => void;
    approvalHandlers?: TransactionApprovalHandlers;
    refreshKey?: number;
    initialCard?: string;
    onInitialCardFilterConsumed?: () => void;
}

/**
 * Transactions tab for both admin (org-wide) and user (own charges) dashboards.
 * Shows the activity list and opens the transaction detail modal when a row is clicked.
 */
const TransactionsSection = ({
    variant = 'admin',
    hideHeader = false,
    hideActions = false,
    externalFilters,
    onOptionsChange,
    approvalHandlers,
    refreshKey,
    initialCard,
    onInitialCardFilterConsumed,
}: TransactionsSectionProps) => {
    const [selected, setSelected] = useState<TransactionRow | null>(null);

    return (
        <>
            <TransactionsListPage
                variant={variant}
                onView={setSelected}
                hideHeader={hideHeader}
                hideActions={hideActions}
                externalFilters={externalFilters}
                onOptionsChange={onOptionsChange}
                approvalHandlers={approvalHandlers}
                refreshKey={refreshKey}
                initialCard={initialCard}
                onInitialCardFilterConsumed={onInitialCardFilterConsumed}
            />
            <TransactionDetailModal
                transaction={selected}
                onClose={() => setSelected(null)}
                variant={variant}
            />
        </>
    );
};

export default TransactionsSection;
