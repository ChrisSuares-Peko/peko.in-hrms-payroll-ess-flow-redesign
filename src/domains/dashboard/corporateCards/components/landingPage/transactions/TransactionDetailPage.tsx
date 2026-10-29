import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button } from 'antd';

import AccountingPanel from './AccountingPanel';
import AuditTrailPanel from './AuditTrailPanel';
import CommentsPanel from './CommentsPanel';
import ReceiptsPanel from './ReceiptsPanel';
import { TransactionsVariant } from './TransactionsTable';
import TransactionSummaryCard from './TransactionSummaryCard';
import { useTransactionDetailApi } from '../../../hooks/user/useTransactionDetailApi';

interface TransactionDetailPageProps {
    variant?: TransactionsVariant;
    /** cardTransaction DB id (TransactionRow.key) of the selected transaction. */
    transactionId: string;
    onBack: () => void;
}

/**
 * Transaction detail view: a summary card alongside the receipts, audit trail and comments panels.
 * The summary + receipts are API-backed; the Accounting (admin-only), Audit Trail and Comments panels
 * have no backend yet and remain mock. Two columns on xl+ (2fr / 3fr), stacked below.
 */
const TransactionDetailPage = ({
    variant = 'admin',
    transactionId,
    onBack,
}: TransactionDetailPageProps) => {
    const { detail, isLoading } = useTransactionDetailApi(transactionId);

    return (
        <div className="flex flex-col gap-6">
            <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={onBack}
                className="self-start !px-0 text-textBody"
            >
                Back to transactions
            </Button>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
                <div className="xl:col-span-2">
                    <TransactionSummaryCard detail={detail} loading={isLoading} />
                </div>
                <div className="flex flex-col gap-6 xl:col-span-3">
                    <ReceiptsPanel transactionId={transactionId} />
                    {variant !== 'user' && <AccountingPanel />}
                    <AuditTrailPanel />
                    <CommentsPanel />
                </div>
            </div>
        </div>
    );
};

export default TransactionDetailPage;
