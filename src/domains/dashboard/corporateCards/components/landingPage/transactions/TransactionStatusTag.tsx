import { Tag, Tooltip, Typography } from 'antd';

import { cn } from '../../../utils/cn';
import { TransactionApprovalStatus, TransactionStatus } from '../../../utils/types';

const { Text } = Typography;

const STATUS_TONE: Record<TransactionStatus, string> = {
    Completed: 'bg-savingsTagLightBg text-savingsTagLightText',
    Posted: 'bg-savingsTagLightBg text-savingsTagLightText',
    Processing: 'bg-bgOrangeShade text-textOrange',
    Pending: 'bg-bgOrangeShade text-textOrange',
    Declined: 'bg-bgLightPink text-errorTextRed',
    // Reversed: the debit never actually went through — same family as Declined, but muted/neutral so
    // it reads as its own state rather than a duplicate of "Declined".
    Reversed: 'bg-bgGray text-textGray',
    // Refunded: the debit happened and money came back — a distinct, positive-but-not-Completed state.
    Refunded: 'bg-bgLightBlue text-accentBlue',
};

const APPROVAL_TONE: Partial<Record<TransactionApprovalStatus, string>> = {
    Approved: 'bg-savingsTagLightBg text-savingsTagLightText',
    Pending: 'bg-bgOrangeShade text-textOrange',
    Rejected: 'bg-bgLightPink text-errorTextRed',
};

/**
 * Settlement-status pill for a Transactions row: 'Posted' green, 'Pending' amber.
 *
 * `tooltip` is optional and off by default, so every existing caller is unchanged. It carries the reason
 * behind a status the row cannot otherwise explain — a decline — the same way StatusTag surfaces a
 * rejection note in My requests.
 */
export const TxnStatusTag = ({
    status,
    tooltip,
}: {
    status: TransactionStatus;
    tooltip?: string | null;
}) => {
    const tag = (
        <Tag
            bordered={false}
            className={cn(
                'm-0 rounded-full px-3 py-0.5 text-xs font-medium leading-none',
                STATUS_TONE[status]
            )}
        >
            {status}
        </Tag>
    );
    // A wrapper span so the tooltip has a hoverable target: antd Tag forwards no ref of its own.
    return tooltip ? (
        <Tooltip title={tooltip}>
            <span className="inline-flex cursor-help">{tag}</span>
        </Tooltip>
    ) : (
        tag
    );
};

/**
 * Approval-state cell for a Transactions row. 'Approved'/'Pending' render as coloured pills;
 * 'Auto-approved' renders as plain muted text (matches Figma — it isn't a status pill).
 */
export const TxnApprovalTag = ({ approval }: { approval: TransactionApprovalStatus }) => {
    if (approval === 'Auto-approved') {
        return <Text className="text-sm text-textBody">Auto-approved</Text>;
    }

    return (
        <Tag
            bordered={false}
            className={cn(
                'm-0 rounded-full px-3 py-0.5 text-xs font-medium leading-none',
                APPROVAL_TONE[approval]
            )}
        >
            {approval}
        </Tag>
    );
};
