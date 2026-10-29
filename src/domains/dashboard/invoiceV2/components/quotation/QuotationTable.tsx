import { Flex, Pagination, TableProps, Typography } from 'antd';

import GenericTable from '@components/atomic/GenericTable';

import { InvoiceRow } from '../../types/invoice';
import getQuotationColumns, { TABLE_HEADER_STYLE } from '../../utils/table_column/quotationColumns';

interface Props {
    data: InvoiceRow[];
    total: number;
    page: number;
    pageSize: number;
    loading: boolean;
    statusFilter: string[];
    onView: (id: string) => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onPageChange: (page: number, pageSize: number) => void;
    onTableChange: TableProps<InvoiceRow>['onChange'];
}

const QuotationTable = ({
    data, total, page, pageSize, loading,
    statusFilter, onView, onEdit, onDelete,
    onPageChange, onTableChange,
}: Props) => {
    const columns = getQuotationColumns(onView, onEdit, onDelete, statusFilter);

    return (
        <Flex vertical gap={20}>
            <Flex
                vertical
                className="rounded-2xl overflow-hidden outline outline-1 outline-[#EFF1F4] [&>div:first-child]:hidden"
            >
                <GenericTable
                    dataSource={data.map(q => ({ ...q, key: q.id }))}
                    columns={columns}
                    rowKey="id"
                    pagination={false}
                    loading={loading}
                    className="w-full"
                    onChange={onTableChange}
                    locale={{
                        emptyText: (
                            <Flex vertical align="center" className="py-10">
                                <Typography.Text className="text-[#94A3B8] text-sm">
                                    No quotations found
                                </Typography.Text>
                            </Flex>
                        ),
                    }}
                    components={{
                        header: {
                            cell: ({
                                style,
                                ...rest
                            }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
                                <th {...rest} style={{ ...style, ...TABLE_HEADER_STYLE }} />
                            ),
                        },
                    }}
                />
                <Pagination
                    current={page}
                    pageSize={pageSize}
                    total={total}
                    onChange={onPageChange}
                    size="default"
                    className="justify-end text-end py-4 px-5 [&_.ant-pagination-item-active]:!border-[#42526D] [&_.ant-pagination-item-active_a]:!text-[#42526D]"
                    showSizeChanger={false}
                />
            </Flex>
        </Flex>
    );
};

export default QuotationTable;
