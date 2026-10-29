import React from 'react';

import { ShoppingOutlined } from '@ant-design/icons';
import { Flex, Pagination } from 'antd';

import GenericTable from '@components/atomic/GenericTable';

import { CatalogItemApiData } from '../../types/catalog';
import { buildCatalogColumns } from '../../utils/tableColumns/catalog';

interface CatalogTableProps {
    items: CatalogItemApiData[];
    isLoading: boolean;
    total: number;
    page: number;
    pageSize: number;
    onPageChange: (page: number, pageSize: number) => void;
    onEdit: (item: CatalogItemApiData) => void;
    onDelete: (id: number) => void;
}

const CatalogTable = ({
    items,
    isLoading,
    total,
    page,
    pageSize,
    onPageChange,
    onEdit,
    onDelete,
}: CatalogTableProps) => (
    <div className="rounded-2xl overflow-hidden outline outline-1 outline-[#EFF1F4]">
        <GenericTable
            dataSource={items}
            rowKey="id"
            loading={isLoading}
            pagination={false}
            columns={buildCatalogColumns({ onEdit, onDelete })}
            locale={{
                emptyText: (
                    <Flex vertical align="center" justify="center" className="py-8">
                        <ShoppingOutlined className="text-3xl text-gray-300 mb-3" />
                        <p className="text-sm text-gray-500">No items match your filters.</p>
                    </Flex>
                ),
            }}
        />
        <Flex justify="flex-end" className="px-4 py-3 border-t border-gray-100">
            <Pagination
                current={page}
                pageSize={pageSize}
                total={total}
                showTotal={t => `${t} items`}
                onChange={onPageChange}
            />
        </Flex>
    </div>
);

export default CatalogTable;
