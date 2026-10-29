import { DownloadOutlined } from '@ant-design/icons';
import { Flex, Spin, Tag, Typography } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import { capitalize } from 'lodash';

import { formattedDateTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { ActiveSubscription, Package } from '../../types/orderHistory';

const isBundledRow = (record: ActiveSubscription): boolean =>
    !record.subscriptionPaymentRefId &&
    (record.billingPlan ?? '').toUpperCase() === 'BASIC' &&
    !record.isCustom;

const getPurchaseHistoryColumns = (
    handleDownloadInvoice: (
        transactionID: string,
        type: 'invoice' | 'receipt',
        rowId: string | number
    ) => void,
    loadingKey: string | null
): ColumnsType<ActiveSubscription> => [
    {
        key: 'subscriptionPaymentRefId',
        title: 'Order ID',
        dataIndex: 'subscriptionPaymentRefId',
        render: (refId: string | null, record: ActiveSubscription) => {
            if (refId) return refId;
            if (isBundledRow(record)) return 'Bundled with Peko+';
            return '—';
        },
    },
    {
        key: 'createdAt',
        title: 'Billing Date',
        // createdAt is the actual purchase/charge timestamp. subscriptionStartDate is normalized to
        // start-of-day in the backend (moment().startOf('day')), so it always renders as "12 AM".
        dataIndex: 'createdAt',
        render: (date: string) => (date ? formattedDateTime(new Date(date)) : 'N/A'),
    },
    {
        key: 'package',
        title: 'Plan',
        dataIndex: 'package',
        render: (data: Package) => data.packageName,
    },
    {
        key: 'subscriptionAmountPaid',
        title: 'Amount',
        dataIndex: 'subscriptionAmountPaid',
        render: (amount: number, record: ActiveSubscription) =>
            isBundledRow(record) ? 'Free' : `₹ ${formatNumberWithLocalString(amount)}`,
    },
    {
        title: 'Payment Mode',
        dataIndex: 'paymentMode',
        key: 'paymentMode',
        render: (_: unknown, record: ActiveSubscription) =>
            isBundledRow(record) ? 'Bundled' : 'Card',
    },
    {
        key: 'status',
        title: 'Status',
        dataIndex: 'status',
        render: (text: string) => {
            const displayText = text === 'PENDING' ? 'Purchased' : capitalize(text);
            const tagColor = text === 'ACTIVE' || text === 'PENDING' ? 'success' : 'error';

            return (
                <Tag color={tagColor} className="rounded-2xl px-3 py-0.5">
                    {displayText}
                </Tag>
            );
        },
    },
    {
        key: 'details',
        title: 'Details',
        dataIndex: 'subscriptionPaymentRefId',
        render: (refId: string | null, record: ActiveSubscription) => {
            // A bundled (Peko+) row was never paid for on its own — there's no order behind it,
            // so there is no invoice or receipt to serve.
            if (!refId || isBundledRow(record)) {
                return <Typography.Text type="secondary">—</Typography.Text>;
            }

            const renderLink = (type: 'invoice' | 'receipt', label: string) =>
                loadingKey === `${record.id}-${type}` ? (
                    <Spin size="small" className="text-xs" />
                ) : (
                    <span
                        tabIndex={0}
                        role="button"
                        onClick={() => handleDownloadInvoice(refId, type, record.id)}
                        onKeyDown={(event: React.KeyboardEvent<HTMLSpanElement>) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                                handleDownloadInvoice(refId, type, record.id);
                            }
                        }}
                        className="text-bgOrange2 text-nowrap cursor-pointer"
                        aria-label={`Download ${type} for transaction ID ${refId}`}
                    >
                        <DownloadOutlined className="text-xs pe-2" />
                        {label}
                    </span>
                );

            return (
                <Flex gap={8} vertical align="start">
                    {/* Invoice only exists when a tax invoice was actually stored for the order;
                        the receipt is always available. Same rule as Reports → Subscriptions. */}
                    {record.isInvoice && renderLink('invoice', 'Download Invoice')}
                    {renderLink('receipt', 'Download Receipt')}
                </Flex>
            );
        },
    },
];

export default getPurchaseHistoryColumns;
