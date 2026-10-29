import { Tag, Tooltip } from 'antd';

import { cn } from '../../utils/cn';

type Status =
    | 'Active'
    | 'Inactive'
    | 'Blocked'
    | 'Pending'
    | 'Frozen'
    | 'Frozen (Termination Requested)'
    | 'Approved'
    | 'Rejected'
    | 'Completed'
    | 'Declined'
    | 'Processing'
    | 'Reversed'
    | 'Refunded'
    | 'Failed'
    | 'Initiated'
    | 'Not started'
    | 'Ordered'
    | 'Dispatched'
    | 'Issued';

interface StatusTagProps {
    status: Status;
    tooltip?: string | null;
}

const TONE: Record<Status, string> = {
    Active: 'bg-savingsTagLightBg text-savingsTagLightText',
    Completed: 'bg-savingsTagLightBg text-savingsTagLightText',
    Pending: 'bg-bgOrangeShade text-textOrange',
    Processing: 'bg-bgOrangeShade text-textOrange',
    Initiated: 'bg-bgOrangeShade text-textOrange',
    Ordered: 'bg-bgOrangeShade text-textOrange',
    Issued: 'bg-savingsTagLightBg text-savingsTagLightText',
    Dispatched: 'bg-bgLightBlue text-bgDodgerblue',
    Inactive: 'bg-listBg text-textBody',
    'Not started': 'bg-listBg text-textBody',
    Blocked: 'bg-bgLightPink text-errorTextRed',
    Frozen: 'bg-bgLightBlue text-bgDodgerblue',
    'Frozen (Termination Requested)': 'bg-bgLightBlue text-bgDodgerblue',
    Approved: 'bg-savingsTagLightBg text-savingsTagLightText',
    Rejected: 'bg-bgLightPink text-errorTextRed',
    Declined: 'bg-bgLightPink text-errorTextRed',
    Reversed: 'bg-bgGray text-textGray',
    Refunded: 'bg-bgLightBlue text-bgDodgerblue',
    Failed: 'bg-bgLightPink text-errorTextRed',
};

/** Small status pill (antd Tag) used in transaction and card rows. */
const StatusTag = ({ status, tooltip }: StatusTagProps) => {
    const tag = (
        <Tag
            bordered={false}
            className={cn(
                'm-0 rounded-full px-2 py-0.5 text-xs font-medium leading-none',
                TONE[status]
            )}
        >
            {status}
        </Tag>
    );
    return tooltip ? <Tooltip title={tooltip}>{tag}</Tooltip> : tag;
};

export default StatusTag;
