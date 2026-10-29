import { useEffect, useState } from 'react';

import { Flex, Pagination, Table, Tag, Typography } from 'antd';
import type { TableProps } from 'antd';

import { DateCell, StatusPill, maskedLast4, money } from './lookupMeta';
import { LookupCard } from '../types';

export type CardWithHolder = LookupCard & { holderName?: string | null };

const FREQUENCY_LABEL: Record<string, string> = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
};

// Frozen/terminated say more than "Activated" about a card you can no longer use, so they take precedence.
const stateCell = (card: LookupCard) => {
    if (card.terminationStatus === 'REQUESTED') {
        return <StatusPill status="Pending" label="Termination requested" />;
    }
    if (card.cardState === 'FROZEN') {
        const reason = [card.freezeReasonLabel, card.freezeReasonNote].filter(Boolean).join(': ');
        return <StatusPill status="Frozen" reason={reason || null} />;
    }
    return <StatusPill status="Active" />;
};

const buildColumns = (showHolder: boolean): TableProps<CardWithHolder>['columns'] => [
    ...(showHolder
        ? [
              {
                  title: 'Cardholder',
                  key: 'holderName',
                  render: (_: unknown, card: CardWithHolder) => card.holderName || '-',
              },
          ]
        : []),
    {
        title: 'Card',
        key: 'card',
        render: (_: unknown, card) => (
            <Flex vertical>
                <Typography.Text className="font-medium">{maskedLast4(card.last4)}</Typography.Text>
                <Typography.Text type="secondary" className="text-xs">
                    {card.nameOnCard || '-'}
                </Typography.Text>
            </Flex>
        ),
    },
    {
        title: 'Type',
        dataIndex: 'type',
        key: 'type',
        render: (type: string) => (
            <Tag className="rounded-full m-0" color={type === 'Physical' ? 'purple' : 'blue'}>
                {type}
            </Tag>
        ),
    },
    {
        title: 'Limit',
        key: 'limit',
        render: (_: unknown, card) => (
            <Flex vertical>
                <Typography.Text>{money(card.cardLimit)}</Typography.Text>
                <Typography.Text type="secondary" className="text-xs">
                    {FREQUENCY_LABEL[card.limitFrequency] ?? card.limitFrequency}
                    {card.perTxnLimit !== null ? ` · ${money(card.perTxnLimit)} / txn` : ''}
                </Typography.Text>
            </Flex>
        ),
    },
    {
        title: 'Activation',
        key: 'activationStatus',
        render: (_: unknown, card) => (
            <StatusPill status={card.activationStatus} reason={card.failureReason} />
        ),
    },
    {
        title: 'Card State',
        key: 'cardState',
        render: (_: unknown, card) =>
            card.activationStatus === 'Activated' ? stateCell(card) : <span>-</span>,
    },
    {
        title: 'Delivery / AWB',
        key: 'awb',
        render: (_: unknown, card) =>
            card.type !== 'Physical' ? (
                <span>-</span>
            ) : (
                <Flex vertical gap={2}>
                    <StatusPill status={card.deliveryStatus} />
                    {card.awbNumber && (
                        <Typography.Text copyable className="text-xs">
                            {card.awbNumber}
                        </Typography.Text>
                    )}
                    {card.courierPartnerName && (
                        <Typography.Text type="secondary" className="text-xs">
                            {card.courierPartnerName}
                        </Typography.Text>
                    )}
                </Flex>
            ),
    },
    {
        title: 'Issued On',
        dataIndex: 'issuedOn',
        key: 'issuedOn',
        render: (value: string) => <DateCell value={value} />,
    },
];

type Props = {
    cards: CardWithHolder[];
    showHolder?: boolean;
    loading?: boolean;
    // The flat Cards section pages; a member's own (short) card list under their row does not.
    pageSize?: number;
};

// Used both flat (every card, with its holder) and nested under a member row (that member's cards).
const CardsTable = ({ cards, showHolder = false, loading = false, pageSize }: Props) => {
    const [page, setPage] = useState(1);

    useEffect(() => {
        setPage(1);
    }, [cards]);

    const rows = pageSize ? cards.slice((page - 1) * pageSize, page * pageSize) : cards;

    return (
        <>
            <Table<CardWithHolder>
                columns={buildColumns(showHolder)}
                dataSource={rows}
                rowKey="id"
                loading={loading}
                pagination={false}
                size={showHolder ? 'middle' : 'small'}
                scroll={{ x: 'max-content' }}
                locale={{ emptyText: 'No cards issued' }}
            />
            {pageSize && (
                <Pagination
                    current={page}
                    pageSize={pageSize}
                    size="default"
                    className="text-end pt-5"
                    onChange={setPage}
                    total={cards.length}
                    showSizeChanger={false}
                />
            )}
        </>
    );
};

export default CardsTable;
