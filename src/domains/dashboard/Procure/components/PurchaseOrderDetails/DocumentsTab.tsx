import React, { useEffect, useState } from 'react';

import { CheckCircleFilled, FilePdfOutlined } from '@ant-design/icons';
import { Button, Card, Flex, Spin, Table, Typography } from 'antd';
import type { TableColumnsType } from 'antd';

const { Text, Title } = Typography;

const CURRENCY_SYMBOLS: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
const currencySymbol = (code: string) => CURRENCY_SYMBOLS[code?.toUpperCase()] ?? code;

const columns: TableColumnsType<any> = [
    { title: 'Description', dataIndex: 'description', key: 'description', minWidth: 120, render: (v) => <Text style={{ fontSize: 13 }}>{v}</Text> },
    { title: 'Qty',         dataIndex: 'qty',         key: 'qty',         minWidth: 70,  render: (v) => <Text style={{ fontSize: 13 }}>{v}</Text> },
    { title: 'Unit Price',  dataIndex: 'unitPrice',   key: 'unitPrice',   minWidth: 90,  render: (v) => <Text style={{ fontSize: 13 }}>{v}</Text> },
    { title: 'Total',       dataIndex: 'total',       key: 'total',       minWidth: 80,  render: (v) => <Text style={{ fontSize: 13, fontWeight: 600 }}>{v}</Text> },
];

type Props = {
    poId: number;
    fetchDocument: (id: number) => Promise<any>;
    onDownloadPdf?: () => void;
    isLoading?: boolean;
};

const DocumentsTab: React.FC<Props> = ({ poId, fetchDocument, onDownloadPdf, isLoading }) => {
    const [docData, setDocData] = useState<any>(null);
    const [isFetching, setIsFetching] = useState(false);

    useEffect(() => {
        setIsFetching(true);
        fetchDocument(poId).then((data: any) => {
            setDocData(data);
            setIsFetching(false);
        });
    }, [poId, fetchDocument]);

    if (isFetching) return <Flex justify="center" className="py-8"><Spin /></Flex>;

    const po        = docData?.po;
    const corporate = docData?.corporate;

    const companyName    = corporate?.companyName ?? po?.vendor?.businessName ?? '-';
    const companyAddress = [corporate?.city, corporate?.state, corporate?.country].filter(Boolean).join(', ') || po?.deliveryAddress || '-';

    const lineItems = (po?.lineItems ?? []).map((item: any) => ({
        key:         String(item.id),
        description: item.description,
        qty:         `${item.qty} ${item.unit ?? ''}`.trim(),
        unitPrice:   `${currencySymbol(po.currency)} ${item.unitPrice}`,
        total:       `${currencySymbol(po.currency)} ${item.total}`,
    }));

    const totalAmount    = po ? `${currencySymbol(po.currency)} ${po.totalAmount}` : '-';
    const isFullySigned  = po?.eSignStatus === 'Completed';
    const signedDate     = po?.signedByBuyerAt
        ? new Date(po.signedByBuyerAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : '-';

    return (
        <Flex vertical gap={8}>
            <Flex justify="space-between" align="center" wrap="wrap" gap={8} className="px-4 py-1">
                <Text className="text-sm font-medium text-[#000000]">Purchase Order Document</Text>
                <Button
                    size="small"
                    danger
                    loading={isLoading}
                    icon={<FilePdfOutlined />}
                    style={{ borderRadius: 6 }}
                    onClick={onDownloadPdf}
                >
                    Download PDF
                </Button>
            </Flex>

            <Card className="rounded-xl border border-[#f0f0f0]" styles={{ body: { padding: 0 } }}>
                <Flex vertical gap={2} className="px-4 py-4">
                    <Title level={5} className="!mb-0">{companyName}</Title>
                    <Text className="text-xs text-gray-400">{companyAddress}</Text>
                </Flex>

                <Table
                    columns={columns}
                    dataSource={lineItems}
                    rowKey="key"
                    size="small"
                    pagination={false}
                    scroll={{ x: 'max-content' }}
                    className="[&_.ant-table]:!rounded-none [&_.ant-table-container]:!rounded-none [&_.ant-table-cell:first-child]:!pl-4"
                    summary={() => (
                        <Table.Summary.Row>
                            <Table.Summary.Cell index={0} colSpan={3}>
                                <Text style={{ fontSize: 16, fontWeight: 500 }} className="text-right block pr-2">Total</Text>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={1}>
                                <Text style={{ fontSize: 16, fontWeight: 700, color: '#ff4d4f' }}>{totalAmount}</Text>
                            </Table.Summary.Cell>
                        </Table.Summary.Row>
                    )}
                />

                {isFullySigned && (
                    <Flex gap={10} align="center" className="mx-4 my-4 px-4 py-3 rounded-lg bg-[#ECFDF5] border border-[#43B756]">
                        <CheckCircleFilled style={{ color: '#43B756', fontSize: 18 }} />
                        <Flex vertical gap={1}>
                            <Text style={{ fontSize: 13, fontWeight: 600, color: '#262626' }}>Electronically Signed</Text>
                            <Text style={{ fontSize: 12, color: '#43B756' }}>
                                All parties signed on {signedDate}
                            </Text>
                        </Flex>
                    </Flex>
                )}
            </Card>
        </Flex>
    );
};

export default DocumentsTab;
