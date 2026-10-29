import React from 'react';

import { FileProtectOutlined } from '@ant-design/icons';
import { Flex, Pagination, Select, Typography } from 'antd';
import type { SorterResult } from 'antd/es/table/interface';

import GenericTable from '@components/atomic/GenericTable';

import type { AgingFilterOption } from '../../utils/constants/agingAnalysis';
import { AgingInvoiceRow, buildAgingColumns } from '../../utils/table_column/agingColumns';

interface Props {
    invoices: AgingInvoiceRow[];
    total: number;
    page: number;
    pageSize: number;
    isLoading: boolean;
    onPageChange: (page: number, pageSize: number) => void;
    onSortChange: (field: string | undefined, order: 'asc' | 'desc' | undefined) => void;
    filterOptions: AgingFilterOption[];
    selectedFilter: string;
    onFilterChange: (key: string) => void;
}

const SORT_FIELD_MAP: Record<string, string> = {
    outstanding: 'outstanding',
    daysOverdue: 'daysOverdue',
};

const AgingHistoryTable: React.FC<Props> = ({
    invoices,
    total,
    page,
    pageSize,
    isLoading,
    onPageChange,
    onSortChange,
    filterOptions,
    selectedFilter,
    onFilterChange,
}) => {
    const handleTableChange = (
        _: unknown,
        __: unknown,
        sorter: SorterResult<AgingInvoiceRow> | SorterResult<AgingInvoiceRow>[]
    ) => {
        const s = Array.isArray(sorter) ? sorter[0] : sorter;
        const field = typeof s.field === 'string' ? SORT_FIELD_MAP[s.field] : undefined;
        let order: 'asc' | 'desc' | undefined;
        if (s.order === 'ascend') order = 'asc';
        else if (s.order === 'descend') order = 'desc';
        onSortChange(field, order);
    };

    return (
        <div className="bg-white rounded-xl overflow-hidden outline outline-1 outline-[#EFF1F4]">
            <Flex
                align="center"
                justify="space-between"
                gap={8}
                className="px-4 py-3 border-b border-gray-100"
            >
                <Flex align="center" gap={8}>
                    <Typography.Text className="text-sm font-semibold text-gray-900">
                        Outstanding Invoices
                    </Typography.Text>
                    <Typography.Text className="text-sm text-gray-400">
                        {total} invoices
                    </Typography.Text>
                </Flex>
                <Select
                    value={selectedFilter}
                    onChange={onFilterChange}
                    className="w-40"
                    options={filterOptions.map(opt => ({
                        value: opt.key,
                        label: (
                            <Flex align="center" gap={8}>
                                {opt.color && (
                                    <span
                                        className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: opt.color }}
                                    />
                                )}
                                <span>{opt.label}</span>
                            </Flex>
                        ),
                    }))}
                />
            </Flex>
            <GenericTable
                dataSource={invoices}
                rowKey="id"
                pagination={false}
                loading={isLoading}
                columns={buildAgingColumns()}
                onChange={handleTableChange as any}
                locale={{
                    emptyText: (
                        <Flex vertical align="center" justify="center" className="py-8">
                            <FileProtectOutlined className="text-3xl text-gray-300 mb-3" />
                            <p className="text-sm text-gray-500">No invoices match your filters.</p>
                        </Flex>
                    ),
                }}
            />
            {total > 0 && (
                <Flex justify="flex-end" className="px-4 py-3 border-t border-gray-100">
                    <Pagination
                        current={page}
                        pageSize={pageSize}
                        total={total}
                        showSizeChanger
                        pageSizeOptions={['10', '25', '50']}
                        onChange={onPageChange}
                        onShowSizeChange={onPageChange}
                    />
                </Flex>
            )}
        </div>
    );
};

export default AgingHistoryTable;
