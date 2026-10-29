import React, { useMemo } from 'react';


import {  Card, Flex, Spin, Tag } from 'antd';

import TypographyText from '@components/atomic/typography/typographyText';
import { useInvoice } from '@src/domains/dashboard/Procure/hooks/useInvoice';
import { InvoiceData } from '@src/domains/dashboard/Procure/types';

const invoiceStatusCfg: Record<string, { color: string; bg: string }> = {
    'Paid':     { color: '#43B75D', bg: '#ECFDF5' },
    'Pending':  { color: '#fa8c16', bg: '#fff7e6' },
    'Overdue':  { color: '#f5222d', bg: '#fff1f0' },
    'Disputed': { color: '#8c8c8c', bg: '#f5f5f5' },
    'Verified': { color: '#1677ff', bg: '#e6f4ff' },
    'Approved': { color: '#43B75D', bg: '#ECFDF5' },
    'Rejected': { color: '#f5222d', bg: '#fff1f0' },
};

interface Props { poRef?: string; poId?: number; }

const RelatedInvoicesCard: React.FC<Props> = ({ poRef, poId }) => {
    const invoiceFilters = useMemo(
        () => (poId ? { purchaseOrderId: poId, limit: 50 } : undefined),
        [poId]
    );
    const { tableData: invoices, isLoading } = useInvoice(invoiceFilters);

    return (
         <Card className="rounded-3xl w-full !border-gray-100" styles={{ body: { padding: 32 }  }}>
            <Flex vertical gap={16}>
                <Flex justify="space-between" align="center">
                    <Flex vertical gap={2}>
                        <TypographyText className="text-sm font-medium text-black">
                            Related Invoices{poRef ? ` for ${poRef}` : ''}
                        </TypographyText>
                        <TypographyText className="text-xs text-gray-400">
                            A single purchase order can have multiple invoices over time.
                        </TypographyText>
                    </Flex>
                </Flex>

                {isLoading && <Flex justify="center"><Spin size="small" /></Flex>}
                {!isLoading && invoices.length === 0 && (
                    <TypographyText className="text-xs text-gray-400">No invoices attached yet.</TypographyText>
                )}
                {!isLoading && invoices.length > 0 && (
                    <Flex vertical gap={8}>
                        {invoices.map((inv: InvoiceData) => {
                            const cfg = invoiceStatusCfg[inv.status] ?? { color: '#595959', bg: '#f5f5f5' };
                            return (
                                <Flex
                                    key={inv.id}
                                    justify="space-between"
                                    align="center"
                                    wrap="wrap"
                                    gap={8}
                                    style={{ background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 12, padding: 16 }}
                                >
                                    <Flex vertical gap={2}>
                                        <TypographyText className="text-sm font-medium text-black">{inv.invoiceNumber}</TypographyText>
                                        <TypographyText className="text-xs text-gray-400">{inv.invoiceDate} · {inv.amount}</TypographyText>
                                    </Flex>
                                    <Flex gap={8} align="center">
                                        <Tag style={{ color: cfg.color, background: cfg.bg, border: 'none', borderRadius: 20, padding: '2px 10px', margin: 0 }}>
                                            {inv.status}
                                        </Tag>
                                    </Flex>
                                </Flex>
                            );
                        })}
                    </Flex>
                )}
            </Flex>
        </Card>
    );
};

export default RelatedInvoicesCard;
