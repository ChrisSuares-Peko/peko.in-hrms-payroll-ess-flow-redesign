import React, { useState } from 'react';

import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, DatePicker, Flex, Grid, Input, Pagination } from 'antd';
import { Content } from 'antd/es/layout/layout';
import type { ColumnsType } from 'antd/es/table';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';
import dayjs, { Dayjs } from 'dayjs';

import GenericTable from '@components/atomic/GenericTable';
import TypographyText from '@components/atomic/typography/typographyText';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import useDebounceSearch from '@src/hooks/useDebounceSearch';

import StatCard from './StatCard';
import StatCardsSkeleton from './StatCardsSkeleton';
import { TABLE_HEADER_STYLE } from '../../constants/style';
import useDocumentList from '../../hooks/documents/useDocumentList';
import { StatCardItem } from '../../types';
import { DocumentRow, DocumentType } from '../../types/documents';
import { getLastMonthDateRange } from '../../utils/helperFunctions';

interface DocumentListProps {
    documentType: DocumentType;
    pageTitle: string;
    createLabel: string;
    onCreateClick: () => void;
    stats: StatCardItem[];
    statsLoading?: boolean;
    listTitle: string;
    searchPlaceholder?: string;
    columns: (
        onDeleteRequest: (row: DocumentRow) => void,
        statusFilter?: string[],
        onMarkAsPaid?: (row: DocumentRow) => void
    ) => ColumnsType<DocumentRow>;
}

const defaultDateRange = getLastMonthDateRange();

const DocumentList = ({
    documentType,
    pageTitle,
    createLabel,
    onCreateClick,
    stats,
    statsLoading = false,
    listTitle,
    searchPlaceholder = 'Search...',
    columns,
}: DocumentListProps) => {
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const isTablet = !!screens.md && !screens.xl;
    const [filters, setFilters] = useState({
        searchText: '',
        page: 1,
        itemsPerPage: 5,
        sort: 'DESC' as 'ASC' | 'DESC',
        sortField: '',
        startDate: defaultDateRange.startDate,
        endDate: defaultDateRange.endDate,
        status: '',
    });
    const { searchText, updateSearchText } = useDebounceSearch(setFilters);
    const [deletingDocument, setDeletingDocument] = useState<DocumentRow | null>(null);

    const { list, isLoading, isDeleting, deleteDocument, markAsPaid } = useDocumentList(
        filters,
        documentType
    );

    const handleDelete = (row: DocumentRow) => {
        setDeletingDocument(row);
    };

    const handleMarkAsPaid = (row: DocumentRow) => {
        markAsPaid(row.id);
    };

    const handleTableChange = (
        _: any,
        tableFilters: Record<string, FilterValue | null>,
        sorter: SorterResult<DocumentRow> | SorterResult<DocumentRow>[]
    ) => {
        const s = Array.isArray(sorter) ? sorter[0] : sorter;
        const statusValues = tableFilters?.status as string[] | null;
        setFilters(prev => ({
            ...prev,
            sortField: (s?.field as string) || '',
            sort: s?.order === 'ascend' ? 'ASC' : 'DESC',
            status: statusValues?.join(',') || '',
            page: 1,
        }));
    };

    const statusFilter = filters.status ? filters.status.split(',') : [];
    const resolvedColumns = columns(
        handleDelete,
        statusFilter.length ? statusFilter : undefined,
        handleMarkAsPaid
    );
    const rangePickerValue =
        filters.startDate && filters.endDate
            ? ([dayjs(filters.startDate), dayjs(filters.endDate)] as [Dayjs, Dayjs])
            : null;

    return (
        <Content className="px-0">
            <Flex justify="space-between" align="center" gap={12} wrap="wrap" className="mt-4 mb-6">
                <TypographyText className="text-[#101828] text-xl font-semibold leading-7">
                    {pageTitle}
                </TypographyText>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    className="h-9 w-full sm:w-auto px-4 bg-[#FF4F4F] border-[#FF4F4F] text-white font-medium text-sm rounded-lg hover:bg-[#e64444]"
                    onClick={onCreateClick}
                >
                    {createLabel}
                </Button>
            </Flex>

            <Flex gap={16} wrap="wrap" className="mb-6">
                {statsLoading ? (
                    <StatCardsSkeleton count={stats.length} verticalOnMobile={isMobile} />
                ) : (
                    <Flex vertical={isMobile} gap={16} wrap="wrap" className="w-full">
                        {stats.map(({ id, ...card }) => (
                            <StatCard key={id} {...card} />
                        ))}
                    </Flex>
                )}
            </Flex>

            <Flex vertical gap={20} className="pt-7">
                <Flex
                    vertical={isTablet || isMobile}
                    justify="space-between"
                    align={isTablet || isMobile ? 'stretch' : 'center'}
                    gap={12}
                >
                    <TypographyText className="text-[#101828] text-lg font-semibold leading-6">
                        {listTitle}
                    </TypographyText>
                    <Flex
                        vertical={isMobile}
                        align="center"
                        gap={12}
                        wrap="wrap"
                        className="w-full md:w-auto"
                    >
                        <DatePicker.RangePicker
                            className="h-10 w-full md:w-auto rounded-lg border-[#E4E4E7]"
                            onChange={(_, dateStrings) =>
                                setFilters(prev => ({
                                    ...prev,
                                    startDate: dateStrings[0] || '',
                                    endDate: dateStrings[1] || '',
                                    page: 1,
                                }))
                            }
                            format="YYYY-MM-DD"
                            value={rangePickerValue}
                        />
                        <Input
                            prefix={<SearchOutlined className="text-[#CBD5E1]" />}
                            placeholder={searchPlaceholder}
                            value={searchText}
                            onChange={updateSearchText}
                            className="w-full md:w-[260px] h-10 rounded-lg border-[#E4E4E7]"
                        />
                    </Flex>
                </Flex>

                <Flex
                    vertical
                    className="rounded-2xl overflow-hidden outline outline-1 outline-[#EFF1F4] [&>div:first-child]:hidden"
                >
                    <GenericTable
                        dataSource={list?.DocumentData ?? []}
                        columns={resolvedColumns}
                        rowKey="id"
                        pagination={false}
                        className="w-full"
                        loading={isLoading}
                        onChange={handleTableChange}
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
                        current={filters.page}
                        pageSize={filters.itemsPerPage}
                        onChange={(page, pageSize) =>
                            setFilters(prev => ({ ...prev, page, itemsPerPage: pageSize }))
                        }
                        size="default"
                        className="justify-end text-end py-4 px-5 [&_.ant-pagination-item-active]:!border-[#42526D] [&_.ant-pagination-item-active_a]:!text-[#42526D]"
                        total={list?.recordsTotal ?? 0}
                        showSizeChanger={false}
                    />
                </Flex>
            </Flex>

            <ConfirmationModal
                isOpen={!!deletingDocument}
                handleCancel={() => setDeletingDocument(null)}
                handleSubmit={() => {
                    if (deletingDocument) deleteDocument(deletingDocument.id);
                    setDeletingDocument(null);
                }}
                title={
                    deletingDocument
                        ? `Delete ${deletingDocument.prefix ?? ''}${deletingDocument.documentNumber}?`
                        : 'Delete this document?'
                }
                description="This action cannot be undone."
                isLoading={isDeleting}
            />
        </Content>
    );
};

export default DocumentList;
