import { useEffect, useState } from 'react';

import { EyeOutlined, EyeInvisibleOutlined, DownOutlined } from '@ant-design/icons';
import { Descriptions, Flex, Table, TableProps, Button, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { ColumnsType } from 'antd/lib/table';

type PayrollTableProps = Omit<TableProps<any>, 'expandable'> & {
    handleSort?: TableProps<any>['onChange'];
    rowExpandable?: boolean;
};

type ExpandableData = {
    title: string;
    dataIndex: string;
    key: string;
    render?: (data: any, record: any) => React.ReactNode;
    sorter?: (a: any, b: any) => number;
};

const PayrollTable: React.FC<PayrollTableProps> = ({
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
            const screenWidth = window.innerWidth;
            let totalWidth = 0;
            const fitColumns: ColumnsType<any> = [];
            const remainingData: ExpandableData[] = [];

            columns?.forEach((column: any) => {
                if (!visibleColumns.has(column.key)) return;

                const colWidth = column.width ? column.width : 200;
                if (totalWidth + colWidth <= screenWidth) {
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
        handleResize();

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

    const expandableRowRender = (record: any) => (
            <Flex wrap="wrap" gap={12} align="center">
                {expandableData.map((data: ExpandableData) => (
                    <Descriptions key={data.key} layout="horizontal" column={1}>
                        <Descriptions.Item
                            key={data.key}
                            span={24}
                            labelStyle={{ fontWeight: 'bold', verticalAlign: 'middle' }}
                            contentStyle={{ verticalAlign: 'middle' }}
                            label={data.title}
                        >
                            {data.render
                                ? data.render(record[data.dataIndex], record)
                                : record[data.dataIndex]}
                        </Descriptions.Item>
                    </Descriptions>
                ))}
            </Flex>
        );

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

    return (
        <>
            {items.length > 0 && (
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
                        <Dropdown menu={{ items }} trigger={['click']}>
                            <Button>
                                Columns <DownOutlined />
                            </Button>
                        </Dropdown>
                    </Flex>
                </Flex>
            )}
            <Table
                columns={tableColumns}
                dataSource={dataSource}
                pagination={false}
                loading={loading}
                // scroll={{ x: 'max-content' }}
                expandable={
                    expandableData.length > 0
                        ? {
                              expandedRowRender: expandableRowRender,
                              expandRowByClick: rowExpandable,
                          }
                        : false
                }
                rowKey={restProps.rowKey || 'key'}
                onRow={() => ({
                    style: { cursor: rowExpandable ? 'pointer' : 'default' },
                })}
                {...restProps}
            />
        </>
    );
};

export default PayrollTable;
