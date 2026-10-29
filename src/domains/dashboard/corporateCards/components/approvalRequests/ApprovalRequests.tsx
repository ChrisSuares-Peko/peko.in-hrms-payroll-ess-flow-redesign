import { ReactNode, useCallback, useMemo, useState } from 'react';

import { CloseCircleOutlined, InfoCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, DatePicker, Input, Modal, Select, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/lib/table';
import dayjs, { Dayjs } from 'dayjs';

import GenericTable from '@components/atomic/GenericTable';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { CardRequestItem } from '../../api/admin/requestsApi';
import { approveTransactionDecision } from '../../api/user/transactionsApi';
import cardImage from '../../assets/cardImage.jpg';
import { useApprovalRequestsApi } from '../../hooks/admin/useApprovalRequestsApi';
import { useCardholderOptions } from '../../hooks/admin/useCardholderOptions';
import { usePhysicalCardPurchase } from '../../hooks/admin/usePhysicalCardPurchase';
import { useCardQuotaApi } from '../../hooks/user/useCardQuotaApi';
import {
    isPhysicalCardPurchase,
    physicalCardBlockReason,
    physicalCardPriceNote,
} from '../../utils/cardQuotaData';
import { REASON_NOTE_MIN, sanitizeReasonNote } from '../../utils/cardsData';
import { cn } from '../../utils/cn';
import { consumePendingSubTab } from '../../utils/corporateCardsNav';
import { formatRupeesDecimal, stripEmojis } from '../../utils/helpers';
import {
    ApprovalStatus,
    CardRequestApproval,
    LimitIncreaseApproval,
    PhysicalCardApproval,
    UnfreezeApproval,
} from '../../utils/types';
import ConfirmActionModal from '../common/ConfirmActionModal';
import { MODAL_CLOSE_ICON, ROUNDED_MODAL_CLASSNAMES } from '../common/modalProps';
import PageTabs from '../common/PageTabs';
import TransactionsSection from '../landingPage/transactions/TransactionsSection';

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

const APPROVAL_TABS = [
    { key: 'transactions', label: 'Transactions' },
    { key: 'card-requests', label: 'Card requests' },
    { key: 'limit-increases', label: 'Limit increases' },
    { key: 'physical-cards', label: 'Physical cards' },
    { key: 'unfreeze-requests', label: 'Unfreeze requests' },
];

type ApprovalTab =
    | 'transactions'
    | 'card-requests'
    | 'limit-increases'
    | 'physical-cards'
    | 'unfreeze-requests';

const CONFIRM_ENTITY: Record<ApprovalTab, string> = {
    transactions: 'transaction',
    'card-requests': 'card request',
    'limit-increases': 'limit increase request',
    'physical-cards': 'physical card request',
    'unfreeze-requests': 'unfreeze request',
};

const REJECT_MODAL_TITLE: Record<ApprovalTab, string> = {
    transactions: 'Reject transaction',
    'card-requests': 'Reject card request',
    'limit-increases': 'Reject limit increase request',
    'physical-cards': 'Reject physical card request',
    'unfreeze-requests': 'Reject unfreeze request',
};
const CONFIRM_TITLE_ENTITY: Record<ApprovalTab, string> = {
    transactions: 'Transaction',
    'card-requests': 'Card Request',
    'limit-increases': 'Limit Increase',
    'physical-cards': 'Physical Card Request',
    'unfreeze-requests': 'Unfreeze Request',
};

const buildConfirmCopy = (
    tab: ApprovalTab,
    action: 'approve' | 'reject',
    priceNote?: string | null
) => {
    const verb = action === 'approve' ? 'Approve' : 'Reject';
    if (priceNote) {
        return {
            title: `${verb} ${CONFIRM_TITLE_ENTITY[tab]}?`,
            description: `${priceNote} You'll be redirected to the payment screen to complete your order.`,
            confirmLabel: 'Continue to payment',
        };
    }
    return {
        title: `${verb} ${CONFIRM_TITLE_ENTITY[tab]}?`,
        description: `Are you sure you want to ${action} this ${CONFIRM_ENTITY[tab]}? This action cannot be undone.`,
        confirmLabel: tab === 'transactions' ? `${verb} transaction` : `${verb} request`,
    };
};

const STATUS_TONE: Record<ApprovalStatus, string> = {
    Approved: 'bg-savingsTagLightBg text-savingsTagLightText',
    Rejected: 'bg-bgLightPink text-errorTextRed',
    Pending: 'bg-bgOrangeShade text-textOrange',
    Processing: 'bg-bgOrangeShade text-textOrange',
};

const mapStatus = (status: string): ApprovalStatus => {
    if (status === 'APPROVED') return 'Approved';
    if (status === 'REJECTED' || status === 'CANCELLED') return 'Rejected';
    if (status === 'PROCESSING') return 'Processing';
    return 'Pending';
};

const formatReqDate = (iso: string): string => {
    try {
        return new Date(iso).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return iso;
    }
};

const mapCardRequest = (r: CardRequestItem): CardRequestApproval => ({
    key: String(r.id),
    date: formatReqDate(r.date),
    member: r.member ?? '-',
    cardType: r.payload?.cardType ?? '-',
    limit:
        r.payload?.requestedLimit != null
            ? `${formatRupeesDecimal(r.payload.requestedLimit)}${
                  r.payload.perTxnLimit != null
                      ? ` · ${formatRupeesDecimal(r.payload.perTxnLimit)} per txn`
                      : ''
              }`
            : '-',
    reason: r.reason ?? '-',
    status: mapStatus(r.status),
    last4: r.cardLast4 ?? undefined,
    decisionNote: r.decisionNote,
});

const mapLimitIncrease = (r: CardRequestItem): LimitIncreaseApproval => ({
    key: String(r.id),
    last4: r.cardLast4 ?? '----',
    date: formatReqDate(r.date),
    member: r.member ?? '-',
    currentLimit:
        r.payload?.currentLimit != null ? formatRupeesDecimal(r.payload.currentLimit) : '-',
    requestedIncrease:
        r.payload?.requestedAmount != null ? formatRupeesDecimal(r.payload.requestedAmount) : '-',
    reason: r.reason ?? '-',
    status: mapStatus(r.status),
    decisionNote: r.decisionNote,
});

const mapUnfreeze = (r: CardRequestItem): UnfreezeApproval => ({
    key: String(r.id),
    last4: r.cardLast4 ?? '----',
    date: formatReqDate(r.date),
    member: r.member ?? '-',
    frozenReason: r.payload?.freezeReasonNote ?? r.payload?.freezeReasonLabel ?? '-',
    reason: r.reason ?? '-',
    status: mapStatus(r.status),
    decisionNote: r.decisionNote,
});

const formatShippingAddress = (shipping: CardRequestItem['payload']['shipping']): string => {
    if (!shipping) return '-';
    const cityLine = [shipping.city, shipping.state].filter(Boolean).join(', ');
    const parts = [
        shipping.addressLine1,
        shipping.addressLine2,
        [cityLine, shipping.pinCode].filter(Boolean).join(' ').trim(),
    ].filter(Boolean);
    return parts.length ? parts.join(', ') : '-';
};

const mapPhysicalRequest = (r: CardRequestItem): PhysicalCardApproval => ({
    key: String(r.id),
    last4: r.cardLast4 ?? '----',
    date: formatReqDate(r.date),
    member: r.member ?? '-',
    shippingAddress: formatShippingAddress(r.payload?.shipping),
    reason: r.reason ?? '-',
    status: mapStatus(r.status),
    decisionNote: r.decisionNote,
});

interface RowHandlers {
    onApprove: (key: string) => void;
    onReject: (key: string) => void;
    approvingKeys: string[];
    rejectingKeys: string[];
    approveDisabledReason?: string | null;
    approveNote?: string | null;
}

const ApprovalStatusTag = ({
    status,
    tooltip,
}: {
    status: ApprovalStatus;
    /** Optional hover detail — e.g. the decision note behind a Rejected status. */
    tooltip?: string | null;
}) => {
    const tag = (
        <Tag
            bordered={false}
            className={cn(
                'm-0 rounded-full px-2 py-0.5 text-xs font-medium leading-none',
                STATUS_TONE[status]
            )}
        >
            {status}
        </Tag>
    );
    return tooltip ? <Tooltip title={tooltip}>{tag}</Tooltip> : tag;
};

const ActionCell = ({
    status,
    onApprove,
    onReject,
    approveLoading,
    rejectLoading,
    approveDisabledReason,
    approveNote,
}: {
    status: ApprovalStatus;
    onApprove?: () => void;
    onReject?: () => void;
    approveLoading?: boolean;
    rejectLoading?: boolean;
    approveDisabledReason?: string | null;
    approveNote?: string | null;
}) => {
    if (status !== 'Pending') return <Text className="text-sm text-textGreyLight">–</Text>;
    return (
        <div className="flex gap-2">
            <Button
                danger
                size="small"
                loading={rejectLoading}
                disabled={approveLoading}
                onClick={onReject}
            >
                Reject
            </Button>
            <Tooltip title={approveDisabledReason || approveNote || ''}>
                <span style={approveDisabledReason ? { cursor: 'not-allowed' } : undefined}>
                    <Button
                        type="primary"
                        size="small"
                        loading={approveLoading}
                        disabled={rejectLoading || !!approveDisabledReason}
                        onClick={onApprove}
                    >
                        {approveNote && !approveDisabledReason ? 'Approve & pay' : 'Approve'}
                    </Button>
                </span>
            </Tooltip>
        </div>
    );
};

const CardCell = ({ last4 }: { last4: string }) => (
    <div className="flex items-center gap-3">
        <img
            src={cardImage}
            alt="card"
            className="h-8 w-12 shrink-0 rounded-md object-cover shadow-sm"
        />
        <Text className="whitespace-nowrap text-sm text-textHeadings">**** **** **** {last4}</Text>
    </div>
);

const InfoNote = ({ text }: { text: string }) => (
    <div className="flex items-center gap-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-4">
        <InfoCircleOutlined className="shrink-0 text-textGreyLight" />
        <Text className="text-xs text-textBody">{text}</Text>
    </div>
);

const FilterField = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className="flex flex-col gap-1.5">
        <span className="text-sm text-textBody">{label}</span>
        {children}
    </div>
);

const buildCardReqColumns = (handlers: RowHandlers): ColumnsType<CardRequestApproval> => [
    { key: 'date', title: 'Date', dataIndex: 'date', width: 130 },
    { key: 'member', title: 'Member', dataIndex: 'member', width: 150 },
    { key: 'cardType', title: 'Card type', dataIndex: 'cardType', width: 130 },
    { key: 'limit', title: 'Limit', dataIndex: 'limit', width: 210 },
    {
        key: 'reason',
        title: 'Reason',
        dataIndex: 'reason',
        width: 240,
        render: (text: string) => <Text className="text-sm text-textBody">{text}</Text>,
    },
    {
        key: 'status',
        title: 'Status',
        dataIndex: 'status',
        width: 130,
        render: (status: ApprovalStatus, record: CardRequestApproval) => (
            <ApprovalStatusTag
                status={status}
                tooltip={status === 'Rejected' ? record.decisionNote : undefined}
            />
        ),
    },
    {
        key: 'actions',
        title: 'Actions',
        dataIndex: 'status',
        width: 170,
        render: (status: ApprovalStatus, record: CardRequestApproval) => (
            <ActionCell
                status={status}
                approveLoading={handlers.approvingKeys.includes(record.key)}
                rejectLoading={handlers.rejectingKeys.includes(record.key)}
                onApprove={() => handlers.onApprove(record.key)}
                onReject={() => handlers.onReject(record.key)}
            />
        ),
    },
];

const buildLimitColumns = (handlers: RowHandlers): ColumnsType<LimitIncreaseApproval> => [
    {
        key: 'card',
        title: 'Card',
        dataIndex: 'last4',
        width: 220,
        render: (last4: string) => <CardCell last4={last4} />,
    },
    { key: 'date', title: 'Date', dataIndex: 'date', width: 130 },
    { key: 'member', title: 'Member', dataIndex: 'member', width: 150 },
    { key: 'currentLimit', title: 'Current limit', dataIndex: 'currentLimit', width: 140 },
    {
        key: 'requestedIncrease',
        title: 'Requested increase',
        dataIndex: 'requestedIncrease',
        width: 170,
    },
    {
        key: 'reason',
        title: 'Reason',
        dataIndex: 'reason',
        width: 230,
        render: (text: string) => <Text className="text-sm text-textBody">{text}</Text>,
    },
    {
        key: 'status',
        title: 'Status',
        dataIndex: 'status',
        width: 130,
        render: (status: ApprovalStatus, record: LimitIncreaseApproval) => (
            <ApprovalStatusTag
                status={status}
                tooltip={status === 'Rejected' ? record.decisionNote : undefined}
            />
        ),
    },
    {
        key: 'actions',
        title: 'Actions',
        dataIndex: 'status',
        width: 170,
        render: (status: ApprovalStatus, record: LimitIncreaseApproval) => (
            <ActionCell
                status={status}
                approveLoading={handlers.approvingKeys.includes(record.key)}
                rejectLoading={handlers.rejectingKeys.includes(record.key)}
                onApprove={() => handlers.onApprove(record.key)}
                onReject={() => handlers.onReject(record.key)}
            />
        ),
    },
];

const buildUnfreezeColumns = (handlers: RowHandlers): ColumnsType<UnfreezeApproval> => [
    {
        key: 'card',
        title: 'Card',
        dataIndex: 'last4',
        width: 220,
        render: (last4: string) => <CardCell last4={last4} />,
    },
    { key: 'date', title: 'Date', dataIndex: 'date', width: 130 },
    { key: 'member', title: 'Member', dataIndex: 'member', width: 150 },
    {
        key: 'frozenReason',
        title: 'Frozen reason',
        dataIndex: 'frozenReason',
        width: 220,
        render: (text: string) => <Text className="text-sm text-textBody">{text}</Text>,
    },
    {
        key: 'reason',
        title: 'Reason',
        dataIndex: 'reason',
        width: 230,
        render: (text: string) => <Text className="text-sm text-textBody">{text}</Text>,
    },
    {
        key: 'status',
        title: 'Status',
        dataIndex: 'status',
        width: 130,
        render: (status: ApprovalStatus, record: UnfreezeApproval) => (
            <ApprovalStatusTag
                status={status}
                tooltip={status === 'Rejected' ? record.decisionNote : undefined}
            />
        ),
    },
    {
        key: 'actions',
        title: 'Actions',
        dataIndex: 'status',
        width: 170,
        render: (status: ApprovalStatus, record: UnfreezeApproval) => (
            <ActionCell
                status={status}
                approveLoading={handlers.approvingKeys.includes(record.key)}
                rejectLoading={handlers.rejectingKeys.includes(record.key)}
                onApprove={() => handlers.onApprove(record.key)}
                onReject={() => handlers.onReject(record.key)}
            />
        ),
    },
];

const buildPhysicalColumns = (handlers: RowHandlers): ColumnsType<PhysicalCardApproval> => [
    {
        key: 'virtualCard',
        title: 'Virtual Card',
        dataIndex: 'last4',
        width: 220,
        render: (last4: string) => <CardCell last4={last4} />,
    },
    { key: 'date', title: 'Date', dataIndex: 'date', width: 130 },
    { key: 'member', title: 'Member', dataIndex: 'member', width: 150 },
    {
        key: 'shippingAddress',
        title: 'Shipping address',
        dataIndex: 'shippingAddress',
        width: 270,
        render: (text: string) => <Text className="text-sm text-textBody">{text}</Text>,
    },
    {
        key: 'reason',
        title: 'Reason',
        dataIndex: 'reason',
        width: 230,
        render: (text: string) => <Text className="text-sm text-textBody">{text}</Text>,
    },
    {
        key: 'status',
        title: 'Status',
        dataIndex: 'status',
        width: 130,
        render: (status: ApprovalStatus, record: PhysicalCardApproval) => (
            <ApprovalStatusTag
                status={status}
                tooltip={status === 'Rejected' ? record.decisionNote : undefined}
            />
        ),
    },
    {
        key: 'actions',
        title: 'Actions',
        dataIndex: 'status',
        width: 170,
        render: (status: ApprovalStatus, record: PhysicalCardApproval) => (
            <ActionCell
                status={status}
                approveLoading={handlers.approvingKeys.includes(record.key)}
                rejectLoading={handlers.rejectingKeys.includes(record.key)}
                onApprove={() => handlers.onApprove(record.key)}
                onReject={() => handlers.onReject(record.key)}
                approveDisabledReason={handlers.approveDisabledReason}
                approveNote={handlers.approveNote}
            />
        ),
    },
];

type DateRange = [Dayjs | null, Dayjs | null] | null;

interface ApprovalFiltersProps {
    dateRange: DateRange;
    cardholder: string | undefined;
    card?: string | undefined;
    search: string;
    searchLabel?: string;
    cardholderOptions: { label: string; value: string }[];
    cardOptions?: { label: string; value: string }[];
    onDateChange: (v: DateRange) => void;
    onCardholderChange: (v: string | undefined) => void;
    onCardChange?: (v: string | undefined) => void;
    onSearchChange: (v: string) => void;
    onClear: () => void;
    hideCardFilter?: boolean;
}

const ApprovalFilters = ({
    dateRange,
    cardholder,
    card,
    search,
    searchLabel = 'Merchant',
    cardholderOptions,
    cardOptions,
    onDateChange,
    onCardholderChange,
    onCardChange,
    onSearchChange,
    onClear,
    hideCardFilter,
}: ApprovalFiltersProps) => (
    <div className="rounded-2xl border border-borderCard bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div
                className={cn(
                    'grid flex-1 max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2',
                    hideCardFilter
                        ? 'lg:grid-cols-[1fr_1fr_1.5fr]'
                        : 'lg:grid-cols-[1fr_1fr_1fr_1.5fr]'
                )}
            >
                <FilterField label="Date">
                    <RangePicker
                        placeholder={['Start date', 'End date']}
                        separator="→"
                        value={dateRange}
                        disabledDate={current => current > dayjs().endOf('day')}
                        onChange={dates => onDateChange(dates as DateRange)}
                        className="w-full"
                    />
                </FilterField>
                <FilterField label="Cardholder">
                    <Select
                        allowClear
                        placeholder="Select Cardholder"
                        value={cardholder}
                        onChange={onCardholderChange}
                        options={cardholderOptions}
                        className="w-full"
                    />
                </FilterField>
                {!hideCardFilter && (
                    <FilterField label="Cards">
                        <Select
                            allowClear
                            placeholder="Select Cards"
                            value={card}
                            onChange={onCardChange}
                            options={cardOptions}
                            className="w-full"
                        />
                    </FilterField>
                )}
                <FilterField label={searchLabel}>
                    <Input
                        prefix={<SearchOutlined className="text-textGreyLight" />}
                        placeholder="Search"
                        value={search}
                        onChange={e => onSearchChange(stripEmojis(e.target.value))}
                        allowClear
                    />
                </FilterField>
            </div>
            <Button
                type="text"
                icon={<CloseCircleOutlined />}
                onClick={onClear}
                className="ml-auto self-end text-textBody"
            >
                Clear
            </Button>
        </div>
    </div>
);

const PAGE_SIZE = 10;

const ApprovalRequests = () => {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [activeTab, setActiveTab] = useState(
        () => consumePendingSubTab('approval-requests') ?? 'transactions'
    );

    const [txnPendingMap, setTxnPendingMap] = useState<Record<number, 'approve' | 'reject'>>({});
    const [txnRefreshKey, setTxnRefreshKey] = useState(0);

    const decideTxn = useCallback(
        async (action: 'approve' | 'reject', txnId: number) => {
            setTxnPendingMap(prev => ({ ...prev, [txnId]: action }));
            const res = await approveTransactionDecision(
                role,
                id,
                txnId,
                action === 'approve' ? 'APPROVED' : 'REJECTED'
            );
            setTxnPendingMap(prev => {
                const next = { ...prev };
                delete next[txnId];
                return next;
            });
            if (res) {
                setTxnRefreshKey(k => k + 1);
                dispatch(
                    showToast({
                        variant: 'success',
                        description:
                            action === 'approve'
                                ? 'Request approved successfully'
                                : 'Request rejected successfully',
                    })
                );
            }
            return res;
        },
        [role, id, dispatch]
    );

    const [pendingAction, setPendingAction] = useState<{
        tab: ApprovalTab;
        action: 'approve' | 'reject';
        key: string;
    } | null>(null);
    const requestConfirm = useCallback(
        (tab: ApprovalTab, action: 'approve' | 'reject', key: string) =>
            setPendingAction({ tab, action, key }),
        []
    );
    const closePendingAction = () => setPendingAction(null);

    const txnApprovalHandlers = useMemo(
        () => ({
            onApprove: (txnId: number) => requestConfirm('transactions', 'approve', String(txnId)),
            onReject: (txnId: number) => requestConfirm('transactions', 'reject', String(txnId)),
            pendingMap: txnPendingMap,
        }),
        [requestConfirm, txnPendingMap]
    );
    const [cardPage, setCardPage] = useState(1);
    const [limitPage, setLimitPage] = useState(1);
    const [unfreezePage, setUnfreezePage] = useState(1);
    const [physPage, setPhysPage] = useState(1);

    const [txnDateRange, setTxnDateRange] = useState<DateRange>([
        dayjs().subtract(1, 'month'),
        dayjs(),
    ]);
    const [txnCardholder, setTxnCardholder] = useState<string | undefined>(undefined);
    const [txnCard, setTxnCard] = useState<string | undefined>(undefined);
    const [txnSearch, setTxnSearch] = useState('');
    const [txnCardholderOpts, setTxnCardholderOpts] = useState<{ label: string; value: string }[]>(
        []
    );
    const [txnCardOpts, setTxnCardOpts] = useState<{ label: string; value: string }[]>([]);
    const clearTxnFilters = () => {
        setTxnDateRange([dayjs().subtract(1, 'month'), dayjs()]);
        setTxnCardholder(undefined);
        setTxnCard(undefined);
        setTxnSearch('');
    };

    const [crDateRange, setCrDateRange] = useState<DateRange>([
        dayjs().subtract(1, 'month'),
        dayjs(),
    ]);
    const [crCardholder, setCrCardholder] = useState<string | undefined>(undefined);
    const [crSearch, setCrSearch] = useState('');
    const clearCrFilters = () => {
        setCrDateRange(null);
        setCrCardholder(undefined);
        setCrSearch('');
        setCardPage(1);
    };

    const fmtDate = (d: Dayjs | null | undefined) => d?.format('YYYY-MM-DD');

    const cardReq = useApprovalRequestsApi('CARD_ISSUANCE', cardPage, PAGE_SIZE, 'Virtual', {
        cardholder: crCardholder,
        dateFrom: fmtDate(crDateRange?.[0]) ?? undefined,
        dateTo: fmtDate(crDateRange?.[1]) ?? undefined,
        searchText: crSearch || undefined,
    });
    const limitReq = useApprovalRequestsApi('LIMIT_INCREASE', limitPage, PAGE_SIZE);
    const unfreezeReq = useApprovalRequestsApi('UNFREEZE', unfreezePage, PAGE_SIZE);
    const physReq = useApprovalRequestsApi('CARD_ISSUANCE', physPage, PAGE_SIZE, 'Physical');
    const { quota, refetchQuota } = useCardQuotaApi();
    const { startPurchase } = usePhysicalCardPurchase();

    const paidPhysicalApproval =
        pendingAction?.tab === 'physical-cards' &&
        pendingAction.action === 'approve' &&
        isPhysicalCardPurchase(quota);
    const pendingConfirmCopy = pendingAction
        ? buildConfirmCopy(
              pendingAction.tab,
              pendingAction.action,
              paidPhysicalApproval ? physicalCardPriceNote(quota, 'admin') : null
          )
        : null;

    const cardRequestRows = useMemo(() => cardReq.rows.map(mapCardRequest), [cardReq.rows]);
    const limitIncreaseRows = useMemo(() => limitReq.rows.map(mapLimitIncrease), [limitReq.rows]);
    const unfreezeRows = useMemo(() => unfreezeReq.rows.map(mapUnfreeze), [unfreezeReq.rows]);
    const physicalCardRows = useMemo(() => physReq.rows.map(mapPhysicalRequest), [physReq.rows]);

    const crCardholderOpts = useCardholderOptions();

    const decide = async (
        action: 'approve' | 'reject',
        hook: ReturnType<typeof useApprovalRequestsApi>,
        key: string,
        note?: string
    ) => {
        const res =
            action === 'approve'
                ? await hook.approve(Number(key))
                : await hook.reject(Number(key), note);
        if (res) {
            dispatch(
                showToast({
                    variant: 'success',
                    description:
                        action === 'approve'
                            ? 'Request approved successfully'
                            : 'Request rejected successfully',
                })
            );
        }
        return res;
    };

    const [rejectModal, setRejectModal] = useState<{ tab: ApprovalTab; key: string } | null>(null);
    const [rejectNote, setRejectNote] = useState('');
    const rejectNoteTrimmed = rejectNote.trim();
    const rejectNoteRequired =
        rejectModal?.tab === 'unfreeze-requests' && rejectNoteTrimmed.length === 0;
    const rejectNoteTooShort =
        rejectNoteTrimmed.length > 0 && rejectNoteTrimmed.length < REASON_NOTE_MIN;
    const rejectNoteInvalid = rejectNoteRequired || rejectNoteTooShort;
    const closeRejectModal = () => {
        setRejectModal(null);
        setRejectNote('');
    };
    const confirmRejectWithNote = async () => {
        if (!rejectModal) return;
        const res = await decide(
            'reject',
            hookForTab(rejectModal.tab),
            rejectModal.key,
            rejectNote.trim() || undefined
        );
        if (res) closeRejectModal();
    };

    const hookForTab = (tab: ApprovalTab) => {
        if (tab === 'card-requests') return cardReq;
        if (tab === 'limit-increases') return limitReq;
        if (tab === 'unfreeze-requests') return unfreezeReq;
        return physReq;
    };

    const isPendingActionLoading = () => {
        if (!pendingAction) return false;
        const { tab, action, key } = pendingAction;
        const numKey = Number(key);
        if (tab === 'transactions') return txnPendingMap[numKey] === action;
        const hook = hookForTab(tab);
        return action === 'approve'
            ? hook.approvingIds.includes(numKey)
            : hook.rejectingIds.includes(numKey);
    };

    const confirmPendingAction = async () => {
        if (!pendingAction) return;
        const { tab, action, key } = pendingAction;

        if (tab === 'physical-cards' && action === 'approve' && quota && isPhysicalCardPurchase(quota)) {
            const row = physReq.rows.find(item => String(item.id) === key);
            if (!row?.cardIssuanceId) {
                dispatch(
                    showToast({
                        variant: 'error',
                        description:
                            'This request has no source card, so a physical card cannot be ordered for it.',
                    })
                );
                return;
            }
            const started = await startPurchase({
                cardIssuanceId: String(row.cardIssuanceId),
                holderName: row.member ?? '',
                cardRequestId: row.id,
            });
            if (started) closePendingAction();
            return;
        }

        const res =
            tab === 'transactions'
                ? await decideTxn(action, Number(key))
                : await decide(action, hookForTab(tab), key);
        refetchQuota();
        if (res) {
            closePendingAction();
        }
    };

    const cardReqColumns = buildCardReqColumns({
        approvingKeys: cardReq.approvingIds.map(String),
        rejectingKeys: cardReq.rejectingIds.map(String),
        onApprove: key => requestConfirm('card-requests', 'approve', key),
        onReject: key => setRejectModal({ tab: 'card-requests', key }),
    });
    const limitColumns = buildLimitColumns({
        approvingKeys: limitReq.approvingIds.map(String),
        rejectingKeys: limitReq.rejectingIds.map(String),
        onApprove: key => requestConfirm('limit-increases', 'approve', key),
        onReject: key => setRejectModal({ tab: 'limit-increases', key }),
    });
    const unfreezeColumns = buildUnfreezeColumns({
        approvingKeys: unfreezeReq.approvingIds.map(String),
        rejectingKeys: unfreezeReq.rejectingIds.map(String),
        onApprove: key => requestConfirm('unfreeze-requests', 'approve', key),
        onReject: key => setRejectModal({ tab: 'unfreeze-requests', key }),
    });
    const physicalColumns = buildPhysicalColumns({
        approvingKeys: physReq.approvingIds.map(String),
        rejectingKeys: physReq.rejectingIds.map(String),
        onApprove: key => requestConfirm('physical-cards', 'approve', key),
        onReject: key => setRejectModal({ tab: 'physical-cards', key }),
        approveDisabledReason: physicalCardBlockReason(quota, 'admin'),
        approveNote: physicalCardPriceNote(quota, 'admin'),
    });

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
                <Title level={3} className="!mb-0 !text-textHeadings">
                    Approval Requests
                </Title>
                <Text className="text-sm text-textBody">
                    Review approval requests from members across transactions, expenses, invoices,
                    and card controls.
                </Text>
            </div>

            <PageTabs tabs={APPROVAL_TABS} activeKey={activeTab} onChange={setActiveTab} />

            {activeTab === 'transactions' && (
                <div className="flex flex-col gap-4">
                    <ApprovalFilters
                        dateRange={txnDateRange}
                        cardholder={txnCardholder}
                        card={txnCard}
                        search={txnSearch}
                        searchLabel="Merchant"
                        cardholderOptions={txnCardholderOpts}
                        cardOptions={txnCardOpts}
                        onDateChange={setTxnDateRange}
                        onCardholderChange={setTxnCardholder}
                        onCardChange={setTxnCard}
                        onSearchChange={setTxnSearch}
                        onClear={clearTxnFilters}
                    />
                    <TransactionsSection
                        variant="admin"
                        hideHeader
                        hideActions
                        onOptionsChange={opts => {
                            setTxnCardholderOpts(opts.cardholderOptions);
                            setTxnCardOpts(opts.cardOptions);
                        }}
                        externalFilters={{
                            dateRange: txnDateRange,
                            search: txnSearch,
                            selectedCardholder: txnCardholder,
                            selectedAdminCard: txnCard,
                        }}
                        approvalHandlers={txnApprovalHandlers}
                        refreshKey={txnRefreshKey}
                    />
                </div>
            )}

            {activeTab === 'card-requests' && (
                <div className="flex flex-col gap-4">
                    <ApprovalFilters
                        hideCardFilter
                        dateRange={crDateRange}
                        cardholder={crCardholder}
                        search={crSearch}
                        searchLabel="Search"
                        cardholderOptions={crCardholderOpts}
                        onDateChange={v => {
                            setCrDateRange(v);
                            setCardPage(1);
                        }}
                        onCardholderChange={v => {
                            setCrCardholder(v);
                            setCardPage(1);
                        }}
                        onSearchChange={v => {
                            setCrSearch(v);
                            setCardPage(1);
                        }}
                        onClear={clearCrFilters}
                    />
                    <InfoNote text="Card issuance requests submitted by cardholders. On approval, the card is issued with the approved limit." />
                    <GenericTable
                        columns={cardReqColumns}
                        dataSource={cardRequestRows}
                        loading={cardReq.isLoading}
                        rowKey="key"
                        pagination={{
                            current: cardPage,
                            pageSize: PAGE_SIZE,
                            total: cardReq.total,
                            onChange: setCardPage,
                            showSizeChanger: false,
                        }}
                    />
                </div>
            )}

            {activeTab === 'limit-increases' && (
                <div className="flex flex-col gap-4">
                    <InfoNote text="Limit-increase requests submitted by cardholders. On approval, the additional limit is applied to the card." />
                    <GenericTable
                        columns={limitColumns}
                        dataSource={limitIncreaseRows}
                        loading={limitReq.isLoading}
                        rowKey="key"
                        pagination={{
                            current: limitPage,
                            pageSize: PAGE_SIZE,
                            total: limitReq.total,
                            onChange: setLimitPage,
                            showSizeChanger: false,
                        }}
                    />
                </div>
            )}

            {activeTab === 'unfreeze-requests' && (
                <div className="flex flex-col gap-4">
                    <InfoNote text="Members can ask for a card their admin froze to be unfrozen. On approval the card is unfrozen immediately." />
                    <GenericTable
                        columns={unfreezeColumns}
                        dataSource={unfreezeRows}
                        loading={unfreezeReq.isLoading}
                        rowKey="key"
                        pagination={{
                            current: unfreezePage,
                            pageSize: PAGE_SIZE,
                            total: unfreezeReq.total,
                            onChange: setUnfreezePage,
                            showSizeChanger: false,
                        }}
                    />
                </div>
            )}

            {activeTab === 'physical-cards' && (
                <div className="flex flex-col gap-4">
                    <InfoNote text="Members can request a physical companion for an existing virtual card. On approval, a physical card with the same limits is issued." />
                    <GenericTable
                        columns={physicalColumns}
                        dataSource={physicalCardRows}
                        loading={physReq.isLoading}
                        rowKey="key"
                        pagination={{
                            current: physPage,
                            pageSize: PAGE_SIZE,
                            total: physReq.total,
                            onChange: setPhysPage,
                            showSizeChanger: false,
                        }}
                    />
                </div>
            )}

            <Modal
                open={rejectModal !== null}
                onCancel={closeRejectModal}
                footer={null}
                centered
                classNames={ROUNDED_MODAL_CLASSNAMES}
                closeIcon={MODAL_CLOSE_ICON}
            >
                <div className="flex flex-col gap-4 py-2">
                    <Title level={4} className="!mb-0 !text-textHeadings">
                        {rejectModal ? REJECT_MODAL_TITLE[rejectModal.tab] : ''}
                    </Title>
                    <Text className="text-sm text-textBody">
                        Let the member know why this request is being rejected — they&apos;ll see
                        this note on their My Requests page.
                    </Text>
                    <Input.TextArea
                        rows={4}
                        placeholder={
                            rejectModal?.tab === 'unfreeze-requests'
                                ? 'Enter a reason (required)'
                                : 'Enter a reason (optional)'
                        }
                        value={rejectNote}
                        onChange={e => setRejectNote(sanitizeReasonNote(e.target.value))}
                        maxLength={500}
                        status={rejectNoteInvalid ? 'error' : ''}
                    />
                    {rejectNoteRequired && (
                        <Text className="-mt-3 text-xs text-textLightRed">
                            Please enter a reason.
                        </Text>
                    )}
                    {!rejectNoteRequired && rejectNoteTooShort && (
                        <Text className="-mt-3 text-xs text-textLightRed">
                            Please enter at least {REASON_NOTE_MIN} characters.
                        </Text>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                        <Button onClick={closeRejectModal} className="font-medium">
                            Cancel
                        </Button>
                        <Button
                            danger
                            type="primary"
                            loading={
                                rejectModal !== null &&
                                hookForTab(rejectModal.tab).rejectingIds.includes(
                                    Number(rejectModal.key)
                                )
                            }
                            disabled={rejectNoteInvalid}
                            onClick={confirmRejectWithNote}
                            className="font-medium"
                        >
                            Reject request
                        </Button>
                    </div>
                </div>
            </Modal>

            <ConfirmActionModal
                open={pendingAction !== null}
                title={pendingConfirmCopy?.title ?? ''}
                description={pendingConfirmCopy?.description ?? ''}
                confirmLabel={pendingConfirmCopy?.confirmLabel ?? ''}
                danger={pendingAction?.action === 'reject'}
                loading={isPendingActionLoading()}
                onCancel={closePendingAction}
                onConfirm={confirmPendingAction}
            />
        </div>
    );
};

export default ApprovalRequests;
