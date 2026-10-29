import { useMemo } from 'react';

import { Tag, Typography } from 'antd';

import { GetInvoiceByIdResponse } from '../../types/invoice';
import { formatCurrencyAmount, formatDateAndTime } from '../../utils/helperFunctions';

interface Props {
    invoiceData: GetInvoiceByIdResponse | null;
    isLoading: boolean;
}

const STATUS_COLORS: Record<string, string> = {
    PAID: 'green',
    PARTIAL: 'blue',
    PENDING: 'gold',
    OVERDUE: 'red',
    CANCELLED: 'default',
    REJECTED: 'red',
    APPROVED: 'cyan',
    ACCEPTED: 'cyan',
    COMPLETED: 'green',
};

const Row = ({
    label,
    value,
    isBadge,
    isEven,
}: {
    label: string;
    value?: string;
    isBadge?: boolean;
    isEven: boolean;
}) => (
    <div
        style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 16px',
            background: isEven ? '#f4f5f7' : '#ffffff',
        }}
    >
        <Typography.Text style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>
            {label}
        </Typography.Text>
        {isBadge && value ? (
            <Tag
                color={STATUS_COLORS[value] ?? 'gold'}
                style={{ margin: 0, borderRadius: 999, fontSize: 12, fontWeight: 500 }}
            >
                {value.charAt(0) + value.slice(1).toLowerCase()}
            </Tag>
        ) : (
            <Typography.Text style={{ fontSize: 13, color: '#374151' }}>
                {value ?? '—'}
            </Typography.Text>
        )}
    </div>
);

const PaymentTimelineAndDetails = ({ invoiceData, isLoading }: Props) => {
    const invoiceNumberLabel =
        invoiceData?.documentType === 'QUOTATION' ? 'Quotation Number' : 'Invoice Number';
    const rows = useMemo(
        () => [
            { label: invoiceNumberLabel, value: invoiceData?.invoiceNumber },
            {
                label: 'Date & Time',
                value: formatDateAndTime(invoiceData?.createdAt ?? invoiceData?.invoiceDate),
            },
            { label: 'Customer Name', value: invoiceData?.name },
            {
                label: 'Amount',
                value: invoiceData?.totalAmount
                    ? formatCurrencyAmount(
                          invoiceData.originalTotalAmount ?? invoiceData.totalAmount,
                          invoiceData.currency
                      )
                    : undefined,
            },
            { label: 'Status', value: invoiceData?.status, isBadge: true },
            { label: 'Due Date', value: formatDateAndTime(invoiceData?.dueDate) },
            ...(invoiceData?.dateOfSupply
                ? [{ label: 'Date of Supply', value: formatDateAndTime(invoiceData.dateOfSupply) }]
                : []),
        ],
        [invoiceData, invoiceNumberLabel]
    );

    if (isLoading) {
        return (
            <div style={{ background: '#fff', borderRadius: 16, padding: 16 }}>
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div
                        key={i}
                        style={{
                            height: 32,
                            background: i % 2 === 0 ? '#f4f5f7' : '#fff',
                            marginBottom: 2,
                            borderRadius: 4,
                        }}
                    />
                ))}
            </div>
        );
    }

    return (
        <div
            style={{
                background: '#fff',
                borderRadius: 16,
                overflow: 'hidden',
                border: '1px solid #f0f0f0',
            }}
        >
            {rows.map((row, index) => (
                <Row
                    key={row.label}
                    label={row.label}
                    value={row.value}
                    isBadge={row.isBadge}
                    isEven={index % 2 === 0}
                />
            ))}
        </div>
    );
};

export default PaymentTimelineAndDetails;
