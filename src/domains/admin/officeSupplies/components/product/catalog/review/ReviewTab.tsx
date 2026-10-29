import { FC, useEffect, useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Pagination, Popconfirm, Tabs, Typography } from 'antd';
import { TableProps } from 'antd/lib';
import { useNavigate } from 'react-router-dom';

import GenericTable from '@components/atomic/GenericTable';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { paths } from '@src/routes/paths';

import {
    DomainPill,
    NewPill,
    NewProductsPill,
    StatusPill,
    pekoCategoryLabel,
    reviewedText,
    sourcesText,
} from './reviewUtils';
import useOndcSellerCategories from '../../../../hooks/products/useOndcSellerCategories';
import useFilter from '../../../../hooks/useFilter';
import {
    SellerCategoriesQuery,
    SellerCategory,
    SellerCategoryTab,
} from '../../../../types/ondcSellerCategory';
import { plural } from '../rules/ruleUtils';

const TABS: { key: SellerCategoryTab; label: string }[] = [
    { key: 'unmapped', label: 'To review' },
    { key: 'mapped', label: 'Mapped' },
    { key: 'excluded', label: 'Excluded' },
    { key: 'all', label: 'All' },
];

export const reviewDetailPath = (id: number) =>
    `${paths.systemUser.manage}/${paths.manage.products}/review/${id}`;

/**
 * Products › Review: every seller category (the category a seller sends on
 * each item), grouped by the admin's decision. Its products are hidden until
 * it is mapped to a Peko category; products that arrive after that are hidden
 * until approved, and bring the category back to To review.
 */
const hasNewProducts = (r: SellerCategory) => r.status === 'mapped' && r.newProductCount > 0;

const ReviewTab: FC<{ onCountsChange?: (toReview: number) => void }> = ({ onCountsChange }) => {
    const navigate = useNavigate();
    const [filters, setFilters] = useState<SellerCategoriesQuery>({
        status: 'unmapped',
        searchText: '',
        page: 1,
        itemsPerPage: 10,
        sort: 'DESC',
        sortField: '',
    });
    const { handlePageChange, handleTableChange } = useFilter({ setFilters });
    const { searchText, updateSearchText } = useDebounceSearch(setFilters);
    const { isLoading, rows, total, counts, markAllReviewed } = useOndcSellerCategories(filters);

    // keep the Review tab badge in step with what this tab loaded
    useEffect(() => {
        if (!isLoading) onCountsChange?.(counts.unmapped);
    }, [counts.unmapped, isLoading, onCountsChange]);

    const newCount = rows.filter(r => r.isNew).length;

    const columns: TableProps<SellerCategory>['columns'] = [
        {
            title: 'Seller category',
            key: 'label',
            width: 320,
            render: (_, r) => (
                <Flex vertical gap={2}>
                    <Flex align="center" gap={6}>
                        <Typography.Text className="text-[13px] font-medium text-[#101828]">
                            {r.label}
                        </Typography.Text>
                        {r.isNew && <NewPill />}
                        {hasNewProducts(r) && <NewProductsPill count={r.newProductCount} />}
                    </Flex>
                    <span className="text-[11px] text-[#667085]">{sourcesText(r) || '—'}</span>
                </Flex>
            ),
        },
        {
            title: 'Domain',
            key: 'domain',
            width: 100,
            render: (_, r) => <DomainPill code={r.ondcDomain} />,
        },
        {
            title: 'Products',
            key: 'productCount',
            dataIndex: 'productCount',
            width: 140,
            sorter: true,
            render: (_, r) => (
                <Flex vertical gap={1}>
                    <span className="text-[13px] font-semibold text-[#3538CD]">
                        {r.productCount}
                    </span>
                    <span className="text-[11px] text-[#667085]">
                        {r.visibleCount} visible · {r.hiddenCount} hidden
                    </span>
                </Flex>
            ),
        },
        {
            title: 'Status',
            key: 'status',
            width: 110,
            render: (_, r) => <StatusPill status={r.status} />,
        },
        {
            title: 'Peko category',
            key: 'pekoCategory',
            width: 200,
            render: (_, r) => {
                if (r.status === 'excluded')
                    return <span className="text-[12px] text-[#667085]">Not listed</span>;
                return (
                    <span
                        className={`text-[12px] ${r.pekoCategory ? 'text-[#101828]' : 'text-[#667085]'}`}
                    >
                        {pekoCategoryLabel(r.pekoCategory) || 'Waiting for a decision'}
                    </span>
                );
            },
        },
        {
            title: 'Reviewed',
            key: 'reviewed',
            width: 190,
            render: (_, r) => <span className="text-[11px] text-[#667085]">{reviewedText(r)}</span>,
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 90,
            render: (_, r) => (
                <Typography.Link
                    className="!text-lightRed"
                    onClick={() => navigate(reviewDetailPath(r.id))}
                >
                    Review
                </Typography.Link>
            ),
        },
    ];

    return (
        <Flex vertical gap={12}>
            <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                <Input
                    allowClear
                    placeholder="Search seller category, seller, NP…"
                    prefix={<SearchOutlined className="text-[#98a2b3]" />}
                    className="max-w-md"
                    value={searchText}
                    onChange={updateSearchText}
                />
                <Popconfirm
                    title="Mark every category as reviewed?"
                    description="Clears the New badge. No decision changes."
                    okText="Mark all"
                    onConfirm={markAllReviewed}
                >
                    <Button>Mark all reviewed</Button>
                </Popconfirm>
            </Flex>

            <Tabs
                size="small"
                activeKey={filters.status}
                onChange={key =>
                    setFilters(prev => ({ ...prev, status: key as SellerCategoryTab, page: 1 }))
                }
                items={TABS.map(t => ({
                    key: t.key,
                    label: (
                        <span>
                            {t.label} <span className="ml-1 text-[#98A2B3]">{counts[t.key]}</span>
                        </span>
                    ),
                }))}
            />

            <GenericTable
                rowKey={(r: SellerCategory) => r.id}
                columns={columns}
                dataSource={rows}
                loading={isLoading}
                onChange={handleTableChange}
                pagination={false}
                rowClassName={(r: SellerCategory) =>
                    r.isNew || hasNewProducts(r) ? '!bg-[#FFFAF5]' : ''
                }
                locale={{
                    emptyText:
                        filters.status === 'unmapped'
                            ? 'Nothing to review — every seller category and product has a decision.'
                            : 'No seller categories here.',
                }}
            />

            <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
                <span className="text-[12px] text-[#667085]">
                    {filters.status === 'unmapped'
                        ? `${plural(counts.unmapped, 'seller category', 'seller categories')} waiting for review`
                        : `${plural(total, 'seller category', 'seller categories')}`}
                    {newCount > 0 && ` · ${newCount} new on this page`}
                </span>
                <Pagination
                    current={filters.page}
                    pageSize={filters.itemsPerPage}
                    total={total}
                    onChange={handlePageChange}
                    showSizeChanger={false}
                    hideOnSinglePage
                />
            </Flex>
        </Flex>
    );
};

export default ReviewTab;
