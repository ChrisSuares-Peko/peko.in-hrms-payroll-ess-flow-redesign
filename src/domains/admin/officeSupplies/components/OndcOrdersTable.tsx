import React from 'react';

import { CopyOutlined, EyeOutlined } from '@ant-design/icons';
import { Flex, Tag, Tooltip, Typography } from 'antd';
import { TableProps } from 'antd/lib';

import GenericTable from '@components/atomic/GenericTable';
import { getOrderStateTagStyle } from '@src/domains/dashboard/officeSupplies/components/OrderHistory/OndcStatusTag';
import {
    formatFulfillmentStateLabel,
    getDeliveryFulfillment,
    getFulfillmentStatusStyle,
    getReturnStatusTagStyle,
} from '@src/domains/dashboard/officeSupplies/utils/fulfillmentStatus';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import RefundOrderAction from './RefundOrderAction';
import { AllOrdersRow } from '../types/types';

const PAYMENT_STYLES: Record<string, { bg: string; color: string }> = {
    PAID: { bg: '#ecfdf3', color: '#027a48' },
    'NOT-PAID': { bg: '#fef2f2', color: '#ef4444' },
};

type Props = {
    tableData: AllOrdersRow[] | undefined;
    isLoading: boolean;
    onTableChange: TableProps<AllOrdersRow>['onChange'];
    onView: (record: AllOrdersRow) => void;
    /** Cancelled/Returned sections omit this — a Cancelled order's Delivery
     *  leg is stale, a Returned order's is almost always "Delivered". */
    showFulfilment?: boolean;
    /** Returns tab only: where the return itself is. Without it that tab shows
     *  "Delivered" in Order State for a live return — orderState doesn't reach
     *  "Returned" until the return liquidates. */
    showReturnStatus?: boolean;
    /** Refetch after an inline refund, so the row's eligibility/amount update. */
    onRefunded?: () => void;
};

/** Shared ONDC-order columns/table — the "All orders" tab and the Cancelled/Returned sections on the other 3 tabs all render the same row shape. */
const OndcOrdersTable = ({
    tableData,
    isLoading,
    onTableChange,
    onView,
    showFulfilment = true,
    showReturnStatus = false,
    onRefunded,
}: Props) => {
    const dispatch = useAppDispatch();

    const handleCopy = (value: string) => {
        navigator.clipboard.writeText(value);
        dispatch(showToast({ variant: 'success', description: 'Order ID copied.' }));
    };

    // Explicit widths — GenericTable (@components/atomic/GenericTable) fits
    // columns against `window.innerWidth` assuming 200px per column with no
    // `width`; 8-9 uncapped columns (1600-1800px) can exceed a real admin
    // viewport (sidebar eats several hundred px), silently pushing columns
    // into its hidden "expandable" set and leaving a populated table looking
    // empty. These are sized to what each column actually needs.
    const columns = [
        {
            title: 'Order Date',
            dataIndex: 'createdAt',
            sorter: true,
            key: 'createdAt',
            width: 120,
            render: (createdAt: string) => (
                <Flex vertical>
                    <Typography.Text>{formattedDateOnly(new Date(createdAt))}</Typography.Text>
                    <Typography.Text>{formattedTime(new Date(createdAt))}</Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Order ID',
            key: 'orderId',
            width: 190,
            render: (_: any, record: AllOrdersRow) => {
                const displayId = record.orderId || record.transactionId;
                return (
                    <Flex align="center" gap={6}>
                        <Typography.Text>{displayId}</Typography.Text>
                        <Tooltip title="Copy Order ID">
                            <CopyOutlined onClick={() => handleCopy(displayId)} className="cursor-pointer" />
                        </Tooltip>
                    </Flex>
                );
            },
        },
        {
            title: 'Corporate',
            dataIndex: 'corporateName',
            key: 'corporateName',
            width: 110,
            render: (name: string | undefined) => name || '-',
        },
        {
            title: 'Seller',
            dataIndex: 'vendorName',
            key: 'vendorName',
            width: 130,
            render: (name: string | null) => name || '-',
        },
        {
            title: 'Amount',
            dataIndex: 'totalAmount',
            sorter: true,
            key: 'totalAmount',
            width: 100,
            render: (amount: string | null) =>
                amount ? `₹ ${formatNumberWithLocalString(Number(amount))}` : '-',
        },
        {
            title: 'Order State',
            dataIndex: 'orderState',
            key: 'orderState',
            width: 120,
            render: (state: string | null, record: AllOrdersRow) => {
                const style = getOrderStateTagStyle(state || '');
                return (
                    <Flex vertical gap={4} align="start">
                        <Tag style={{ background: style.bg, color: style.color, border: 'none', borderRadius: 999 }}>
                            {style.label}
                        </Tag>
                        {/* Past its delivery promise and still undelivered — the signal
                            ops previously had to infer from a refund icon appearing. */}
                        {record.isDelayed && (
                            <Tag
                                style={{
                                    background: '#fee2e2',
                                    color: '#b91c1c',
                                    border: 'none',
                                    borderRadius: 999,
                                    margin: 0,
                                }}
                            >
                                Delayed · {record.daysOverdue ?? 0}d
                            </Tag>
                        )}
                    </Flex>
                );
            },
        },
        ...(showFulfilment
            ? [
                  {
                      title: 'Fulfilment',
                      dataIndex: 'fulfillments',
                      key: 'fulfillments',
                      width: 130,
                      render: (_: any, record: AllOrdersRow) => {
                          const deliveryCode = getDeliveryFulfillment(record.fulfillments)?.state?.descriptor
                              ?.code;
                          const style = getFulfillmentStatusStyle(deliveryCode);
                          return (
                              <Tag
                                  style={{
                                      background: style.bg,
                                      color: style.color,
                                      border: 'none',
                                      borderRadius: 999,
                                  }}
                              >
                                  {formatFulfillmentStateLabel(deliveryCode)}
                              </Tag>
                          );
                      },
                  },
              ]
            : []),
        ...(showReturnStatus
            ? [
                  {
                      title: 'Return Status',
                      dataIndex: 'returnStatus',
                      key: 'returnStatus',
                      width: 140,
                      render: (returnStatus: string | null) => {
                          const style = getReturnStatusTagStyle(returnStatus);
                          // Only reachable for a row matched on returnedAt alone — a
                          // return recorded before the returnStatus column existed.
                          if (!style) return <Typography.Text type="secondary">-</Typography.Text>;
                          return (
                              <Tag
                                  style={{
                                      background: style.bg,
                                      color: style.color,
                                      border: 'none',
                                      borderRadius: 999,
                                  }}
                              >
                                  {style.label}
                              </Tag>
                          );
                      },
                  },
              ]
            : []),
        {
            title: 'Payment',
            dataIndex: 'paymentStatus',
            key: 'paymentStatus',
            width: 110,
            render: (status: string | null) => {
                const style = PAYMENT_STYLES[status || ''] || { bg: '#f5f5f5', color: '#595959' };
                return (
                    <Tag style={{ background: style.bg, color: style.color, border: 'none', borderRadius: 999 }}>
                        {status || 'Unknown'}
                    </Tag>
                );
            },
        },
        {
            title: 'Delivered',
            dataIndex: 'deliveredAt',
            key: 'deliveredAt',
            width: 120,
            // Actual delivery, stamped server-side from the Delivery fulfillment's
            // end.time.timestamp — not the expectedDeliveryDate estimate.
            render: (deliveredAt: string | null) =>
                deliveredAt ? (
                    <Flex vertical>
                        <Typography.Text>{formattedDateOnly(new Date(deliveredAt))}</Typography.Text>
                        <Typography.Text>{formattedTime(new Date(deliveredAt))}</Typography.Text>
                    </Flex>
                ) : (
                    <Typography.Text type="secondary">Not delivered</Typography.Text>
                ),
        },
        {
            title: 'Actions',
            key: 'action',
            width: 90,
            render: (_: any, record: AllOrdersRow) => (
                <Flex gap={12} align="center">
                    <Tooltip title="View order">
                        <EyeOutlined onClick={() => onView(record)} />
                    </Tooltip>
                    {/* Renders nothing unless the server marked the row refundable —
                        delivered, money still held, return window still open. */}
                    <RefundOrderAction order={record} onDone={onRefunded ?? (() => {})} variant="icon" />
                </Flex>
            ),
        },
    ];

    return (
        <GenericTable
            rowKey={record => record.id}
            columns={columns}
            dataSource={tableData}
            pagination={false}
            loading={isLoading}
            onChange={onTableChange}
        />
    );
};

export default OndcOrdersTable;
