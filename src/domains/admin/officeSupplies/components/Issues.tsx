import { useState } from 'react';

import { EyeOutlined } from '@ant-design/icons';
import { Flex, Pagination, Tag, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import GenericTable from '@components/atomic/GenericTable';
import { mapCategoryToDisplay } from '@src/domains/dashboard/officeSupplies/utils/issueTaxonomy';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { paths } from '@src/routes/paths';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';

import Header from './Header';
import useFilter from '../hooks/useFilter';
import useIssues from '../hooks/useIssues';
import { AdminIssueRow } from '../types/adminOndcIssue';

const TERMINAL_ISSUE_STATUSES = ['RESOLVED', 'REJECTED', 'CLOSED'];

const STATUS_OPTIONS = [
    { value: 'OPEN', label: 'Open' },
    { value: 'ACKNOWLEDGED', label: 'Acknowledged' },
    { value: 'INFO_REQUESTED', label: 'Info requested' },
    { value: 'RESPONSE_RECEIVED', label: 'Response received' },
    { value: 'RESOLVED', label: 'Resolved' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'ESCALATED', label: 'Escalated' },
    { value: 'CLOSED', label: 'Closed' },
];

const Issues = () => {
    // No default date window: the Issues tab is an ops queue, so it must show
    // every outstanding issue — not a rolling month that hides older open ones
    // while the "Issues (N)" badge (which is unbounded) keeps counting them.
    const initialValues = {
        searchText: '',
        sort: 'DESC',
        page: 1,
        itemsPerPage: 10,
        from: '',
        to: '',
        sortField: '',
        status: undefined as string | undefined,
        category: undefined as string | undefined,
        needsAttention: false,
    };
    const [filters, setFilters] = useState(initialValues);
    const navigate = useNavigate();
    const { handlePageChange, handleDateChange, handleFromChange, handleToChange, handleTableChange } =
        useFilter({
            setFilters,
            initalStartDate: initialValues.from,
            initalEndDate: initialValues.to,
        });
    const { searchText, updateSearchText } = useDebounceSearch(setFilters);
    const { isLoading, tableData, count, downloadReport } = useIssues(filters);
    const openDetails = (issueId: number) =>
        navigate(`${paths.systemUser.manage}/${paths.manage.orders}/issues/${issueId}`);

    const columns = [
        {
            title: 'Issue ID',
            dataIndex: 'displayId',
            key: 'displayId',
        },
        {
            title: 'Order ID',
            key: 'orderId',
            render: (_: any, record: AdminIssueRow) => record.orderId || '-',
        },
        { title: 'Corporate', dataIndex: 'corporateName', key: 'corporateName' },
        { title: 'Seller', dataIndex: 'vendorName', key: 'vendorName' },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            render: (category: string) => mapCategoryToDisplay(category),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const isTerminal = TERMINAL_ISSUE_STATUSES.includes(status);
                return (
                    <Tag
                        className={
                            isTerminal
                                ? '!bg-[#E7FFEC] !text-[#008000] !border-none !rounded-full'
                                : '!bg-[#FFEBC9] !text-[#D97706] !border-none !rounded-full'
                        }
                    >
                        {status}
                    </Tag>
                );
            },
        },
        {
            title: 'Raised',
            dataIndex: 'createdAt',
            sorter: true,
            key: 'createdAt',
            render: (createdAt: string) => (
                <Flex vertical>
                    <Typography.Text>{formattedDateOnly(new Date(createdAt))}</Typography.Text>
                    <Typography.Text>{formattedTime(new Date(createdAt))}</Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'View',
            key: 'action',
            render: (_: any, record: AdminIssueRow) => (
                <EyeOutlined onClick={() => openDetails(record.id)} />
            ),
        },
    ];

    return (
        <Flex vertical gap={20}>
            <Header
                handleDownloadReport={downloadReport}
                handleSearch={updateSearchText}
                searchText={searchText}
                searchPlaceholder="Search for issues..."
                handleDateChange={handleDateChange}
                handleFromChange={handleFromChange}
                handleToChange={handleToChange}
                from={filters.from}
                to={filters.to}
                orderStateOptions={STATUS_OPTIONS}
                orderStatePlaceholder="Status"
                orderState={filters.status}
                onOrderStateChange={value => setFilters(prev => ({ ...prev, status: value, page: 1 }))}
                needsAttentionActive={filters.needsAttention}
                onToggleNeedsAttention={() =>
                    setFilters(prev => ({ ...prev, needsAttention: !prev.needsAttention, page: 1 }))
                }
            />
            <GenericTable
                rowKey={record => record.id}
                columns={columns}
                dataSource={tableData}
                pagination={false}
                loading={isLoading}
                onChange={handleTableChange}
            />
            <Pagination
                current={filters.page}
                size="default"
                className="text-end pt-7 justify-end"
                onChange={handlePageChange}
                total={count}
                showSizeChanger={false}
            />
        </Flex>
    );
};

export default Issues;
