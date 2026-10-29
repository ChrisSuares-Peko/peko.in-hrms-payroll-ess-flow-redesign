import { Flex, Pagination, Typography } from 'antd';

import GenericTable from '@components/atomic/GenericTable';

import { CreditNoteRow, CreditNoteStatus } from '../../types/creditNote';
import getCreditNoteColumns, {
    TABLE_HEADER_STYLE,
} from '../../utils/table_column/creditNoteColumns';

interface Props {
    data: CreditNoteRow[];
    total: number;
    page: number;
    pageSize: number;
    loading: boolean;
    onView: (id: string) => void;
    onUpdateStatus: (creditNoteId: string, status: CreditNoteStatus) => Promise<boolean>;
    onPageChange: (page: number, pageSize: number) => void;
}

const CreditNoteTable = ({
    data,
    total,
    page,
    pageSize,
    loading,
    onView,
    onUpdateStatus,
    onPageChange,
}: Props) => {
    const columns = getCreditNoteColumns(onView, onUpdateStatus);

    return (
        <Flex vertical gap={20}>
            <Flex
                vertical
                className="rounded-2xl overflow-hidden outline outline-1 outline-[#EFF1F4] [&>div:first-child]:hidden"
            >
                <GenericTable
                    dataSource={data.map(cn => ({ ...cn, key: cn.id }))}
                    columns={columns}
                    rowKey="id"
                    pagination={false}
                    loading={loading}
                    className="w-full"
                    locale={{
                        emptyText: (
                            <Flex vertical align="center" className="py-10">
                                <Typography.Text className="text-[#94A3B8] text-sm">
                                    No credit notes found
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

export default CreditNoteTable;
