import { useEffect, useState } from 'react';

import { Descriptions, Divider, Modal, Skeleton, Tag, Typography } from 'antd';
import dayjs from 'dayjs';

import { useAppSelector } from '@src/hooks/store';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { getDomainHostingOrderDetails } from '../../api/domainHostingRefunds';

type Props = {
    open: boolean;
    corporateTxnId: string;
    handleCancel: () => void;
};

const STATUS_COLORS: Record<string, string> = {
    CANCELLATION_REQUESTED: 'orange',
    REFUNDED: 'green',
    CANCELLED: 'red',
    SUCCESS: 'green',
};

const fmtDate = (val: string) => (val ? dayjs(val).format('DD MMM YYYY, hh:mm A') : '-');
const fmtAmount = (val: any) => (val != null ? `₹ ${formatNumberWithLocalString(parseFloat(val))}` : '-');

const OrderDetailsModal = ({ open, corporateTxnId, handleCancel }: Props) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [loading, setLoading] = useState(false);
    const [order, setOrder] = useState<any>(null);
    const [fetchError, setFetchError] = useState(false);

    useEffect(() => {
        if (!open) return;
        setOrder(null);
        setFetchError(false);
        const fetch = async () => {
            setLoading(true);
            const data = await getDomainHostingOrderDetails({ userId: id, userType: role, corporateTxnId });
            if (data) {
                setOrder(data);
            } else {
                setFetchError(true);
            }
            setLoading(false);
        };
        fetch();
    }, [open, corporateTxnId, id, role]);

    const or = order?.orderResponse || {};
    const items: any[] = or.cartItems || or.items || [];
    const provisionResults: any[] = or.provisionResults || [];
    const liveVendorDetails = order?.liveVendorDetails || null;
    const vendorCancel = or.vendorCancelResponse || null;

    return (
        <Modal
            title="Order Details"
            open={open}
            onCancel={handleCancel}
            footer={null}
            width={660}
            destroyOnClose
        >
            {fetchError && (
                <Typography.Text type="danger">Failed to load order details. Please try again.</Typography.Text>
            )}
            {!fetchError && (loading || !order) && (
                <Skeleton active paragraph={{ rows: 8 }} />
            )}
            {!fetchError && !loading && order && (
                <>
                    {/* ── Transaction Summary ── */}
                    <Descriptions bordered column={2} size="small">
                        <Descriptions.Item label="Transaction ID" span={2}>
                            <Typography.Text copyable>{order.corporateTxnId}</Typography.Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Date">
                            {fmtDate(order.transactionDate)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Status">
                            <Tag color={STATUS_COLORS[order.status] || 'default'}>{order.status}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Amount Paid">
                            {fmtAmount(order.amountInINR)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Payment Mode">
                            {order.paymentMode || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Customer" span={2}>
                            {order.credential?.name || '-'}{' '}
                            <Typography.Text type="secondary">({order.credential?.username})</Typography.Text>
                        </Descriptions.Item>
                    </Descriptions>

                    {/* ── Items Purchased ── */}
                    {items.length > 0 && (
                        <>
                            <Divider orientation="left">Items Purchased</Divider>
                            {items.map((item: any, i: number) => (
                                <Descriptions key={i} bordered column={2} size="small" className="mb-3">
                                    <Descriptions.Item label="Type" span={2}>
                                        {String(item.itemType || '').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                                    </Descriptions.Item>
                                    {item.domainName && <Descriptions.Item label="Domain">{item.domainName}</Descriptions.Item>}
                                    {item.productName && <Descriptions.Item label="Product">{item.productName}</Descriptions.Item>}
                                    {item.productQuantity != null && <Descriptions.Item label="Qty">{item.productQuantity}</Descriptions.Item>}
                                    {item.seats != null && <Descriptions.Item label="Seats">{item.seats}</Descriptions.Item>}
                                    {item.billingCycle != null && <Descriptions.Item label="Billing Cycle">{item.billingCycle} months</Descriptions.Item>}
                                    {item.unitPrice != null && <Descriptions.Item label="Unit Price">{fmtAmount(item.unitPrice)}</Descriptions.Item>}
                                    {item.totalPrice != null && <Descriptions.Item label="Total">{fmtAmount(item.totalPrice)}</Descriptions.Item>}
                                </Descriptions>
                            ))}
                        </>
                    )}

                    {/* ── Provision Results ── */}
                    {provisionResults.length > 0 && (
                        <>
                            <Divider orientation="left">Provision Results</Divider>
                            {provisionResults.map((r: any, i: number) => (
                                <Descriptions key={i} bordered column={2} size="small" className="mb-3">
                                    <Descriptions.Item label="Type">
                                        {String(r.itemType || '').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Status">
                                        <Tag color={r.status === 'SUCCESS' ? 'green' : 'red'}>{r.status}</Tag>
                                    </Descriptions.Item>
                                    {r.domainName && <Descriptions.Item label="Domain" span={2}>{r.domainName}</Descriptions.Item>}
                                </Descriptions>
                            ))}
                        </>
                    )}

                    {/* ── Live Vendor Order Details ── */}
                    {liveVendorDetails && (
                        <>
                            <Divider orientation="left">Live Vendor Order Details</Divider>
                            <Descriptions bordered column={2} size="small">
                                {Object.entries(liveVendorDetails)
                                    .filter(([, v]) => v != null && v !== '' && typeof v !== 'object')
                                    .map(([k, v]) => (
                                        <Descriptions.Item key={k} label={k.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}>
                                            {String(v)}
                                        </Descriptions.Item>
                                    ))}
                            </Descriptions>
                        </>
                    )}

                    {/* ── Cancellation Info ── */}
                    {or.cancelledAt && (
                        <>
                            <Divider orientation="left">Cancellation</Divider>
                            <Descriptions bordered column={2} size="small">
                                <Descriptions.Item label="Cancelled Item">
                                    {String(or.cancelledItemType || '').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                                </Descriptions.Item>
                                <Descriptions.Item label="Cancelled At">
                                    {fmtDate(or.cancelledAt)}
                                </Descriptions.Item>
                                {vendorCancel?.actionstatus && (
                                    <Descriptions.Item label="Vendor Status" span={2}>
                                        {vendorCancel.actionstatus} — {vendorCancel.actionstatusdesc}
                                    </Descriptions.Item>
                                )}
                            </Descriptions>
                        </>
                    )}

                    {/* ── Refund / Admin Action ── */}
                    {(or.refundAmount !== undefined || or.adminRemarks || or.cancelledByAdminAt) && (
                        <>
                            <Divider orientation="left">Admin Action</Divider>
                            <Descriptions bordered column={2} size="small">
                                {or.refundAmount !== undefined && (
                                    <Descriptions.Item label="Refund Amount">
                                        {fmtAmount(or.refundAmount)}
                                    </Descriptions.Item>
                                )}
                                {or.refundedAt && (
                                    <Descriptions.Item label="Refunded At">
                                        {fmtDate(or.refundedAt)}
                                    </Descriptions.Item>
                                )}
                                {or.cancelledByAdminAt && (
                                    <Descriptions.Item label="Approved At">
                                        {fmtDate(or.cancelledByAdminAt)}
                                    </Descriptions.Item>
                                )}
                                {or.adminRemarks && (
                                    <Descriptions.Item label="Remarks" span={2}>
                                        {or.adminRemarks}
                                    </Descriptions.Item>
                                )}
                            </Descriptions>
                        </>
                    )}
                </>
            )}
        </Modal>

    );
};

export default OrderDetailsModal;
