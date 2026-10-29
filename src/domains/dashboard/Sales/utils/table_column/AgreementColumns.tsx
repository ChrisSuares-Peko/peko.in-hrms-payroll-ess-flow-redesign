import {
    DeleteOutlined,
    DownloadOutlined,
    EditOutlined,
    LinkOutlined,
    LoadingOutlined,
} from '@ant-design/icons';
import { Flex, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import { AGREEMENT_STATUS_STYLE } from '../../constants/style';
import { AgreementRow, AgreementStatus } from '../../types/agreement';

const getAgreementColumns = (
    onView: (row: AgreementRow) => void,
    onEdit: (row: AgreementRow) => void,
    onDownload: (row: AgreementRow) => void,
    onDelete: (row: AgreementRow) => void,
    onViewFromLink?: (row: AgreementRow) => void,
    downloadingId?: string | null
): ColumnsType<AgreementRow> => [
    {
        title: 'Agreement ID',
        dataIndex: 'displayId',
        key: 'id',
        sorter: true,
        render: (v: string) => (
            <Typography.Text className="text-[#42526D] text-sm">{v}</Typography.Text>
        ),
    },
    {
        title: 'Customer',
        dataIndex: 'customer',
        key: 'customer',
        sorter: true,
        render: (v: string) => (
            <Typography.Text className="text-[#42526D] text-sm">{v}</Typography.Text>
        ),
    },
    {
        title: 'Linked Quotation',
        dataIndex: 'linkedQuotation',
        key: 'linkedQuotation',
        render: (v: string, row) => {
            const hasQuotation =
                row.quotationId && row.quotationPrefix && row.quotationInvoiceNumber;
            const formattedQuotation = hasQuotation
                ? `${row.quotationPrefix}${row.quotationInvoiceNumber}`
                : v;

            return hasQuotation ? (
                <Flex
                    align="center"
                    gap={6}
                    className="cursor-pointer hover:opacity-70"
                    onClick={() => onViewFromLink?.(row)}
                >
                    <LinkOutlined className="text-[#42526D]" />
                    <Typography.Text className="text-[#42526D] text-sm">
                        {formattedQuotation}
                    </Typography.Text>
                </Flex>
            ) : (
                <Flex align="center" gap={6}>
                    <Typography.Text className="text-[#CBD5E1] text-sm">{v || '-'}</Typography.Text>
                </Flex>
            );
        },
    },
    {
        title: 'Start Date',
        dataIndex: 'startDate',
        key: 'startDate',
        sorter: true,
        render: (v: string) => (
            <Typography.Text className="text-[#42526D] text-sm">{v}</Typography.Text>
        ),
    },
    {
        title: 'Last Updated',
        dataIndex: 'lastUpdated',
        key: 'updatedAt',
        sorter: true,
        render: (v: string) => (
            <Typography.Text className="text-[#42526D] text-sm">{v}</Typography.Text>
        ),
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (v: AgreementStatus) => {
            const s = AGREEMENT_STATUS_STYLE[v] ?? AGREEMENT_STATUS_STYLE.Draft;
            return (
                <Tag
                    className="rounded-full text-xs font-medium border-0 px-3 py-1"
                    style={{ backgroundColor: s.bg, color: s.text }}
                >
                    {v}
                </Tag>
            );
        },
    },
    {
        title: 'Actions',
        key: 'actions',
        render: (_, row) => {
            const canView = row.status === 'Sent' || row.status === 'Signed';
            return (
                <Flex align="center" gap={12}>
                    {canView && (
                        <Typography.Text
                            className="text-[#42526D] text-sm font-medium cursor-pointer hover:text-[#475569]"
                            onClick={() => onView(row)}
                        >
                            View
                        </Typography.Text>
                    )}
                    <EditOutlined
                        className="text-[#42526D] cursor-pointer hover:text-[#1E293B]"
                        onClick={() => onEdit(row)}
                    />
                    {canView && (
                        downloadingId === String(row.id)
                            ? <LoadingOutlined className="text-[#42526D]" spin />
                            : <DownloadOutlined
                                  className="text-[#42526D] cursor-pointer hover:text-[#1E293B]"
                                  onClick={() => onDownload(row)}
                              />
                    )}
                    <DeleteOutlined
                        className="text-[#42526D] cursor-pointer hover:text-red-500"
                        onClick={() => onDelete(row)}
                    />
                </Flex>
            );
        },
    },
];

export default getAgreementColumns;
