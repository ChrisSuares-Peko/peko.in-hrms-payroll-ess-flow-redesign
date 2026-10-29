import { useState } from 'react';

import { PlusOutlined } from '@ant-design/icons';
import { Button, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/lib/table';

import GenericTable from '@components/atomic/GenericTable';
import useScreenSize from '@src/hooks/useScreenSize';

import TopUpModal from './TopUpModal';
import cardImage from '../../assets/cardImage.jpg';
import { useAdminCardsApi } from '../../hooks/admin/useAdminCardsApi';
import { useFundingAccountApi } from '../../hooks/admin/useFundingAccountApi';
import { useWalletApi } from '../../hooks/admin/useWalletApi';
import { useWalletTopUpsApi } from '../../hooks/admin/useWalletTopUpsApi';
import { cn } from '../../utils/cn';
import { displayCardStatus, formatRupeesDecimal } from '../../utils/helpers';
import { CardRecord, CardStatus, TopUpHistoryItem, TopUpStatus } from '../../utils/types';
import PageTabs from '../common/PageTabs';
import StatusTag from '../common/StatusTag';

const { Text, Title } = Typography;

const WALLET_TABS = [
    { key: 'topup-history', label: 'Top-up history' },
    { key: 'card-limits', label: 'Card limits' },
];

const TOPUP_STATUS_TONE: Record<TopUpStatus, string> = {
    Completed: 'bg-savingsTagLightBg text-savingsTagLightText',
    Processing: 'bg-bgOrangeShade text-textOrange',
    Failed: 'bg-bgLightPink text-errorTextRed',
};

const topUpColumns: ColumnsType<TopUpHistoryItem> = [
    {
        key: 'date',
        title: 'Date',
        dataIndex: 'date',
        width: 160,
    },
    {
        key: 'reference',
        title: 'Reference',
        dataIndex: 'reference',
        width: 200,
    },
    {
        key: 'source',
        title: 'Source',
        dataIndex: 'source',
        width: 220,
    },
    {
        key: 'status',
        title: 'Status',
        dataIndex: 'status',
        width: 150,
        render: (status: TopUpStatus) => (
            <Tag
                bordered={false}
                className={cn(
                    'm-0 rounded-full px-2 py-0.5 text-xs font-medium leading-none',
                    TOPUP_STATUS_TONE[status]
                )}
            >
                {status}
            </Tag>
        ),
    },
    {
        key: 'amount',
        title: 'Amount',
        dataIndex: 'amount',
        width: 160,
        render: (amount: string) => (
            <Text className="font-medium text-savingsTagLightText">{amount}</Text>
        ),
    },
];

const cardLimitColumns: ColumnsType<CardRecord> = [
    {
        key: 'holder',
        title: 'Cardholder',
        dataIndex: 'holder',
        width: 180,
        render: (name: string) => (
            <Text className="text-sm font-medium text-textHeadings">{name}</Text>
        ),
    },
    {
        key: 'card',
        title: 'Card',
        dataIndex: 'last4',
        width: 230,
        render: (last4: string) => (
            <div className="flex items-center gap-3">
                <img
                    src={cardImage}
                    alt="card"
                    className="h-8 w-12 shrink-0 rounded-md object-cover shadow-sm"
                />
                <Text className="whitespace-nowrap text-sm text-textHeadings">
                    **** **** **** {last4}
                </Text>
            </div>
        ),
    },
    {
        key: 'type',
        title: 'Type',
        dataIndex: 'type',
        width: 120,
        render: (type: string) => <Text className="text-sm text-textBody">{type}</Text>,
    },
    {
        key: 'status',
        title: 'Status',
        dataIndex: 'status',
        width: 190,
        render: (status: CardStatus, row: CardRecord) => (
            <StatusTag status={displayCardStatus(status, row.terminationStatus)} />
        ),
    },
    {
        key: 'cardLimit',
        title: 'Card limit',
        dataIndex: 'cardLimit',
        width: 140,
        render: (value: number) => (
            <Text className="text-sm text-textBody">{formatRupeesDecimal(value)}</Text>
        ),
    },
    {
        key: 'spent',
        title: 'Spent',
        dataIndex: 'spent',
        width: 130,
        render: (value: number) => (
            <Text className="text-sm text-textBody">{formatRupeesDecimal(value)}</Text>
        ),
    },
    {
        key: 'remaining',
        title: 'Remaining on card',
        dataIndex: 'remaining',
        width: 170,
        render: (value: number) => (
            <Text className="text-sm text-textBody">{formatRupeesDecimal(value)}</Text>
        ),
    },
];

const PAGE_SIZE = 10;

const ALL_COLUMNS_FIT = 'xl';

const TOTAL_COMMITTED_LABEL = 'Total committed (caps)';

const WalletTab = () => {
    const isWide = !!useScreenSize()[ALL_COLUMNS_FIT];
    const [activeTab, setActiveTab] = useState('topup-history');
    const [modalOpen, setModalOpen] = useState(false);
    const [topupPage, setTopupPage] = useState(1);
    const [cardPage, setCardPage] = useState(1);

    const { wallet, isLoading: walletLoading } = useWalletApi();
    const { fundingAccount, isLoading: fundingLoading } = useFundingAccountApi(modalOpen);
    const {
        topUps,
        total: topupsTotal,
        isLoading: topUpsLoading,
    } = useWalletTopUpsApi(topupPage, PAGE_SIZE);
    const {
        cards,
        total: cardsTotal,
        isLoading: cardsLoading,
    } = useAdminCardsApi(cardPage, PAGE_SIZE);

    const balanceText = formatRupeesDecimal(wallet?.balance ?? 0);
    const totalCardLimits = wallet?.totalCardLimits ?? 0;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex flex-col gap-1">
                    <Title level={3} className="!mb-0 !text-xl !text-textHeadings sm:!text-2xl">
                        Pre Funding Wallet
                    </Title>
                    <Text className="text-sm text-textBody">
                        One pool of funds shared across all cards. Card limits are spend caps — not
                        reservations. The first card to spend draws from the wallet on a
                        first-come-first-served basis.
                    </Text>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setModalOpen(true)}
                    className="w-full font-medium sm:w-auto sm:shrink-0"
                >
                    Top up wallet
                </Button>
            </div>

            <div className="rounded-2xl border border-borderCard bg-[#F8FAFC] p-4 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 flex-col gap-1">
                        <Text className="text-sm text-textBody">
                            Pre Funding Wallet Balance – Shared Across All Cards
                        </Text>
                        <span className="break-words text-2xl font-semibold text-textHeadings sm:text-3xl">
                            {walletLoading ? '—' : balanceText}
                        </span>
                        <Text className="text-xs text-textGreyLight">
                            Real, spendable money. Every active card draws from this same pool.
                        </Text>
                    </div>
                    {wallet?.fundingAccount && (
                        <div className="flex flex-col gap-1">
                            <Text className="text-xs text-textGreyLight">Funding A/C · IFSC</Text>
                            <Text className="text-xl font-semibold text-textHeadings">
                                •• {wallet.fundingAccount.maskedAccountNumber} ·{' '}
                                {wallet.fundingAccount.ifsc}
                            </Text>
                            <Text className="text-xs text-textGreyLight">
                                Unique to your company
                            </Text>
                        </div>
                    )}
                    <Tag
                        bordered={false}
                        className="m-0 hidden shrink-0 rounded-full bg-listBg px-3 py-1 text-sm font-medium text-textBody sm:inline-block"
                    >
                        Wallet
                    </Tag>
                </div>
            </div>

            <PageTabs
                tabs={WALLET_TABS}
                activeKey={activeTab}
                onChange={key => {
                    setActiveTab(key);
                    setTopupPage(1);
                    setCardPage(1);
                }}
            />

            {activeTab === 'topup-history' && (
                <GenericTable
                    columns={topUpColumns}
                    dataSource={topUps}
                    loading={topUpsLoading}
                    rowKey="key"
                    scroll={{ x: 'max-content' }}
                    pagination={{
                        current: topupPage,
                        pageSize: PAGE_SIZE,
                        total: topupsTotal,
                        onChange: (p: number) => setTopupPage(p),
                        showSizeChanger: false,
                    }}
                />
            )}

            {activeTab === 'card-limits' && (
                <>
                    <GenericTable
                        columns={cardLimitColumns}
                        dataSource={cards}
                        loading={cardsLoading}
                        rowKey="key"
                        scroll={{ x: 'max-content' }}
                        pagination={{
                            current: cardPage,
                            pageSize: PAGE_SIZE,
                            total: cardsTotal,
                            onChange: (p: number) => setCardPage(p),
                            showSizeChanger: false,
                        }}
                        summary={
                            isWide
                                ? () => (
                                      <Table.Summary.Row>
                                          <Table.Summary.Cell index={0} colSpan={4}>
                                              <Text className="text-sm font-medium text-textBody">
                                                  {TOTAL_COMMITTED_LABEL}
                                              </Text>
                                          </Table.Summary.Cell>
                                          <Table.Summary.Cell index={4}>
                                              <Text className="text-sm font-semibold text-textHeadings">
                                                  {formatRupeesDecimal(totalCardLimits)}
                                              </Text>
                                          </Table.Summary.Cell>
                                          <Table.Summary.Cell index={5} />
                                          <Table.Summary.Cell index={6}>
                                              <Text className="text-sm font-semibold text-textHeadings">
                                                  Wallet balance: {balanceText}
                                              </Text>
                                          </Table.Summary.Cell>
                                      </Table.Summary.Row>
                                  )
                                : undefined
                        }
                    />
                    {!isWide && (
                        <div className="flex flex-col gap-3 rounded-2xl border border-borderCard p-4">
                            <div className="flex items-baseline justify-between gap-3">
                                <Text className="text-sm text-textBody">
                                    {TOTAL_COMMITTED_LABEL}
                                </Text>
                                <Text className="text-sm font-semibold text-textHeadings">
                                    {formatRupeesDecimal(totalCardLimits)}
                                </Text>
                            </div>
                            <div className="flex items-baseline justify-between gap-3">
                                <Text className="text-sm text-textBody">Wallet balance</Text>
                                <Text className="text-sm font-semibold text-textHeadings">
                                    {balanceText}
                                </Text>
                            </div>
                        </div>
                    )}
                </>
            )}

            <TopUpModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                details={fundingAccount}
                loading={fundingLoading}
            />
        </div>
    );
};

export default WalletTab;
