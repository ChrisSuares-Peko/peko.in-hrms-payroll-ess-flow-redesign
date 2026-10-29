import { useEffect, useState } from 'react';

import { Alert, Collapse, Descriptions, Flex, Typography } from 'antd';

import DrawerModal from '@components/atomic/DrawerModal';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import StatusTag from './StatusTag';
import {
    DESCRIPTION_COLUMNS,
    DESCRIPTION_STYLES,
    FULL_ROW_SPAN,
    eventLabel,
    transactionModeLabel,
    transactionTypeLabel,
} from './transactionMeta';
import { CorporateCardTransactionDetail } from '../../types/corporateCardTransactions';

const { Text } = Typography;

const dateTime = (value: string | null) =>
    value ? `${formattedDateOnly(new Date(value))} ${formattedTime(new Date(value))}` : '-';

const money = (value: number | null) =>
    value === null ? '-' : `₹ ${formatNumberWithLocalString(value)}`;

const PayloadBlock = ({ payload }: { payload: Record<string, unknown> | null }) => (
    <pre className="m-0 max-h-80 overflow-auto rounded-lg border border-borderDivider bg-surfaceGray p-4 text-xs leading-5 text-textBody">
        {payload ? JSON.stringify(payload, null, 2) : 'No payload received.'}
    </pre>
);

const TransactionDetailDrawer = ({
    record,
    onClose,
}: {
    record: CorporateCardTransactionDetail | null;
    onClose: () => void;
}) => {
    const [shown, setShown] = useState<CorporateCardTransactionDetail | null>(record);

    useEffect(() => {
        if (record) setShown(record);
    }, [record]);

    if (!shown) return null;

    const items = [
        {
            key: 'transaction',
            label: 'Transaction',
            children: (
                <Descriptions
                    column={DESCRIPTION_COLUMNS}
                    styles={DESCRIPTION_STYLES}
                    size="small"
                    bordered
                >
                    <Descriptions.Item label="Transaction ID">
                        <span className="whitespace-nowrap">{shown.displayId ?? '-'}</span>
                    </Descriptions.Item>
                    <Descriptions.Item label="Reference No.">
                        <span className="whitespace-nowrap">{shown.referenceNumber ?? '-'}</span>
                    </Descriptions.Item>
                    <Descriptions.Item label="Vendor Txn ID" span={FULL_ROW_SPAN}>
                        <Text copyable className="break-all">
                            {shown.transactionUniqueId}
                        </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Notification ID" span={FULL_ROW_SPAN}>
                        {shown.notificationUniqueId ?? '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Type">
                        {transactionTypeLabel(shown.transactionType)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Mode">
                        {transactionModeLabel(shown.transactionMode)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Amount">
                        <Text strong className="whitespace-nowrap">
                            {money(shown.transactionAmount)}
                        </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Wallet balance at issuer">
                        <span className="whitespace-nowrap">
                            {money(shown.issuerWalletBalance)}
                        </span>
                    </Descriptions.Item>
                </Descriptions>
            ),
        },
        {
            key: 'party',
            label: 'Corporate & card',
            children: (
                <Descriptions
                    column={DESCRIPTION_COLUMNS}
                    styles={DESCRIPTION_STYLES}
                    size="small"
                    bordered
                >
                    <Descriptions.Item label="Corporate">
                        {shown.corporateName ?? '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Corporate ID">
                        <span className="whitespace-nowrap">{shown.corporateId ?? '-'}</span>
                    </Descriptions.Item>
                    <Descriptions.Item label="Cardholder">
                        {shown.cardholderName ?? '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Cardholder ID">
                        <span className="whitespace-nowrap">{shown.userId ?? '-'}</span>
                    </Descriptions.Item>
                    <Descriptions.Item label="Card">
                        <span className="whitespace-nowrap">{shown.maskedCardNumber ?? '-'}</span>
                    </Descriptions.Item>
                    <Descriptions.Item label="Card issuance ID">
                        <span className="whitespace-nowrap">{shown.cardIssuanceId ?? '-'}</span>
                    </Descriptions.Item>
                    <Descriptions.Item label="External card ID" span={FULL_ROW_SPAN}>
                        <span className="break-all">{shown.externalCardIdentifier ?? '-'}</span>
                    </Descriptions.Item>
                </Descriptions>
            ),
        },
        {
            key: 'merchant',
            label: 'Merchant',
            children: (
                <Descriptions
                    column={DESCRIPTION_COLUMNS}
                    styles={DESCRIPTION_STYLES}
                    size="small"
                    bordered
                >
                    <Descriptions.Item label="Name" span={FULL_ROW_SPAN}>
                        {shown.merchantName ?? '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="City">{shown.merchantCity ?? '-'}</Descriptions.Item>
                    <Descriptions.Item label="MCC">
                        <span className="whitespace-nowrap">
                            {shown.merchantCategoryCode ?? '-'}
                        </span>
                    </Descriptions.Item>
                    <Descriptions.Item label="Category" span={FULL_ROW_SPAN}>
                        {shown.category ?? '-'}
                    </Descriptions.Item>
                </Descriptions>
            ),
        },
        {
            key: 'processing',
            label: 'Processing',
            children: (
                <Descriptions
                    column={DESCRIPTION_COLUMNS}
                    styles={DESCRIPTION_STYLES}
                    size="small"
                    bordered
                >
                    <Descriptions.Item label="Status">
                        <StatusTag status={shown.status} />
                    </Descriptions.Item>
                    <Descriptions.Item label="Decision">{shown.decision ?? '-'}</Descriptions.Item>
                    <Descriptions.Item label="Event">
                        {eventLabel(shown.eventType)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Internal status">
                        {shown.internalStatus}
                    </Descriptions.Item>
                    <Descriptions.Item label="Admin approval">{shown.approval}</Descriptions.Item>
                    <Descriptions.Item label="Authorised at">
                        {dateTime(shown.createdAt)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Notified at" span={FULL_ROW_SPAN}>
                        {dateTime(shown.notifiedAt)}
                    </Descriptions.Item>
                </Descriptions>
            ),
        },
        {
            key: 'authPayload',
            label: 'Raw authorisation payload',
            children: <PayloadBlock payload={shown.rawAuthPayload} />,
        },
        {
            key: 'notifyPayload',
            label: 'Raw notification payload',
            children: <PayloadBlock payload={shown.rawNotifyPayload} />,
        },
    ];

    return (
        <DrawerModal
            open={Boolean(record)}
            handleCancel={onClose}
            modalTitle="Transaction details"
            closeIcon
            width={720}
        >
            <Flex vertical gap={16}>
                <Flex
                    vertical
                    gap={6}
                    className="rounded-2xl border border-borderCard bg-surfaceGray p-4"
                >
                    <Flex align="center" justify="space-between" gap={12} wrap>
                        <Typography.Title level={3} className="!mb-0 !text-textHeadings">
                            {money(shown.transactionAmount)}
                        </Typography.Title>
                        <StatusTag status={shown.status} />
                    </Flex>
                    <Text className="text-sm text-textBody">
                        {shown.merchantName ?? 'Merchant not reported'}
                        {shown.merchantCity ? ` · ${shown.merchantCity}` : ''}
                    </Text>
                    <Text className="text-xs text-textGreyColor">
                        {dateTime(shown.createdAt)} · {eventLabel(shown.eventType)} ·{' '}
                        {transactionTypeLabel(shown.transactionType)}
                    </Text>
                </Flex>

                {shown.declineReason && (
                    <Alert
                        type="error"
                        showIcon
                        message="Declined"
                        description={shown.declineReason}
                    />
                )}

                <Collapse
                    items={items}
                    defaultActiveKey={['transaction', 'party']}
                    className="w-full"
                />
            </Flex>
        </DrawerModal>
    );
};

export default TransactionDetailDrawer;
