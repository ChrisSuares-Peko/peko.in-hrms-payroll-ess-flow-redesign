import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, DatePicker, Flex, Input } from 'antd';
import { Content } from 'antd/es/layout/layout';
import dayjs, { Dayjs } from 'dayjs';

import TypographyText from '@components/atomic/typography/typographyText';

import QuotationStatsRow from '../components/quotation/QuotationStatsRow';
import QuotationTable from '../components/quotation/QuotationTable';
import useQuotationList from '../hooks/quotation/useQuotationList';

const QuotationsList = () => {
    const {
        quotations,
        dashboard,
        isLoading,
        isDashboardLoading,
        filters,
        searchText,
        updateSearchText,
        handleDateRange,
        handlePageChange,
        statusFilter,
        handleView,
        handleCreate,
        handleEdit,
        handleDelete,
        handleTableChange,
    } = useQuotationList();

    const rangePickerValue =
        filters.startDate && filters.endDate
            ? ([dayjs(filters.startDate), dayjs(filters.endDate)] as [Dayjs, Dayjs])
            : null;

    return (
        <Content className="px-0">
            <Flex justify="space-between" align="center" gap={12} wrap="wrap" className="mt-4 mb-6">
                <Flex vertical gap={2}>
                    <TypographyText className="text-[#101828] text-xl font-semibold leading-7">
                        Quotations
                    </TypographyText>
                    <TypographyText className="text-[#64748B] text-sm">
                        Manage and track all your quotations.
                    </TypographyText>
                </Flex>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    danger
                    className="h-9 w-full sm:w-auto px-4 font-medium text-sm rounded-lg"
                    onClick={handleCreate}
                >
                    New Quotation
                </Button>
            </Flex>

            <QuotationStatsRow dashboard={dashboard} loading={isDashboardLoading} />

            <Flex vertical gap={20} className="pt-4">
                <Flex justify="space-between" align="center" gap={12} wrap="wrap">
                    <TypographyText className="text-[#101828] text-lg font-semibold leading-6">
                        Quotation List
                    </TypographyText>
                    <Flex align="center" gap={12} wrap="wrap">
                        <DatePicker.RangePicker
                            className="h-10 w-full md:w-auto rounded-lg border-[#E4E4E7]"
                            onChange={handleDateRange}
                            format="YYYY-MM-DD"
                            value={rangePickerValue}
                        />
                        <Input
                            prefix={<SearchOutlined className="text-[#CBD5E1]" />}
                            placeholder="Search quotations..."
                            value={searchText}
                            onChange={updateSearchText}
                            className="w-full md:w-[260px] h-10 rounded-lg border-[#E4E4E7]"
                        />
                    </Flex>
                </Flex>

                <QuotationTable
                    data={quotations?.invoiceData ?? []}
                    total={quotations?.recordsTotal ?? 0}
                    page={filters.page}
                    pageSize={filters.itemsPerPage}
                    loading={isLoading}
                    statusFilter={statusFilter}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onPageChange={handlePageChange}
                    onTableChange={handleTableChange}
                />
            </Flex>
        </Content>
    );
};

export default QuotationsList;
