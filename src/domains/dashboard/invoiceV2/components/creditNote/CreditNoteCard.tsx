import { Descriptions, Divider, Flex, Tag, Typography } from 'antd';
import dayjs from 'dayjs';

import { CreditNoteRow } from '../../types/creditNote';
import {
    CREDIT_NOTE_REASON_LABELS,
    CREDIT_NOTE_STATUS_CONFIG,
} from '../../utils/constants/creditNote';

interface Props {
    creditNote: CreditNoteRow;
}

const fmt = (amount: string | number, currency = 'INR') => {
    const sym = currency === 'INR' ? '₹' : currency;
    return `${sym}${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
};

const CreditNoteCard = ({ creditNote }: Props) => {
    const statusCfg = CREDIT_NOTE_STATUS_CONFIG[creditNote.status] ?? {
        label: creditNote.status,
        color: '#71717A',
        bg: '#F4F4F5',
    };

    const cn = creditNote.prefix
        ? `${creditNote.prefix}${creditNote.creditNoteNumber}`
        : creditNote.creditNoteNumber;

    const linkedInv = creditNote.linkedInvoicePrefix
        ? `${creditNote.linkedInvoicePrefix}${creditNote.linkedInvoiceNumber}`
        : creditNote.linkedInvoiceNumber;

    const subtotal = parseFloat(creditNote.subtotal || '0');
    const tax = parseFloat(creditNote.tax || '0');
    const discount = parseFloat(creditNote.discount || '0');
    const shipping = parseFloat(creditNote.shippingCost || '0');
    const total = parseFloat(creditNote.totalAmount || '0');

    return (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-[#F8FAFC] px-6 py-5 border-b border-[#E2E8F0]">
                <Flex justify="space-between" align="flex-start">
                    <div>
                        <Typography.Text className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest block mb-1">
                            Credit Note
                        </Typography.Text>
                        <Typography.Text className="text-2xl font-bold text-[#1E293B] block">
                            {cn}
                        </Typography.Text>
                        <Typography.Text className="text-sm text-[#64748B]">
                            Issued {dayjs(creditNote.issueDate).format('DD MMM YYYY')}
                        </Typography.Text>
                    </div>
                    <Tag
                        className="rounded-full text-sm font-semibold border-0 px-4 py-1 mt-1"
                        style={{ color: statusCfg.color, backgroundColor: statusCfg.bg }}
                    >
                        {statusCfg.label}
                    </Tag>
                </Flex>
            </div>

            <div className="px-6 py-5">
                {/* Customer + Reason */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
                    <div>
                        <Typography.Text className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest block mb-2">
                            Issued To
                        </Typography.Text>
                        <Typography.Text className="text-sm font-semibold text-[#1E293B] block">
                            {creditNote.customerName}
                        </Typography.Text>
                        {creditNote.customerEmail && (
                            <Typography.Text className="text-sm text-[#64748B] block">
                                {creditNote.customerEmail}
                            </Typography.Text>
                        )}
                        {creditNote.customerPhone && (
                            <Typography.Text className="text-sm text-[#64748B] block">
                                {creditNote.customerPhone}
                            </Typography.Text>
                        )}
                        {creditNote.gstNumber && (
                            <Typography.Text className="text-xs text-[#94A3B8] block mt-1">
                                GSTIN: {creditNote.gstNumber}
                            </Typography.Text>
                        )}
                    </div>
                    <div>
                        <Typography.Text className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest block mb-2">
                            Credit Note Info
                        </Typography.Text>
                        <Descriptions column={1} size="small" colon>
                            {linkedInv && (
                                <Descriptions.Item label="Linked Invoice">
                                    <Typography.Text className="text-sm font-medium text-[#42526D]">
                                        {linkedInv}
                                    </Typography.Text>
                                </Descriptions.Item>
                            )}
                            <Descriptions.Item label="Reason">
                                <Typography.Text className="text-sm text-[#1E293B]">
                                    {CREDIT_NOTE_REASON_LABELS[creditNote.reason] ?? creditNote.reason}
                                </Typography.Text>
                            </Descriptions.Item>
                            {creditNote.reasonDetail && (
                                <Descriptions.Item label="Details">
                                    <Typography.Text className="text-sm text-[#64748B]">
                                        {creditNote.reasonDetail}
                                    </Typography.Text>
                                </Descriptions.Item>
                            )}
                            {creditNote.dueDate && (
                                <Descriptions.Item label="Due Date">
                                    <Typography.Text className="text-sm text-[#1E293B]">
                                        {dayjs(creditNote.dueDate).format('DD MMM YYYY')}
                                    </Typography.Text>
                                </Descriptions.Item>
                            )}
                        </Descriptions>
                    </div>
                </div>

                <Divider className="my-4" />

                {/* Items */}
                {creditNote.items && creditNote.items.length > 0 && (
                    <>
                        <div className="overflow-x-auto mb-4">
                            <table className="w-full min-w-[600px] text-sm">
                                <thead>
                                    <tr className="bg-[#FAFBFB]">
                                        {['#', 'Description', 'HSN', 'Qty', 'Unit Price', 'Tax%', 'Amount'].map(h => (
                                            <th
                                                key={h}
                                                className="text-left px-3 py-2 text-xs font-semibold text-[#42526D] uppercase tracking-wide"
                                            >
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {creditNote.items.map((item, i) => (
                                        <tr key={i} className="border-t border-[#F1F5F9]">
                                            <td className="px-3 py-2 text-[#64748B]">{i + 1}</td>
                                            <td className="px-3 py-2 text-[#1E293B] font-medium">{item.name}</td>
                                            <td className="px-3 py-2 text-[#64748B]">{item.hsn || '—'}</td>
                                            <td className="px-3 py-2 text-[#1E293B]">{item.quantity}</td>
                                            <td className="px-3 py-2 text-[#1E293B]">{fmt(item.unitPrice, creditNote.currency)}</td>
                                            <td className="px-3 py-2 text-[#64748B]">{item.taxRate || '0'}%</td>
                                            <td className="px-3 py-2 text-[#1E293B] font-medium">{fmt(item.netAmount, creditNote.currency)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Divider className="my-4" />
                    </>
                )}

                {/* Totals */}
                <Flex justify="flex-end">
                    <div className="w-full max-w-xs space-y-2">
                        {[
                            { label: 'Subtotal', value: subtotal },
                            { label: 'GST', value: tax },
                            ...(discount > 0 ? [{ label: 'Discount', value: -discount }] : []),
                            ...(shipping > 0 ? [{ label: 'Shipping', value: shipping }] : []),
                        ].map(row => (
                            <Flex key={row.label} justify="space-between" className="text-sm">
                                <Typography.Text className="text-[#64748B]">{row.label}</Typography.Text>
                                <Typography.Text className="text-[#1E293B]">
                                    {fmt(row.value, creditNote.currency)}
                                </Typography.Text>
                            </Flex>
                        ))}
                        <Divider className="my-2" />
                        <div className="bg-[#DCFCE7] rounded-lg px-4 py-3">
                            <Flex justify="space-between" align="center">
                                <Typography.Text className="text-sm font-bold text-[#166534] uppercase tracking-wide">
                                    Total
                                </Typography.Text>
                                <Typography.Text className="text-lg font-bold text-[#15803D]">
                                    {fmt(total, creditNote.currency)}
                                </Typography.Text>
                            </Flex>
                        </div>
                    </div>
                </Flex>

                {/* Notes */}
                {creditNote.notes && (
                    <>
                        <Divider className="my-4" />
                        <div>
                            <Typography.Text className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest block mb-1">
                                Notes
                            </Typography.Text>
                            <Typography.Text className="text-sm text-[#64748B]">
                                {creditNote.notes}
                            </Typography.Text>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default CreditNoteCard;
