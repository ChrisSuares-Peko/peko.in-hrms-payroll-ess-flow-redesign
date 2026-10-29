import { DownloadOutlined } from '@ant-design/icons';
import { Flex, Spin } from 'antd';
import { ColumnsType } from 'antd/lib/table';

import { formattedDateTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';
import formatString from '@utils/wordFormat';

import { ActiveSubscription, Package } from '../../types/subscription';

const getPurchaseHistoryColumns = (
    handleDownloadInvoice: any,
    loadingRows: any,
    handleDownloadDocument: any
): ColumnsType<ActiveSubscription> => [
    {
        key: 'subscriptionPaymentRefId',
        title: 'Reference Number',
        dataIndex: 'subscriptionPaymentRefId',
    },
    {
        key: 'createdAt',
        title: 'Purchase Date',
        dataIndex: 'createdAt',
        render: (date: Date) => formattedDateTime(new Date(date)),
    },
    {
        key: 'package',
        title: 'Service Name',
        dataIndex: 'package',
        render: (data: Package) => data?.packageName,
    },
    {
        key: 'subscriptionAmountPaid',
        title: 'Amount',
        dataIndex: 'subscriptionAmountPaid',
        render: (amount: number) => `₹ ${formatNumberWithLocalString(amount)}`,
    },
    {
        key: 'status',
        title: 'Status',
        dataIndex: 'status',
        render: (text: string) => (
            <span
                className={`${text === 'ACTIVE' || text === 'PURCHASED' ? 'text-textGreen' : 'text-[#FBBC11]'}`}
            >
                {formatString(text)}
            </span>
        ),
    },
    {
        key: 'details',
        title: 'Details',
        dataIndex: 'id',
        render: (invoiceId: string, record: any) =>
            record.corporateTxnId ? (
                // New way: both documents via the common others download API.
                <Flex gap={8} vertical align="start">
                    {(['invoice', 'receipt'] as const).map(type => {
                        const isRowLoading = loadingRows[`${type}-${record.corporateTxnId}`];
                        const label = type === 'invoice' ? 'Download Invoice' : 'Download Receipt';
                        return (
                            <span
                                key={type}
                                tabIndex={0}
                                role="button"
                                onClick={() => handleDownloadDocument(record, type)}
                                aria-disabled={isRowLoading}
                                onKeyDown={(event: React.KeyboardEvent<HTMLSpanElement>) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        handleDownloadDocument(record, type);
                                    }
                                }}
                                className="text-bgOrange2"
                                aria-label={`Download ${type} for transaction ID ${record.corporateTxnId}`}
                            >
                                {isRowLoading ? (
                                    <Spin size="small" className="text-xs pe-3" />
                                ) : (
                                    <DownloadOutlined className="text-xs pe-2" />
                                )}
                                {isRowLoading ? 'Downloading...' : label}
                            </span>
                        );
                    })}
                </Flex>
            ) : (
                // Legacy rows without an order reference — users-svc invoice renderer.
                <span
                    tabIndex={0}
                    role="button"
                    onClick={() => handleDownloadInvoice(invoiceId, record)}
                    aria-disabled={loadingRows[invoiceId] && loadingRows[record.tableName]}
                    onKeyDown={(event: React.KeyboardEvent<HTMLSpanElement>) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            handleDownloadInvoice(invoiceId);
                        }
                    }}
                    className="text-bgOrange2"
                    aria-label={`Download invoice for transaction ID ${invoiceId}`}
                >
                    {loadingRows[invoiceId] && loadingRows[record.tableName] ? (
                        <Spin size="small" className="text-xs pe-3" />
                    ) : (
                        <DownloadOutlined className="text-xs pe-2" />
                    )}
                    {loadingRows[invoiceId] && loadingRows[record.tableName]
                        ? 'Downloading...'
                        : 'Download Invoice'}
                </span>
            ),
    },
];

export default getPurchaseHistoryColumns;
