import { useEffect, useState } from 'react';

import { ArrowRightOutlined, FilePdfOutlined } from '@ant-design/icons';
import { Button, Card, Col, Divider, Flex, Image, Row, Skeleton, Steps, Table, Typography, Input } from 'antd';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';

import { useAppDispatch } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import CancelOrderModal from '../components/CancelOrderModal';
import IssuePhotoPicker from '../components/IssuePhotoPicker';
import RaiseIssueModal from '../components/modals/RaiseIssueModal';
import OndcStatusTag from '../components/OrderHistory/OndcStatusTag';
import ReturnOrderModal from '../components/ReturnOrderModal';
import { useOndcOrderDetailApi } from '../hooks/useOndcOrderDetailApi';
import { OndcIssue, OndcIssueResolution } from '../types/ondcIssue';
import {
    OndcOrderDetailItem,
    OndcOrderFulfillment,
    OndcOrderStatusHistoryEntry,
    OndcOrderTracking,
} from '../types/ondcOrderHistory';
import {
    FULFILLMENT_STATE_STEP_INDEX,
    formatFulfillmentStateLabel,
    formatStatusHistoryLabel,
    getDeliveryFulfillment,
    isCancellableBeforeShipping,
    isReturnableAfterDelivery,
} from '../utils/fulfillmentStatus';
import { IssuePhoto } from '../utils/issuePhoto';
import { getIssueWireStatusPill, mapCategoryToDisplay, mapSubCategoryToDisplay } from '../utils/issueTaxonomy';
import { formatInr } from '../utils/priceInr';
import { getItemsTotal, getOtherChargeRows } from '../utils/quoteSummary';

const { Text } = Typography;
const { TextArea } = Input;

const ORDER_STATUS_STEPS = ['Order created', 'Order confirmed', 'In progress', 'Shipped', 'Delivered'];

const buildStatusSteps = (
    isCancelled: boolean,
    delivery: OndcOrderFulfillment | undefined
) => {
    const stateCode = delivery?.state?.descriptor?.code;

    if (isCancelled) {
        const lastProgressIndex = stateCode && stateCode !== 'Cancelled'
            ? (FULFILLMENT_STATE_STEP_INDEX[stateCode] ?? 0)
            : 0;
        return {
            items: [
                ...ORDER_STATUS_STEPS.slice(0, lastProgressIndex + 1).map(title => ({
                    title,
                    status: 'finish' as const,
                })),
                { title: 'Order cancelled', status: 'error' as const },
            ],
        };
    }

    const currentIndex = stateCode ? (FULFILLMENT_STATE_STEP_INDEX[stateCode] ?? 0) : 0;

    return {
        items: ORDER_STATUS_STEPS.map((title, index) => ({
            title,
            status: (index <= currentIndex ? 'finish' : 'wait') as 'finish' | 'wait',
        })),
    };
};

const formatTimestamp = (iso: string) => dayjs(iso).format('MMMM D, YYYY [at] hh:mm A');

type TrackingTimelineEntry = { title: string; description: string; status: 'finish' | 'error' };

const buildTrackingTimeline = (
    isCancelled: boolean,
    delivery: OndcOrderFulfillment | undefined,
    tracking: OndcOrderTracking | null,
    statusHistory?: OndcOrderStatusHistoryEntry[]
): TrackingTimelineEntry[] => {
    if (statusHistory && statusHistory.length > 0) {
        const entries = statusHistory.reduce<TrackingTimelineEntry[]>((acc, entry) => {
            const title = formatStatusHistoryLabel(entry);
            const prev = acc[acc.length - 1];
            if (prev?.title === title) return acc;
            acc.push({
                title,
                description: entry.at ? formatTimestamp(entry.at) : 'Latest known status',
                status: (entry.code === 'Cancelled' ? 'error' : 'finish') as 'finish' | 'error',
            });
            return acc;
        }, []);
        if (isCancelled && !entries.some(e => e.title === 'Cancelled' || e.title === 'Order cancelled')) {
            entries.push({
                title: 'Order cancelled',
                description: 'No further shipment updates apply to this order.',
                status: 'error',
            });
        }
        return entries;
    }

    const stateCode = delivery?.state?.descriptor?.code;
    const entries: TrackingTimelineEntry[] = [];

    if (delivery?.start?.time?.timestamp) {
        entries.push({
            title: 'Picked up from seller',
            description: formatTimestamp(delivery.start.time.timestamp),
            status: 'finish',
        });
    }

    const deliveredAt = stateCode === 'Order-delivered' ? delivery?.end?.time?.timestamp : undefined;
    if (deliveredAt) {
        entries.push({ title: 'Delivered', description: formatTimestamp(deliveredAt), status: 'finish' });
    } else if (stateCode && stateCode !== 'Cancelled') {
        entries.push({
            title: formatFulfillmentStateLabel(stateCode),
            description: tracking?.updatedAt ? `Updated ${formatTimestamp(tracking.updatedAt)}` : 'Latest known status',
            status: 'finish',
        });
    }

    if (isCancelled) {
        entries.push({
            title: 'Order cancelled',
            description: 'No further shipment updates apply to this order.',
            status: 'error',
        });
    }

    return entries;
};

// Evidence thumbnails on a thread event (public URLs) — click to preview.
const EventThumbnails = ({ images }: { images?: string[] }) => {
    if (!images || images.length === 0) return null;
    return (
        <Flex gap={8} wrap="wrap" className="mt-2" align="center">
            {images.map((url, i) => {
                const isPdf = url.toLowerCase().split('?')[0].endsWith('.pdf');
                if (isPdf) {
                    return (
                        <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-lg border border-[#e4e7ec] bg-[#f9fafb] px-3 py-2 text-[13px] font-medium text-[#344054] hover:bg-[#f3f4f6] transition-colors"
                        >
                            <FilePdfOutlined className="text-red-500 text-[16px]" />
                            <span>View Document</span>
                        </a>
                    );
                }
                return (
                    <Image
                        key={i}
                        src={url}
                        width={64}
                        height={64}
                        className="!rounded-lg !object-cover"
                    />
                );
            })}
        </Flex>
    );
};

// Human wording for the IGM 2.0 resolution codes. Unknown codes fall through to
// the raw code rather than being hidden — a resolution we can't label is still
// something the buyer needs to see.
const RESOLUTION_LABELS: Record<string, string> = {
    REFUND: 'Refund',
    REPLACEMENT: 'Replacement',
    RETURN: 'Return',
    CANCEL: 'Cancellation',
    NO_ACTION: 'No action required',
    'NOW-VISIBLE': 'Now visible',
    NOW_VISIBLE: 'Now visible',
};

// Labels for the RESOLUTION_DETAILS entries that ride a resolution.
const RESOLUTION_DETAIL_LABELS: Record<string, string> = {
    REFUND_AMOUNT: 'Refund amount',
    ITEM: 'Item',
};

/**
 * What the seller has proposed to settle the complaint (IGM 2.0).
 *
 * The event thread only says "a resolution was proposed"; this is what it
 * actually is — the offer, and any amount or item attached to it.
 */
const IssueResolutions = ({
    resolutions,
    selectedId,
    onSelect,
}: {
    resolutions?: OndcIssueResolution[];
    selectedId?: string | null;
    onSelect?: (id: string) => void;
}) => {
    if (!resolutions || resolutions.length === 0) return null;
    const selectable = Boolean(onSelect) && resolutions.length > 0;
    return (
        <Flex vertical gap={8}>
            <Text className="text-[15px] font-medium text-[#101828]">
                {resolutions.length > 1 ? "Seller's proposed resolutions" : "Seller's proposed resolution"}
            </Text>
            {selectable && resolutions.length > 1 && (
                <Text className="text-[13px] text-[#475156]">Select refund or replacement, then accept.</Text>
            )}
            {resolutions.map((resolution, idx) => {
                const id = resolution.id || `option-${idx}`;
                const selected = selectable && selectedId === id;
                return (
                    <button
                        type="button"
                        key={id}
                        disabled={!selectable}
                        onClick={() => onSelect?.(id)}
                        className={`w-full rounded-xl border p-4 text-left ${
                            selectable ? 'cursor-pointer' : 'cursor-default'
                        } ${
                            selected
                                ? 'border-[#155EEF] bg-white ring-1 ring-[#155EEF]'
                                : 'border-[#E4E7EC] bg-[#F7FBFF]'
                        }`}
                    >
                        <Text className="text-[15px] font-medium text-[#101828]">
                            {RESOLUTION_LABELS[resolution.code] || resolution.code}
                        </Text>
                        {resolution.shortDesc && (
                            <div className="mt-1 text-[15px] text-[#475156]">{resolution.shortDesc}</div>
                        )}
                        {resolution.details.length > 0 && (
                            <Flex gap={16} wrap="wrap" className="mt-2">
                                {resolution.details.map((detail, i) => (
                                    <div key={i} className="text-[13px] text-[#475156]">
                                        <span className="text-[#868686]">
                                            {RESOLUTION_DETAIL_LABELS[detail.code] || detail.code}:{' '}
                                        </span>
                                        <span className="font-medium text-[#101828]">
                                            {detail.code === 'REFUND_AMOUNT' && detail.value
                                                ? formatInr(Number(detail.value))
                                                : detail.value}
                                        </span>
                                    </div>
                                ))}
                            </Flex>
                        )}
                    </button>
                );
            })}
        </Flex>
    );
};

// Reply block for the seller's "Information requested" — matches Figma
// (node 2807-25222): a labelled "Your reply" textarea inside a gray panel, an
// optional "Photos" picker, and two actions — "I can't prove this" (a reply
// noting no evidence is available; does NOT close the issue) and "Send
// response" (a substantive reply, optionally with photos the backend hosts +
// forwards to the seller).
const IssueReplyBox = ({
    onSend,
}: {
    onSend: (text: string, cannotProvideProof: boolean, images: IssuePhoto[]) => Promise<void>;
}) => {
    const [replyText, setReplyText] = useState('');
    const [photos, setPhotos] = useState<IssuePhoto[]>([]);
    const [submitting, setSubmitting] = useState<'reply' | 'cant' | null>(null);

    const handleSend = async () => {
        if (!replyText.trim()) return;
        setSubmitting('reply');
        await onSend(replyText, false, photos);
        setReplyText('');
        setPhotos([]);
        setSubmitting(null);
    };

    const handleCantProve = async () => {
        setSubmitting('cant');
        await onSend('', true, []);
        setSubmitting(null);
    };

    return (
        <Flex vertical gap={12} className="w-full rounded-2xl bg-[#f7f7f7] p-4">
            <Flex vertical gap={8}>
                <Text className="text-[14px] font-medium text-black">Your reply</Text>
                <TextArea
                    rows={3}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Type your reply to seller"
                    disabled={submitting !== null}
                    className="!rounded-xl !bg-white"
                />
            </Flex>
            <IssuePhotoPicker value={photos} onChange={setPhotos} disabled={submitting !== null} />
            {/* Stacked full-width below sm (primary on top): side by side the two
                didn't fit a 320px panel and "I can't prove this" spilled out of it. */}
            <Flex gap={8} className="flex-col-reverse sm:flex-row sm:justify-end sm:gap-3">
                <Button
                    type="text"
                    disabled={submitting !== null}
                    loading={submitting === 'cant'}
                    onClick={handleCantProve}
                    className="!h-10 !w-full !rounded-lg !px-4 !font-medium !text-lightRed sm:!w-auto"
                >
                    I can&apos;t prove this
                </Button>
                <Button
                    type="primary"
                    disabled={!replyText.trim() || submitting !== null}
                    loading={submitting === 'reply'}
                    onClick={handleSend}
                    danger
                    className="!h-10 !w-full !rounded-lg !font-medium sm:!w-auto"
                >
                    Send response
                </Button>
            </Flex>
        </Flex>
    );
};

const EVENT_FALLBACK_LABELS: Record<string, string> = {
    ACKNOWLEDGED: 'Seller is processing your complaint',
    RESOLUTION_PROPOSED: 'Seller has proposed a resolution',
    RESOLUTION_ACCEPTED: 'Resolution accepted',
    RESOLUTION_REJECTED: 'Resolution rejected',
    ESCALATED: 'Issue escalated',
    RESOLVED: 'Seller has resolved this issue',
    CLOSED: 'Issue closed',
    INFO_REQUESTED: 'Seller has asked for more information',
    OPEN: 'Issue opened',
};

const eventMessage = (message?: string, eventType?: string) =>
    (message && message.trim()) ||
    EVENT_FALLBACK_LABELS[String(eventType || '').toUpperCase()] ||
    'Seller updated this issue';

const isEscalatedIssueLevel = (level?: string | null) =>
    ['GRIEVANCE', 'GREVIENCE'].includes(String(level || '').toUpperCase());

const IssueFlowActions = ({
    issue,
    busy,
    selectedResolution,
    onReject,
    onEscalate,
    onAccept,
    onClose,
}: {
    issue: OndcIssue;
    busy: boolean;
    selectedResolution?: OndcIssueResolution | null;
    onReject: () => Promise<boolean>;
    onEscalate: () => Promise<boolean>;
    onAccept: () => Promise<boolean>;
    onClose: () => Promise<boolean>;
}) => {
    const proposed = issue.status === 'RESOLUTION_PROPOSED';
    const canClose = issue.status === 'RESOLVED' || issue.status === 'RESOLUTION_ACCEPTED';
    const canEscalate =
        !canClose &&
        issue.status !== 'CLOSED' &&
        !isEscalatedIssueLevel(issue.level) &&
        issue.events.some(e => e.eventType === 'RESOLUTION_REJECTED');
    const acceptLabel = selectedResolution?.code
        ? `Accept ${(RESOLUTION_LABELS[selectedResolution.code] || selectedResolution.code).toLowerCase()}`
        : 'Accept resolution';

    if (!proposed && !canEscalate && !canClose) return null;

    return (
        <Flex gap={12} wrap="wrap" justify="end">
            {canEscalate && (
                <Button
                    disabled={busy}
                    loading={busy}
                    onClick={onEscalate}
                    className="!h-10 !rounded-xl"
                >
                    Escalate to grievance
                </Button>
            )}
            {proposed && (
                <>
                    <Button
                        disabled={busy}
                        loading={busy}
                        onClick={onReject}
                        className="!h-10 !rounded-xl"
                    >
                        Reject resolution
                    </Button>
                    <Button
                        type="primary"
                        disabled={busy || !selectedResolution}
                        loading={busy}
                        onClick={onAccept}
                        className="!h-10 !rounded-xl"
                    >
                        {acceptLabel}
                    </Button>
                </>
            )}
            {canClose && (
                <Button
                    type="primary"
                    disabled={busy}
                    loading={busy}
                    onClick={onClose}
                    className="!h-10 !rounded-xl"
                >
                    Close issue
                </Button>
            )}
        </Flex>
    );
};

const defaultResolutionId = (resolutions?: OndcIssueResolution[]) => {
    const list = resolutions || [];
    return list.find(r => r.code === 'REPLACEMENT')?.id || list[0]?.id || null;
};

const returnSuccessMessage = (isReplace: boolean, refunded: boolean, returnStatus?: string | null) => {
    if (isReplace) {
        return 'Replacement request submitted. The seller will send a replacement — there is no refund.';
    }
    if (refunded) {
        return 'Return accepted — your refund has been initiated.';
    }
    const statusLabel = returnStatus ? ` (${returnStatus.replace(/_/g, ' ')})` : '';
    return `Return request submitted${statusLabel}. We'll update you as the seller processes it.`;
};

const IssueOfferBlock = ({
    issue,
    busy,
    onReject,
    onEscalate,
    onAccept,
    onClose,
}: {
    issue: OndcIssue;
    busy: boolean;
    onReject: () => Promise<boolean>;
    onEscalate: () => Promise<boolean>;
    onAccept: (resolution: OndcIssueResolution | null) => Promise<boolean>;
    onClose: () => Promise<boolean>;
}) => {
    const proposed = issue.status === 'RESOLUTION_PROPOSED';
    const [selectedId, setSelectedId] = useState<string | null>(() => defaultResolutionId(issue.resolutions));

    useEffect(() => {
        setSelectedId(defaultResolutionId(issue.resolutions));
    }, [issue.id, issue.status, issue.resolutions]);

    const selected = (issue.resolutions || []).find(r => r.id === selectedId) || null;

    return (
        <>
            <IssueResolutions
                resolutions={issue.resolutions}
                selectedId={proposed ? selectedId : null}
                onSelect={proposed ? setSelectedId : undefined}
            />
            <IssueFlowActions
                issue={issue}
                busy={busy}
                selectedResolution={selected}
                onReject={onReject}
                onEscalate={onEscalate}
                onAccept={() => onAccept(selected)}
                onClose={onClose}
            />
        </>
    );
};

const OrderedProductDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const {
        order,
        issues,
        isLoading,
        notFound,
        cancelOrder,
        returnOrder,
        raiseIssue,
        replyToIssue,
        rejectIssue,
        escalateIssue,
        acceptIssue,
        closeIssue,
        isRefreshingStatus,
        isRefreshingTracking,
        refreshStatus,
        refreshTracking,
    } = useOndcOrderDetailApi(id!);

    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [returnModalOpen, setReturnModalOpen] = useState(false);
    const [raiseModalOpen, setRaiseModalOpen] = useState(false);
    const [issueActionBusyId, setIssueActionBusyId] = useState<number | null>(null);

    useEffect(() => {
        if (notFound) {
            navigate(`${paths.dashboard.officeSupplies}/${paths.officeSupplies.orderHistory}`, {
                replace: true,
            });
        }
    }, [notFound, navigate]);

    if (isLoading) {
        return (
            <Flex vertical gap={50}>
                <Skeleton avatar paragraph={{ rows: 4 }} />
                <Skeleton paragraph={{ rows: 10 }} />
            </Flex>
        );
    }
    if (!order) return null;

    const { quote } = order;
    const itemsTotal = getItemsTotal(quote, order.totalAmount);
    // Packing/tax/misc rows the seller charged on top of items + delivery. Without
    // these the summary rows don't add up to what was actually paid.
    const otherChargeRows = getOtherChargeRows(quote);

    const handleCancelOrder = () => {
        setCancelModalOpen(true);
    };

    const columns = [
        { title: 'Products', dataIndex: 'productName', key: 'productName' },
        {
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
            render: (price: number) => formatInr(price),
        },
        { title: 'Quantity', dataIndex: 'quantity', key: 'quantity' },
        {
            title: 'Sub-Total',
            key: 'subTotal',
            render: (_: unknown, record: OndcOrderDetailItem) =>
                formatInr((record.price || 0) * (record.quantity || 1)),
        },
    ];

    const { billing } = order;
    const address = billing?.address;

    const deliveryFulfillment = getDeliveryFulfillment(order.fulfillments);
    const isCancelled = order.orderState === 'Cancelled' || deliveryFulfillment?.state?.descriptor?.code === 'Cancelled';
    const statusSteps = buildStatusSteps(isCancelled, deliveryFulfillment);
    const trackingTimeline = buildTrackingTimeline(
        isCancelled,
        deliveryFulfillment,
        order.tracking,
        order.statusHistory
    );

    const canCancel =
        order.orderState !== 'Cancelled' &&
        order.orderState !== 'Completed' &&
        order.items.length > 0 &&
        order.items.every(i => i.cancellable !== false) &&
        isCancellableBeforeShipping(order.fulfillments, {
            deliveredAt: order.deliveredAt ?? null,
            orderState: order.orderState,
        });

    const canReturn = isReturnableAfterDelivery({
        orderState: order.orderState,
        deliveredAt: order.deliveredAt ?? null,
        fulfillments: order.fulfillments,
        items: order.items,
        returnStatus: order.returnStatus ?? null,
        returnWindow: order.returnWindow ?? null,
    });

    const cancelBlockedReason = () => {
        if (order.orderState === 'Cancelled') return 'This order has been cancelled.';
        if (order.orderState === 'Completed') return 'This order has already been delivered.';
        if (
            !isCancellableBeforeShipping(order.fulfillments, {
                deliveredAt: order.deliveredAt ?? null,
                orderState: order.orderState,
            })
        ) {
            return "This order can't be cancelled after it has shipped.";
        }
        return "This order can't be cancelled per the seller's policy.";
    };

    const noTrackingMessage = isCancelled
        ? {
              title: 'This order was cancelled',
              description: 'No shipment tracking applies to this order.',
          }
        : {
              title: 'Tracking not available for this order yet',
              description:
                  "The seller hasn't shared live tracking for this shipment yet. Check back later — we'll show courier and shipment updates here as soon as they're available.",
          };

    const canCallSeller = Boolean(order.bppUri && order.orderId);

    const handleRefreshStatus = async () => {
        const result = await refreshStatus();
        if (!result) {
            dispatch(
                showToast({
                    description: 'Could not refresh order status — please try again.',
                    variant: 'error',
                })
            );
            return;
        }
        dispatch(
            showToast({
                description: result.received
                    ? 'Order status updated from the seller.'
                    : 'The seller did not respond in time. Showing the last known status.',
                variant: result.received ? 'success' : 'error',
            })
        );
    };

    const handleRefreshTracking = async () => {
        const result = await refreshTracking();
        if (!result) {
            dispatch(
                showToast({
                    description: 'Could not fetch shipment tracking — please try again.',
                    variant: 'error',
                })
            );
            return;
        }
        dispatch(
            showToast({
                description: result.received
                    ? 'Shipment tracking updated from the seller.'
                    : 'The seller did not respond in time. Showing the last known tracking.',
                variant: result.received ? 'success' : 'error',
            })
        );
    };

    return (
        <Flex vertical gap={32}>
            {/* Header */}
            <Flex vertical gap={8}>
                <Flex align="center" gap={12} wrap="wrap">
                    <Text className="text-[25px] font-medium text-black">
                        Order {order.orderId || order.transactionId}
                    </Text>
                    <OndcStatusTag
                        status={order.orderState || 'Created'}
                        deliveryStatusCode={deliveryFulfillment?.state?.descriptor?.code}
                    />
                </Flex>
                <Text className="text-[17px] text-[#868686]">
                    Sold by {order.vendorName || '-'} · Placed{' '}
                    {dayjs(order.createdAt).format('MMMM D, YYYY [at] hh:mm A')}
                </Text>
            </Flex>

            {/* Products Table */}
            <Card className="!rounded-3xl">
                {/* scroll.x: the only Table in this domain without a mobile variant.
                    Without it the columns force the page wider than a phone; now it
                    scrolls inside its own Card instead. */}
                <Table
                    dataSource={order.items.map((item, index) => ({ ...item, key: index }))}
                    columns={columns}
                    pagination={false}
                    scroll={{ x: 'max-content' }}
                />
            </Card>

            {/* Address, Payment, Summary Card Block. Stacked below md, so the cards need
                a vertical gutter or they butt into each other; and no horizontal gutter
                there — a 24px one adds -12px side margins that push a phone page wider
                than the screen. */}
            <Row gutter={[{ xs: 0, md: 24 }, 16]}>
                <Col xs={24} md={8}>
                    <Card className="h-full !rounded-3xl !border-t-4 !border-lightRed">
                        <Flex vertical gap={16}>
                            <Text className="text-[19px] font-semibold text-[#1e293b]">
                                Delivery address
                            </Text>
                            <Text className="text-[16px] text-[#6a6a6a]">
                                {billing?.name}
                                <br />
                                {[address?.building, address?.locality].filter(Boolean).join(', ')}
                                <br />
                                {[address?.city, address?.state, address?.area_code]
                                    .filter(Boolean)
                                    .join(', ')}
                                <br />
                                {billing?.phone}
                            </Text>
                            <Text className="text-[13px] italic text-[#868686] mt-auto pt-2">
                                Invoice will be sent to your registered email ID
                            </Text>
                        </Flex>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card className="h-full !rounded-3xl !border-t-4 !border-lightRed">
                        <Flex vertical gap={16}>
                            <Text className="text-[19px] font-semibold text-[#1e293b]">Payment</Text>
                            <Flex vertical gap={15}>
                                <Flex justify="space-between">
                                    <Text className="text-[#4a5565]">Amount paid</Text>
                                    <Text className="font-medium text-[#252430]">
                                        {formatInr(order.amountPaid)}
                                    </Text>
                                </Flex>
                                <Flex justify="space-between">
                                    <Text className="text-[#4a5565]">Transaction ID</Text>
                                    <Text className="font-medium text-[#252430]">
                                        {order.paymentRef || order.transactionId}
                                    </Text>
                                </Flex>
                                <Flex justify="space-between">
                                    <Text className="text-[#4a5565]">Payment mode</Text>
                                    <Text className="font-medium text-[#252430]">Payment Gateway</Text>
                                </Flex>
                            </Flex>
                        </Flex>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card className="h-full !rounded-3xl !border-t-4 !border-lightRed">
                        <Flex vertical gap={16}>
                            <Text className="text-[19px] font-semibold text-[#1e293b]">Summary</Text>
                            <Flex vertical gap={15}>
                                <Flex justify="space-between">
                                    <Text className="text-[#4a5565]">Items total</Text>
                                    <Text className="text-[#252430]">{formatInr(itemsTotal)}</Text>
                                </Flex>
                                <Flex justify="space-between">
                                    <Text className="text-[#4a5565]">Delivery</Text>
                                    <Text className="text-[#1e293b]">
                                        {formatInr(quote?.deliveryCharge ?? 0)}
                                    </Text>
                                </Flex>
                                {otherChargeRows.map(row => (
                                    <Flex key={row.label} justify="space-between">
                                        <Text className="text-[#4a5565]">{row.label}</Text>
                                        <Text className="text-[#1e293b]">
                                            {formatInr(row.amount)}
                                        </Text>
                                    </Flex>
                                ))}
                                {order.platformFee > 0 && (
                                    <Flex justify="space-between">
                                        <Text className="text-[#4a5565]">
                                            Platform fee (inclusive of GST)
                                        </Text>
                                        <Text className="text-[#1e293b]">
                                            {formatInr(order.platformFee)}
                                        </Text>
                                    </Flex>
                                )}
                                <Divider className="!my-1" />
                                <Flex justify="space-between">
                                    <Text className="font-semibold text-[#101828]">Total</Text>
                                    <Text className="font-medium text-[#252430]">
                                        {formatInr(order.amountPaid)}
                                    </Text>
                                </Flex>
                            </Flex>
                        </Flex>
                    </Card>
                </Col>
            </Row>

            {/* Action buttons under Summary block */}
            <Flex justify="end" align="center" wrap="wrap" gap={16} className="w-full">
                {order.returnStatus ? (
                    <Text className="text-[14px] text-[#667085]">
                        Return status: {order.returnStatus.replace(/_/g, ' ')}
                    </Text>
                ) : null}
                {/* Seller-issued invoice, present only once on_status has carried one.
                    A third-party URL, hence noopener/noreferrer. */}
                {order.invoiceUrl ? (
                    <Button
                        href={order.invoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="!flex !h-10 !items-center !gap-2 !rounded-xl !border-lightRed !text-[15px] !font-medium !text-lightRed"
                    >
                        Download invoice
                    </Button>
                ) : null}
                <Button
                    onClick={() => setRaiseModalOpen(true)}
                    className="!flex !h-10 !items-center !gap-2 !rounded-xl !border-lightRed !text-[15px] !font-medium !text-lightRed"
                >
                    Raise an issue
                </Button>
                {canReturn ? (
                    <Button
                        onClick={() => setReturnModalOpen(true)}
                        className="!flex !h-10 !items-center !gap-2 !rounded-xl !border-lightRed !text-[15px] !font-medium !text-lightRed"
                    >
                        Return order
                    </Button>
                ) : null}
                {canCancel ? (
                    <Button
                        onClick={handleCancelOrder}
                        className="!flex !h-10 !items-center !gap-2 !rounded-xl !border-lightRed !text-[15px] !font-medium !text-lightRed"
                    >
                        Cancel order
                    </Button>
                ) : (
                    <Button
                        disabled
                        className="!flex !h-10 !items-center !gap-2 !rounded-xl !border-gray-300 !bg-gray-50 !text-[15px] !font-medium !text-gray-400"
                        title={cancelBlockedReason()}
                    >
                        Cancel order
                    </Button>
                )}
            </Flex>

            {/* Progress Status Stepper */}
            <Flex vertical gap={16}>
                <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                    <Text className="text-[22px] font-medium text-[#101828]">Order status</Text>
                    <Button
                        loading={isRefreshingStatus}
                        disabled={!canCallSeller || isRefreshingStatus}
                        onClick={handleRefreshStatus}
                        title={canCallSeller ? undefined : 'Status is not available for this order yet'}
                        className="!flex !h-10 !items-center !gap-2 !rounded-xl !border-lightRed !text-[15px] !font-medium !text-lightRed"
                    >
                        Refresh status
                    </Button>
                </Flex>
                <Card className="!rounded-3xl !bg-[#f9fafb]">
                    <Steps items={statusSteps.items} />
                </Card>
            </Flex>

            {/* Issues on this order Section */}
            {issues.length > 0 && (
                <Flex vertical gap={16}>
                    <Text className="text-[22px] font-medium text-[#101828]">
                        Issues on this order
                    </Text>
                    <Flex vertical gap={16}>
                        {issues.map(issue => {
                            const isResolved = issue.status === 'CLOSED' || issue.status === 'RESOLVED';
                            const statusPill = getIssueWireStatusPill(issue.wireStatus, issue.status);
                            const subCategoryLabel =
                                mapSubCategoryToDisplay(issue.subCategory) ||
                                issue.shortDesc ||
                                issue.subCategory;
                            const complaintTitle =
                                issue.shortDesc && issue.shortDesc !== subCategoryLabel
                                    ? issue.shortDesc
                                    : null;
                            const complaintBody =
                                issue.longDesc ||
                                (issue.description &&
                                issue.description !== complaintTitle &&
                                issue.description !== subCategoryLabel
                                    ? issue.description
                                    : null);
                            return (
                                <Card
                                    key={issue.id}
                                    className="!rounded-3xl border border-[#E4E7EC] shadow-sm"
                                    styles={{ body: { padding: 24 } }}
                                >
                                    <Flex vertical gap={16}>
                                        {/* Issue Header */}
                                        <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
                                            <Flex align="center" gap={8} wrap="wrap" className="text-sm text-[#475156]">
                                                <span className="font-semibold text-[#101828]">
                                                    {issue.displayId}
                                                </span>
                                                <span className="text-gray-300">|</span>
                                                <span>Category: {mapCategoryToDisplay(issue.category)}</span>
                                                <span className="text-gray-300">|</span>
                                                <span>Sub-category: {subCategoryLabel}</span>
                                            </Flex>
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-semibold ${statusPill.className}`}
                                            >
                                                {statusPill.label}
                                            </span>
                                        </Flex>

                                        {(complaintTitle || complaintBody) ? (
                                            <>
                                                <Flex vertical gap={4}>
                                                    {complaintTitle ? (
                                                        <Text className="text-[16px] font-medium text-[#101828]">
                                                            {complaintTitle}
                                                        </Text>
                                                    ) : null}
                                                    {complaintBody ? (
                                                        <Text className="text-[15px] text-[#475156]">
                                                            {complaintBody}
                                                        </Text>
                                                    ) : null}
                                                </Flex>
                                                <Divider className="!my-0" />
                                            </>
                                        ) : (
                                            <Divider className="!my-0" />
                                        )}

                                        {/* Events Timeline */}
                                        <Flex vertical gap={12}>
                                            {[...issue.events].reverse().map((event, idx) => {
                                                const isFirst = idx === 0;
                                                if (event.actorType === 'RESPONDENT') {
                                                    return (
                                                        <div key={idx} className="rounded-xl bg-[#F7F7F7] p-4 border border-[#E4E7EC]">
                                                            <Text className="text-[15px] font-medium text-black">
                                                                Seller response:
                                                            </Text>{' '}
                                                            <Text className="text-[15px] text-[#475156]">
                                                                {eventMessage(event.message, event.eventType)}
                                                            </Text>
                                                            <div className="text-[12px] text-[#868686] mt-1">
                                                                {dayjs(event.occurredAt).format('MMMM D, YYYY [at] hh:mm A')}
                                                            </div>
                                                            <EventThumbnails images={event.images} />
                                                        </div>
                                                    );
                                                }
                                                if (event.actorType === 'COMPLAINANT') {
                                                    if (isFirst) {
                                                        return (
                                                            <div key={idx}>
                                                                <Text className="text-[16px] text-[#101828]">
                                                                    {event.message}
                                                                </Text>
                                                                <div className="text-[12px] text-[#868686] mt-1">
                                                                    {dayjs(event.occurredAt).format('MMMM D, YYYY [at] hh:mm A')}
                                                                </div>
                                                                <EventThumbnails images={event.images} />
                                                            </div>
                                                        );
                                                    }
                                                    return (
                                                        <div key={idx} className="rounded-xl bg-[#FFF7F8] p-4 border border-[#FEE2E2]">
                                                            <Text className="text-[15px] font-medium text-[#E01A1A]">
                                                                Your reply:
                                                            </Text>{' '}
                                                            <Text className="text-[15px] text-[#475156]">
                                                                {event.message}
                                                            </Text>
                                                            <div className="text-[12px] text-[#868686] mt-1">
                                                                {dayjs(event.occurredAt).format('MMMM D, YYYY [at] hh:mm A')}
                                                            </div>
                                                            <EventThumbnails images={event.images} />
                                                        </div>
                                                    );
                                                }
                                                return (
                                                    <div key={idx} className="flex justify-center my-1">
                                                        <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
                                                            {event.message} ({dayjs(event.occurredAt).format('hh:mm A')})
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </Flex>

                                        <IssueOfferBlock
                                            issue={issue}
                                            busy={issueActionBusyId === issue.id}
                                            onReject={async () => {
                                                setIssueActionBusyId(issue.id);
                                                const ok = await rejectIssue(issue.id);
                                                setIssueActionBusyId(null);
                                                dispatch(
                                                    showToast({
                                                        description: ok
                                                            ? 'Resolution rejected. The seller can propose another option.'
                                                            : 'Could not reject this resolution — please try again.',
                                                        variant: ok ? 'success' : 'error',
                                                    })
                                                );
                                                return ok;
                                            }}
                                            onEscalate={async () => {
                                                setIssueActionBusyId(issue.id);
                                                const ok = await escalateIssue(issue.id);
                                                setIssueActionBusyId(null);
                                                dispatch(
                                                    showToast({
                                                        description: ok
                                                            ? 'Issue escalated to the seller grievance officer.'
                                                            : 'Could not escalate this issue — please try again.',
                                                        variant: ok ? 'success' : 'error',
                                                    })
                                                );
                                                return ok;
                                            }}
                                            onAccept={async resolution => {
                                                setIssueActionBusyId(issue.id);
                                                const ok = await acceptIssue(issue.id, resolution?.id);
                                                setIssueActionBusyId(null);
                                                let description = 'Could not accept this resolution — please try again.';
                                                if (ok && resolution?.code === 'REPLACEMENT') {
                                                    description =
                                                        'Replacement accepted. The seller will send a replacement — there is no refund.';
                                                } else if (ok) {
                                                    const label = (
                                                        RESOLUTION_LABELS[resolution?.code || ''] || 'resolution'
                                                    ).toLowerCase();
                                                    description = `${label.charAt(0).toUpperCase()}${label.slice(1)} accepted.`;
                                                }
                                                dispatch(
                                                    showToast({
                                                        description,
                                                        variant: ok ? 'success' : 'error',
                                                    })
                                                );
                                                return ok;
                                            }}
                                            onClose={async () => {
                                                setIssueActionBusyId(issue.id);
                                                const ok = await closeIssue(issue.id);
                                                setIssueActionBusyId(null);
                                                dispatch(
                                                    showToast({
                                                        description: ok
                                                            ? 'Issue closed.'
                                                            : 'Could not close this issue — please try again.',
                                                        variant: ok ? 'success' : 'error',
                                                    })
                                                );
                                                return ok;
                                            }}
                                        />

                                        {!isResolved &&
                                            issue.status !== 'RESOLUTION_PROPOSED' &&
                                            issue.status !== 'RESOLUTION_ACCEPTED' && (
                                            <IssueReplyBox
                                                onSend={async (replyText, cannotProvideProof, images) => {
                                                    const ok = await replyToIssue(
                                                        issue.id,
                                                        replyText,
                                                        cannotProvideProof,
                                                        images
                                                    );
                                                    if (ok) {
                                                        dispatch(
                                                            showToast({
                                                                description:
                                                                    'Your response has been sent to the seller.',
                                                                variant: 'success',
                                                            })
                                                        );
                                                    } else {
                                                        dispatch(
                                                            showToast({
                                                                description:
                                                                    'Failed to send your response. Please try again.',
                                                                variant: 'error',
                                                            })
                                                        );
                                                    }
                                                }}
                                            />
                                        )}
                                    </Flex>
                                </Card>
                            );
                        })}
                    </Flex>
                </Flex>
            )}

            {/* Track your shipment */}
            <Flex vertical gap={16}>
                <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                    <Text className="text-[22px] font-medium text-[#141414]">Track your shipment</Text>
                    <Button
                        loading={isRefreshingTracking}
                        disabled={!canCallSeller || isRefreshingTracking}
                        onClick={handleRefreshTracking}
                        title={canCallSeller ? undefined : 'Tracking is not available for this order yet'}
                        className="!flex !h-10 !items-center !gap-2 !rounded-xl !border-lightRed !text-[15px] !font-medium !text-lightRed"
                    >
                        Track shipment
                    </Button>
                </Flex>
                <Card className="!rounded-3xl">
                    <Flex vertical gap={24}>
                        {order.expectedDeliveryDate && !isCancelled && (
                            <Text className="text-[16px]">
                                <Text className="text-[#6a6a6a]">Expected delivery: </Text>
                                <Text className="font-semibold text-[#1e293b]">
                                    {dayjs(order.expectedDeliveryDate).format('MMMM D, YYYY')}
                                </Text>
                            </Text>
                        )}
                        {order.tracking && (
                            <>
                                <Flex justify="space-between" align="center" wrap="wrap" gap={16}>
                                    <Flex gap={24} wrap="wrap">
                                        {order.tracking.courierName && (
                                            <Text>
                                                <Text className="text-[#6a6a6a]">Courier: </Text>
                                                <Text className="font-medium text-[#1e293b]">
                                                    {order.tracking.courierName}
                                                </Text>
                                            </Text>
                                        )}
                                        {order.tracking.courierPhone && (
                                            <Text>
                                                <Text className="text-[#6a6a6a]">Courier phone: </Text>
                                                <Text className="font-medium text-[#1e293b]">
                                                    {order.tracking.courierPhone}
                                                </Text>
                                            </Text>
                                        )}
                                    </Flex>
                                    {order.tracking.url && (
                                        <Typography.Link
                                            href={order.tracking.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="!text-lightRed"
                                        >
                                            Visit site <ArrowRightOutlined />
                                        </Typography.Link>
                                    )}
                                </Flex>
                                {(order.tracking.courierName ||
                                    order.tracking.courierPhone ||
                                    order.tracking.url) && <Divider className="!my-0" />}
                            </>
                        )}
                        {trackingTimeline.length > 0 ? (
                            <Steps
                                direction="vertical"
                                items={trackingTimeline.map(event => ({
                                    title: event.title,
                                    description: event.description,
                                    status: event.status,
                                }))}
                            />
                        ) : (
                            <Flex vertical gap={4}>
                                <Text className="text-[16px] font-medium text-[#1e293b]">
                                    {noTrackingMessage.title}
                                </Text>
                                <Text className="text-[14px] text-[#6a6a6a]">{noTrackingMessage.description}</Text>
                            </Flex>
                        )}
                    </Flex>
                </Card>
            </Flex>

            {/* Modals */}
            <CancelOrderModal
                open={cancelModalOpen}
                onClose={() => setCancelModalOpen(false)}
                orderId={order.orderId || order.transactionId}
                // amountPaid, not totalAmount — cancelling refunds the platform
                // fee too (refundOndcOrderAfterCancel refunds the full amountPaid),
                // so quoting the fee-free total under-promised the refund.
                refundAmount={order.amountPaid || order.totalAmount}
                isPrepaid={order.paymentStatus === 'PAID'}
                onSubmit={async (reason, description) => {
                    const result = await cancelOrder(reason, description);
                    if (result) {
                        setCancelModalOpen(false);
                        const refundSucceeded =
                            result.refund == null ||
                            Boolean(result.refund.status) ||
                            Boolean(result.refund.alreadyRefunded);
                        dispatch(
                            showToast({
                                description: refundSucceeded
                                    ? 'Your order has been cancelled and a full refund has been initiated.'
                                    : 'Your order has been cancelled. The refund is still pending — our team will complete it shortly.',
                                variant: refundSucceeded ? 'success' : 'error',
                            })
                        );
                        return true;
                    }
                    dispatch(
                        showToast({
                            description:
                                "We couldn't cancel this order right now — please try again or contact support.",
                            variant: 'error',
                        })
                    );
                    return false;
                }}
            />
            <ReturnOrderModal
                open={returnModalOpen}
                onClose={() => setReturnModalOpen(false)}
                orderId={order.orderId || order.transactionId}
                items={order.items}
                reasons={order.returnReasons || []}
                refundAmount={order.amountPaid || order.totalAmount}
                onSubmit={async payload => {
                    const result = await returnOrder(payload);
                    if (result) {
                        setReturnModalOpen(false);
                        const isReplace = Boolean(payload.replace || result.replace);
                        const refunded = Boolean(
                            !isReplace &&
                                result.refund &&
                                (result.refund.status || result.refund.alreadyRefunded)
                        );
                        dispatch(
                            showToast({
                                description: returnSuccessMessage(isReplace, refunded, result.returnStatus),
                                variant: 'success',
                            })
                        );
                        return true;
                    }
                    dispatch(
                        showToast({
                            description:
                                "We couldn't submit this request right now — please try again or contact support.",
                            variant: 'error',
                        })
                    );
                    return false;
                }}
            />

            <RaiseIssueModal
                open={raiseModalOpen}
                onClose={() => setRaiseModalOpen(false)}
                onSubmit={async (category, subCategory, description, images) => {
                    const succeeded = await raiseIssue(category, subCategory, description, images);
                    if (succeeded) {
                        dispatch(
                            showToast({
                                description: 'Your issue has been raised with the seller.',
                                variant: 'success',
                            })
                        );
                    } else {
                        dispatch(
                            showToast({
                                description: 'Failed to raise issue. Please try again.',
                                variant: 'error',
                            })
                        );
                    }
                    return succeeded;
                }}
            />
        </Flex>
    );
};

export default OrderedProductDetailsPage;
