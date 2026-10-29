import { useState } from 'react';

import { ArrowLeftOutlined, CopyOutlined, ReloadOutlined, StopOutlined } from '@ant-design/icons';
import { Button, Card, Col, Divider, Flex, Row, Skeleton, Table, Tag, Typography } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';

import OtpModal from '@components/molecular/modals/OtpModal';
import {
    STATUS_STYLES,
    getOrderStateTagStyle,
} from '@src/domains/dashboard/officeSupplies/components/OrderHistory/OndcStatusTag';
import {
    getDeliveryFulfillment,
    getFulfillmentStatusStyle,
} from '@src/domains/dashboard/officeSupplies/utils/fulfillmentStatus';
import { getOtherChargeRows } from '@src/domains/dashboard/officeSupplies/utils/quoteSummary';
import { useAppDispatch } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { Pill, SidebarCard } from './detail/DetailPrimitives';
import RefundOrderAction from './RefundOrderAction';
import useAdminOndcOrderDetail from '../hooks/useAdminOndcOrderDetail';
import { AdminOrderQuoteRow } from '../types/types';

const { Text } = Typography;

const TERMINAL_STATES = ['Cancelled', 'Returned', 'Completed'];

const inr = (n: number) => `₹${formatNumberWithLocalString(Number(n || 0))}`;

const PAYMENT_STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
    PAID: { bg: '#ecfdf3', color: '#027a48', label: 'Paid' },
    'NOT-PAID': { bg: '#fef2f2', color: '#ef4444', label: 'Not paid' },
    REFUND: { bg: '#f5f6ff', color: '#3b48d5', label: 'Refunded' },
};

const paymentTypeLabel = (type?: string | null) => {
    if (type === 'ON-ORDER') return 'Prepaid';
    if (type === 'ON-FULFILLMENT') return 'Pay on delivery';
    return type || '-';
};

const isTruthyFlag = (v: unknown) => v === true || v === 1;

const OndcOrderDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { order, isLoading, notFound, isCancelling, refresh, requestOtp, cancelOrder } =
        useAdminOndcOrderDetail(id);

    const [otpOpen, setOtpOpen] = useState(false);
    const [isOtpSending, setIsOtpSending] = useState(false);

    const backToOrders = () => navigate(`${paths.systemUser.manage}/${paths.manage.orders}`);

    const handleCopy = (value: string) => {
        navigator.clipboard.writeText(value);
        dispatch(showToast({ variant: 'success', description: 'Order ID copied.' }));
    };

    const openCancelFlow = async () => {
        const resp = await requestOtp();
        if (resp) setOtpOpen(true);
        else dispatch(showToast({ variant: 'error', description: 'Could not send OTP. Try again.' }));
    };

    if (isLoading) {
        return (
            <Flex vertical gap={24}>
                <Skeleton active paragraph={{ rows: 2 }} />
                <Skeleton active paragraph={{ rows: 8 }} />
            </Flex>
        );
    }
    if (notFound || !order) {
        return (
            <Flex vertical gap={16} align="start">
                <Text className="text-lg font-medium">Order not found.</Text>
                <Button danger onClick={backToOrders}>
                    Back to orders
                </Button>
            </Flex>
        );
    }

    const displayId = order.orderId || order.transactionId;
    const orderStateStyle = getOrderStateTagStyle(order.orderState || '');
    const createdStyle = STATUS_STYLES.Created;

    const quote = order.quote || undefined;
    const itemRows: AdminOrderQuoteRow[] = (quote?.rows || []).filter(r => r.titleType === 'item');
    const itemsSubtotal = itemRows.reduce((s, r) => s + Number(r.amount || 0), 0);
    const delivery = Number(quote?.deliveryCharge || 0);
    // Packing/tax/misc rows the seller charged — without these, items subtotal +
    // delivery doesn't reconcile to the total paid.
    const otherChargeRows = getOtherChargeRows(quote);
    const taxFromOther = (quote?.otherCharges || [])
        .filter(c => /tax|gst/i.test(c.type || ''))
        .reduce((s, c) => s + Number(c.amount || 0), 0);
    const taxFromRows = (quote?.rows || [])
        .filter(r => /tax|gst/i.test(r.titleType || ''))
        .reduce((s, r) => s + Number(r.amount || 0), 0);
    const gst = taxFromOther || taxFromRows;
    const total = quote?.total != null ? Number(quote.total) : Number(order.totalAmount || 0);

    const deliveryCode = getDeliveryFulfillment(order.fulfillments)?.state?.descriptor?.code;
    const shipmentStyle = getFulfillmentStatusStyle(deliveryCode);
    // Shipment-centric label: show the actual shipment state (e.g. "Pending",
    // "Out for delivery") rather than fulfillmentStatus's order-centric remap
    // (which turns "Pending" into "Order confirmed").
    const shipmentLabel = deliveryCode ? deliveryCode.replace(/-/g, ' ') : 'Not shipped yet';
    const paymentStyle =
        PAYMENT_STATUS_STYLE[order.paymentStatus || ''] || { bg: '#f5f5f5', color: '#595959', label: order.paymentStatus || 'Unknown' };

    const canCancel = !TERMINAL_STATES.includes(order.orderState || '');
    const refundedSoFar = Number(order.refundedAmount || 0);
    // The admin endpoint returns the row as-is, so documents arrive verbatim; the
    // buyer DTO pre-flattens the same thing to invoiceUrl. Matches getInvoiceDocument
    // in purchase/utils/ondcDocuments.js — invoice-labelled first, else the first
    // document that has a url.
    const documents = Array.isArray(order.documents) ? order.documents : [];
    const withUrl = documents.filter(d => d?.url);
    const invoiceUrl =
        (withUrl.find(d => /invoice/i.test(String(d.label || ''))) || withUrl[0])?.url || null;

    const activity: { ts: string; text: string; pill?: { bg: string; color: string; label: string } }[] = [
        {
            ts: order.createdAt,
            text: 'Order placed and payment received.',
            pill: { bg: createdStyle.bg, color: createdStyle.color, label: createdStyle.label },
        },
    ];
    if (order.cancelledAt) {
        activity.push({
            ts: order.cancelledAt,
            text: order.cancelReason ? `Order cancelled — ${order.cancelReason}` : 'Order cancelled.',
            pill: { bg: '#fef2f2', color: '#ef4444', label: 'Cancelled' },
        });
    }
    if (order.returnedAt) {
        activity.push({
            ts: order.returnedAt,
            text: order.returnReason ? `Order returned — ${order.returnReason}` : 'Order returned.',
            pill: { bg: '#fff7ed', color: '#c2410c', label: 'Returned' },
        });
    }

    const itemColumns = [
        {
            title: 'Item',
            dataIndex: 'productName',
            key: 'productName',
            render: (_: any, r: AdminOrderQuoteRow) => r.productName || r.title || '-',
        },
        {
            title: 'Qty',
            dataIndex: 'quantity',
            key: 'quantity',
            width: 70,
            render: (q: number | null) => q ?? 1,
        },
        {
            title: 'Unit Price',
            key: 'unitPrice',
            width: 110,
            render: (_: any, r: AdminOrderQuoteRow) => {
                const qty = r.quantity || 1;
                return inr(Number(r.amount || 0) / qty);
            },
        },
        {
            title: 'Line Total',
            dataIndex: 'amount',
            key: 'amount',
            width: 110,
            render: (a: number) => inr(a),
        },
        {
            title: 'Flags',
            key: 'flags',
            width: 190,
            render: (_: any, r: AdminOrderQuoteRow) => (
                <Flex gap={6} wrap="wrap">
                    {isTruthyFlag(r.cancellable) && <Tag color="green">Cancellable</Tag>}
                    {isTruthyFlag(r.returnable) && <Tag color="green">Returnable</Tag>}
                </Flex>
            ),
        },
    ];

    return (
        <Flex vertical gap={16}>
            <Button
                type="link"
                className="!px-0 !text-[#475156] w-fit"
                icon={<ArrowLeftOutlined />}
                onClick={backToOrders}
            >
                Back to orders
            </Button>

            {/* Header */}
            <Flex vertical gap={4}>
                <Flex align="center" gap={12} wrap="wrap">
                    <Text className="text-[24px] font-semibold text-[#101828]">{displayId}</Text>
                    <CopyOutlined className="cursor-pointer text-[#475156]" onClick={() => handleCopy(displayId)} />
                    <Pill bg={orderStateStyle.bg} color={orderStateStyle.color}>
                        {orderStateStyle.label}
                    </Pill>
                </Flex>
                <Text className="text-[15px] text-[#868686]">
                    Placed {formattedDateOnly(new Date(order.createdAt))} ·{' '}
                    {formattedTime(new Date(order.createdAt))}
                    {order.corporateName ? ` — ${order.corporateName}` : ''}
                    {order.corporateCode ? ` (${order.corporateCode})` : ''}
                </Text>
            </Flex>

            <Row gutter={[24, 24]}>
                {/* LEFT */}
                <Col xs={24} lg={16}>
                    <Flex vertical gap={24}>
                        <Card title="Items & charges" className="!rounded-xl">
                            <Table
                                rowKey={(_, index) => `${index}`}
                                columns={itemColumns}
                                dataSource={itemRows}
                                pagination={false}
                                size="middle"
                            />
                            <Flex vertical gap={8} align="end" className="mt-5">
                                <Flex justify="space-between" className="w-full max-w-[320px]">
                                    <Text className="text-[#4a5565]">Items subtotal</Text>
                                    <Text className="text-[#252430]">{inr(itemsSubtotal)}</Text>
                                </Flex>
                                <Flex justify="space-between" className="w-full max-w-[320px]">
                                    <Text className="text-[#4a5565]">Delivery charges</Text>
                                    <Text className="text-[#252430]">{inr(delivery)}</Text>
                                </Flex>
                                {otherChargeRows.map(row => (
                                    <Flex
                                        key={row.label}
                                        justify="space-between"
                                        className="w-full max-w-[320px]"
                                    >
                                        <Text className="text-[#4a5565]">{row.label}</Text>
                                        <Text className="text-[#252430]">{inr(row.amount)}</Text>
                                    </Flex>
                                ))}
                                <Divider className="!my-2 !max-w-[320px] !min-w-0" />
                                <Flex justify="space-between" className="w-full max-w-[320px]">
                                    <Text className="text-[16px] font-semibold text-[#101828]">Total paid</Text>
                                    <Text className="text-[16px] font-semibold text-[#101828]">{inr(total)}</Text>
                                </Flex>
                                {gst > 0 && (
                                    <Text className="text-[12px] text-[#868686]">Includes GST of {inr(gst)}</Text>
                                )}
                            </Flex>
                        </Card>

                        <Card title="Order activity" className="!rounded-xl">
                            <Flex vertical gap={16}>
                                {activity.map((a, idx) => (
                                    <Flex key={idx} gap={12} align="start">
                                        <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full border-2 border-lightRed" />
                                        <Flex vertical gap={2}>
                                            <Text className="text-[12px] text-[#868686]">
                                                {formattedDateOnly(new Date(a.ts))} ·{' '}
                                                {formattedTime(new Date(a.ts))}
                                            </Text>
                                            <Flex align="center" gap={8} wrap="wrap">
                                                <Text className="text-[15px] text-[#101828]">{a.text}</Text>
                                                {a.pill && (
                                                    <Pill bg={a.pill.bg} color={a.pill.color}>
                                                        {a.pill.label}
                                                    </Pill>
                                                )}
                                            </Flex>
                                        </Flex>
                                    </Flex>
                                ))}
                            </Flex>
                        </Card>
                    </Flex>
                </Col>

                {/* RIGHT */}
                <Col xs={24} lg={8}>
                    <Flex vertical gap={16}>
                        <SidebarCard title="Seller">
                            <Text className="block text-[15px] font-medium text-[#101828]">
                                {order.vendorName || '-'}
                            </Text>
                            <Text className="text-[13px] text-[#868686]">ONDC network seller</Text>
                        </SidebarCard>

                        <SidebarCard title="Corporate">
                            <Text className="block text-[15px] font-medium text-[#101828]">
                                {order.corporateName || '-'}
                            </Text>
                            {order.corporateCode && (
                                <Text className="text-[13px] text-[#868686]">{order.corporateCode}</Text>
                            )}
                        </SidebarCard>

                        <SidebarCard title="Payment">
                            <Flex vertical gap={10}>
                                <Flex justify="space-between" align="center">
                                    <Text className="text-[#4a5565]">Status</Text>
                                    <Pill bg={paymentStyle.bg} color={paymentStyle.color}>
                                        {paymentStyle.label}
                                    </Pill>
                                </Flex>
                                <Flex justify="space-between">
                                    <Text className="text-[#4a5565]">Amount</Text>
                                    <Text className="font-medium text-[#252430]">{inr(total)}</Text>
                                </Flex>
                                <Flex justify="space-between">
                                    <Text className="text-[#4a5565]">Type</Text>
                                    <Text className="font-medium text-[#252430]">
                                        {paymentTypeLabel(order.paymentType)}
                                    </Text>
                                </Flex>
                                {refundedSoFar > 0 && (
                                    <Flex justify="space-between" align="center">
                                        <Text className="text-[#4a5565]">Refunded</Text>
                                        <Pill
                                            bg={PAYMENT_STATUS_STYLE.REFUND.bg}
                                            color={PAYMENT_STATUS_STYLE.REFUND.color}
                                        >
                                            {inr(refundedSoFar)}
                                        </Pill>
                                    </Flex>
                                )}
                                {/* Seller-issued invoice, present only once on_status has
                                    carried one. A third-party URL, hence noopener/noreferrer. */}
                                {invoiceUrl && (
                                    <Flex justify="space-between" align="center">
                                        <Text className="text-[#4a5565]">Invoice</Text>
                                        <a
                                            href={invoiceUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-medium text-brandColor underline"
                                        >
                                            Download
                                        </a>
                                    </Flex>
                                )}
                            </Flex>
                        </SidebarCard>

                        <SidebarCard title="Shipment">
                            <Flex justify="space-between" align="center">
                                <Text className="text-[#4a5565]">Shipment</Text>
                                <Pill bg={shipmentStyle.bg} color={shipmentStyle.color}>
                                    {shipmentLabel}
                                </Pill>
                            </Flex>
                        </SidebarCard>

                        <SidebarCard title="Actions">
                            <Flex vertical gap={10}>
                                <Button icon={<ReloadOutlined />} onClick={refresh} block>
                                    Refresh status
                                </Button>
                                {canCancel && (
                                    <Button
                                        danger
                                        icon={<StopOutlined />}
                                        loading={isCancelling}
                                        onClick={openCancelFlow}
                                        block
                                    >
                                        Cancel Order
                                    </Button>
                                )}
                                <RefundOrderAction order={order} onDone={refresh} />
                            </Flex>
                        </SidebarCard>
                    </Flex>
                </Col>
            </Row>

            <OtpModal
                isOpen={otpOpen}
                isLoading={isCancelling}
                isOtpSending={isOtpSending}
                title="Confirm cancellation"
                description="Enter the OTP sent to your registered email to cancel this order."
                handleCancel={() => setOtpOpen(false)}
                onResend={async () => {
                    setIsOtpSending(true);
                    await requestOtp();
                    setIsOtpSending(false);
                }}
                handleSubmit={async otp => {
                    const ok = await cancelOrder(otp, 'Cancelled by admin from order details');
                    if (ok) {
                        dispatch(showToast({ variant: 'success', description: 'ONDC cancellation request sent.' }));
                        setOtpOpen(false);
                    }
                }}
            />
        </Flex>
    );
};

export default OndcOrderDetails;
