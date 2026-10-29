import { useEffect, useState } from 'react';

import { EyeOutlined, EyeInvisibleOutlined, DownOutlined } from '@ant-design/icons';
import { Descriptions, Flex, Pagination, Table, TableProps, Button, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { ColumnsType } from 'antd/lib/table';

type GenericTableProps = Omit<TableProps<any>, 'expandable'> & {
    handleSort?: TableProps<any>['onChange'];
    rowExpandable?: boolean;
};

export type GenericColumn<T = any> = ColumnsType<T>[number] & {
    neverFold?: boolean;
    visibilityToggle?: boolean;
};

export type GenericColumns<T = any> = GenericColumn<T>[];

type ExpandableData = {
    title: string;
    dataIndex: string;
    key: string;
    render?: (data: any, record: any) => React.ReactNode;
    sorter?: (a: any, b: any) => number;
};

const GenericTable: React.FC<GenericTableProps> = ({
    rowExpandable = false,
    dataSource,
    loading,
    columns,
    handleSort,
    ...restProps
}: any) => {
    const [tableColumns, setTableColumns] = useState<ColumnsType<any>>([]);
    const [expandableData, setExpandableData] = useState<ExpandableData[]>([]);
    const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
        new Set(columns.map((col: any) => col.key))
    );

    useEffect(() => {
        const handleResize = () => {
            const pinnedWidth = (columns || [])
                .filter((column: any) => column.neverFold && visibleColumns.has(column.key))
                .reduce((sum: number, column: any) => sum + (column.width ? column.width : 200), 0);
            const budget = window.innerWidth - pinnedWidth;
            let totalWidth = 0;
            const fitColumns: ColumnsType<any> = [];
            const remainingData: ExpandableData[] = [];

            columns?.forEach((column: any) => {
                if (!visibleColumns.has(column.key)) return;

                if (column.neverFold) {
                    fitColumns.push(column);
                    return;
                }

                const colWidth = column.width ? column.width : 200; // Default width if not provided
                if (totalWidth + colWidth <= budget) {
                    fitColumns.push(column);
                    totalWidth += colWidth;
                } else {
                    remainingData.push({
                        title: column.title,
                        dataIndex: column.dataIndex,
                        key: column.key,
                        render: column.render,
                        sorter: column.sorter,
                    });
                }
            });

            setTableColumns(fitColumns);
            setExpandableData(remainingData);
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Initial call

        return () => window.removeEventListener('resize', handleResize);
    }, [dataSource, columns, visibleColumns]);

    const toggleColumnVisibility = (key: string) => {
        setVisibleColumns(prev => {
            const newSet = new Set(prev);
            if (newSet.has(key)) {
                newSet.delete(key);
            } else {
                newSet.add(key);
            }
            return newSet;
        });
    };

    const expandableRowRender = (record: any) => {
        const mid = Math.ceil(expandableData.length / 2);
        const leftColumn = expandableData.slice(0, mid);
        const rightColumn = expandableData.slice(mid);

        const renderColumn = (fields: ExpandableData[]) => (
            <Descriptions
                layout="horizontal"
                column={1}
                size="small"
                className="w-full"
                labelStyle={{
                    fontWeight: 600,
                    minWidth: 96,
                    maxWidth: 180,
                    paddingRight: 12,
                    verticalAlign: 'top',
                }}
                contentStyle={{ verticalAlign: 'top' }}
            >
                {fields.map((data: ExpandableData) => (
                    <Descriptions.Item key={data.key} label={data.title}>
                        {data.render
                            ? data.render(record[data.dataIndex], record)
                            : record[data.dataIndex]}
                    </Descriptions.Item>
                ))}
            </Descriptions>
        );

        return (
            <Flex className="w-full flex-col gap-3 px-3 py-2 md:flex-row md:gap-[30px]">
                {[leftColumn, rightColumn]
                    .filter(column => column.length > 0)
                    .map(column => (
                        <div className="min-w-0 flex-1" key={column[0].key}>
                            {renderColumn(column)}
                        </div>
                    ))}
            </Flex>
        );
    };

    const list: any[] = columns
        .map((column: any) =>
            column.visibilityToggle
                ? {
                      key: column.key,
                      label: (
                          <Button
                              type="text"
                              icon={
                                  visibleColumns.has(column.key) ? (
                                      <EyeOutlined />
                                  ) : (
                                      <EyeInvisibleOutlined />
                                  )
                              }
                              onClick={() => toggleColumnVisibility(column.key)}
                          >
                              {column.title}
                          </Button>
                      ),
                  }
                : null
        )
        .filter(Boolean);
    const items: MenuProps['items'] = list?.length ? list : [];

    const { pagination: paginationProp, ...tableRestProps } = restProps;
    const externalPagination = paginationProp && paginationProp !== false ? paginationProp : null;

    return (
        <>
            <Flex style={{ marginBottom: 10 }} wrap="wrap" align="center" justify="space-between">
                <Flex className="hidden md:block">
                    {columns.map(
                        (column: any) =>
                            column.visibilityToggle && (
                                <Button
                                    key={column.key}
                                    icon={
                                        visibleColumns.has(column.key) ? (
                                            <EyeOutlined />
                                        ) : (
                                            <EyeInvisibleOutlined />
                                        )
                                    }
                                    onClick={() => toggleColumnVisibility(column.key)}
                                    style={{ margin: '0 8px 8px 0' }}
                                >
                                    {column.title}
                                </Button>
                            )
                    )}
                </Flex>
                <Flex className="md:hidden w-full">
                    {list.length ? (
                        <Dropdown menu={{ items }} trigger={['click']}>
                            <Button>
                                Columns <DownOutlined />
                            </Button>
                        </Dropdown>
                    ) : (
                        ''
                    )}
                </Flex>
            </Flex>
            <Table
                columns={tableColumns}
                dataSource={dataSource}
                pagination={false}
                loading={loading}
                expandable={
                    expandableData.length > 0
                        ? {
                              expandedRowRender: expandableRowRender,
                              expandRowByClick: rowExpandable,
                          }
                        : false
                }
                rowKey={tableRestProps.rowKey || 'key'}
                onRow={() => ({
                    style: { cursor: rowExpandable ? 'pointer' : 'default' },
                })}
                {...tableRestProps}
            />
            {externalPagination &&
                (() => {
                    const hideSingle =
                        externalPagination.hideOnSinglePage &&
                        (externalPagination.total ?? 0) <= (externalPagination.pageSize ?? 10);
                    if (hideSingle) return null;
                    return (
                        <div className="pt-4 text-end">
                            <Pagination
                                current={externalPagination.current}
                                pageSize={externalPagination.pageSize}
                                total={externalPagination.total}
                                showSizeChanger={externalPagination.showSizeChanger ?? false}
                                onChange={externalPagination.onChange}
                            />
                        </div>
                    );
                })()}
        </>
    );
};

export default GenericTable;
