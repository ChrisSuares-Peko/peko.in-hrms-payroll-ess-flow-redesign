import { Avatar, Tooltip, Typography } from 'antd';

import StatusTag from './StatusTag';
import { TransactionItem } from '../../utils/types';

const { Text } = Typography;

/** Vertical list of merchant transactions used on both dashboards. */
const RecentTransactions = ({ items }: { items: TransactionItem[] }) => (
    <ul className="flex flex-col">
        {items.map(txn => (
            <li
                key={txn.key}
                className="flex items-center gap-3 border-b border-borderDivider py-4 last:border-0"
            >
                {txn.icon ? (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-borderCard bg-white p-1.5">
                        <img
                            src={txn.icon}
                            alt={txn.merchant}
                            className="h-full w-full object-contain"
                        />
                    </div>
                ) : (
                    <Avatar
                        shape="circle"
                        size={36}
                        style={{ backgroundColor: txn.avatarColor ?? '#475569', flexShrink: 0 }}
                        className="text-xs font-semibold"
                    >
                        {txn.avatarText}
                    </Avatar>
                )}
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                        <Tooltip title={txn.merchant} trigger={['hover', 'click']}>
                            <Text className="truncate text-sm font-medium text-textHeadings">
                                {txn.merchant}
                            </Text>
                        </Tooltip>
                        <StatusTag status={txn.status} />
                    </div>
                    <div className="flex min-w-0 items-center gap-1">
                        <Tooltip title={txn.person} trigger={['hover', 'click']}>
                            <Text className="max-w-[120px] truncate text-xs text-textGreyLight">
                                {txn.person}
                            </Text>
                        </Tooltip>
                        <Text className="shrink-0 text-xs text-textGreyLight">• {txn.date}</Text>
                    </div>
                </div>
                <Text className="whitespace-nowrap text-sm font-medium text-textHeadings">
                    {txn.amount}
                </Text>
            </li>
        ))}
    </ul>
);

export default RecentTransactions;
