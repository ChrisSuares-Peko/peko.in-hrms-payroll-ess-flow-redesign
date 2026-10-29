import React from 'react';

import { Card, Flex, Pagination, Table, Typography } from 'antd';
import type { TableProps } from 'antd';

type Props<T> = {
    title: string;
    subtitle?: React.ReactNode;
    extra?: React.ReactNode;
    columns: TableProps<T>['columns'];
    dataSource: T[];
    rowKey: TableProps<T>['rowKey'];
    loading: boolean;
    // Omit for a table that shows everything it was given.
    pagination?: {
        page: number;
        pageSize: number;
        total: number;
        onChange: (page: number) => void;
    };
    expandable?: TableProps<T>['expandable'];
    onRow?: TableProps<T>['onRow'];
    emptyText?: string;
};

// The card + table + pagination shell every section of the lookup shares, so they read as one page.
const LookupTableCard = <T extends object>({
    title,
    subtitle,
    extra,
    columns,
    dataSource,
    rowKey,
    loading,
    pagination,
    expandable,
    onRow,
    emptyText,
}: Props<T>) => (
    <Card
        className="rounded-2xl border-[#f0f0f0] shadow-none"
        styles={{ body: { padding: '24px' } }}
    >
        <Flex justify="space-between" align="center" className="pb-4 flex-wrap gap-3">
            <div>
                <Typography.Title level={5} className="!m-0 font-semibold">
                    {title}
                </Typography.Title>
                {subtitle && (
                    <Typography.Text type="secondary" className="text-xs">
                        {subtitle}
                    </Typography.Text>
                )}
            </div>
            {extra}
        </Flex>
        <Table<T>
            columns={columns}
            dataSource={dataSource}
            pagination={false}
            rowKey={rowKey}
            loading={loading}
            expandable={expandable}
            onRow={onRow}
            locale={emptyText ? { emptyText } : undefined}
            className="bg-[#fafafa] rounded-lg mt-3"
            scroll={{ x: 'max-content' }}
        />
        {pagination && (
            <Pagination
                current={pagination.page}
                pageSize={pagination.pageSize}
                size="default"
                className="text-end pt-5"
                onChange={pagination.onChange}
                total={pagination.total}
                showSizeChanger={false}
            />
        )}
    </Card>
);

export default LookupTableCard;
