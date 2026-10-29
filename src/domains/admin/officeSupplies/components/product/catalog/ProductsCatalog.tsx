import { useEffect, useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Badge, Flex, Input, Pagination, Tabs, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { paths } from '@src/routes/paths';

import OndcCategoriesTree from './OndcCategoriesTree';
import OndcProductsTable from './OndcProductsTable';
import OndcSellerNpsTable from './OndcSellerNpsTable';
import OndcVendorsTable from './OndcVendorsTable';
import ProductCatalogHeader from './ProductCatalogHeader';
import ReviewTab from './review/ReviewTab';
import CatalogRulesTab from './rules/CatalogRulesTab';
import { getSellerCategoriesApi } from '../../../api/ondcSellerCategories';
import useOndcEasySplitSellers from '../../../hooks/products/useOndcEasySplitSellers';
import useOndcProducts from '../../../hooks/products/useOndcProducts';
import useOndcSellerNps from '../../../hooks/products/useOndcSellerNps';
import useFilter from '../../../hooks/useFilter';
import { AdminOndcProduct } from '../../../types/ondcProduct';

export type CatalogTab = 'catalog' | 'review' | 'categories' | 'vendors' | 'sellerNps' | 'rules';

const SUBTITLE =
    'Products are published by sellers on the ONDC network and refresh automatically. Use the switches to control what corporates can see.';

const VENDORS_SUBTITLE =
    'Sellers registered as Cashfree Easy Split vendors. Pending to settle is the sum of held SPLIT order amounts not yet released.';

const SELLER_NPS_SUBTITLE =
    'Every seller NP (bpp_id) seen on on_search is listed here. Only enabled NPs ingest new catalogs. When you disable an NP you choose whether its products are deleted or switched off; switched-off products come back on when you enable it again.';

/** `initialTab`: routes such as products/review open the page on that tab. */
const ProductsCatalog = ({ initialTab = 'catalog' }: { initialTab?: CatalogTab }) => {
    const initialValues = {
        searchText: '',
        page: 1,
        itemsPerPage: 10,
        sort: 'DESC',
        sortField: 'updatedAt',
        category: undefined as string | undefined,
        sellerName: undefined as string | undefined,
        bppId: undefined as string | undefined,
        visibility: undefined as string | undefined,
        availability: undefined as string | undefined,
        city: undefined as string | undefined,
    };
    const [filters, setFilters] = useState(initialValues);
    const [vendorFilters, setVendorFilters] = useState({
        searchText: '',
        page: 1,
        itemsPerPage: 10,
        sort: 'DESC',
        sortField: 'vendorSyncedAt',
    });
    const [sellerNpFilters, setSellerNpFilters] = useState({
        searchText: '',
        page: 1,
        itemsPerPage: 10,
        sort: 'DESC',
        sortField: 'lastSeenAt',
    });
    const [activeTab, setActiveTab] = useState<CatalogTab>(initialTab);
    const navigate = useNavigate();
    const { role, id: userId } = useAppSelector(state => state.reducer.auth);

    // Review tab badge: seller categories waiting for a decision
    const [toReview, setToReview] = useState(0);
    useEffect(() => {
        if (!userId) return;
        getSellerCategoriesApi({
            userId,
            userType: role,
            status: 'unmapped',
            searchText: '',
            page: 1,
            itemsPerPage: 1,
            sort: 'DESC',
            sortField: '',
        }).then(res => {
            if (res) setToReview(res.counts?.unmapped ?? 0);
        });
    }, [userId, role]);

    const { handlePageChange, handleTableChange } = useFilter({ setFilters });
    const { searchText, updateSearchText } = useDebounceSearch(setFilters);
    const { isLoading, tableData, count, filterOptions, toggleVisibility, downloadReport } =
        useOndcProducts(filters);

    const {
        handlePageChange: handleVendorPageChange,
        handleTableChange: handleVendorTableChange,
    } = useFilter({ setFilters: setVendorFilters });
    const { searchText: vendorSearchText, updateSearchText: updateVendorSearch } =
        useDebounceSearch(setVendorFilters);
    const {
        isLoading: vendorsLoading,
        tableData: vendorsData,
        count: vendorsCount,
    } = useOndcEasySplitSellers(vendorFilters);

    const {
        handlePageChange: handleSellerNpPageChange,
        handleTableChange: handleSellerNpTableChange,
    } = useFilter({ setFilters: setSellerNpFilters });
    const { searchText: sellerNpSearchText, updateSearchText: updateSellerNpSearch } =
        useDebounceSearch(setSellerNpFilters);
    const {
        isLoading: sellerNpsLoading,
        tableData: sellerNpsData,
        count: sellerNpsCount,
        toggleEnabled: toggleSellerNpEnabled,
    } = useOndcSellerNps(sellerNpFilters);

    const set = (patch: Partial<typeof initialValues>) =>
        setFilters(prev => ({ ...prev, ...patch, page: 1 }));

    const openDetails = (record: AdminOndcProduct) =>
        navigate(`${paths.systemUser.manage}/${paths.manage.products}/details/${record.id}`);

    let tabToolbar = null;
    if (activeTab === 'catalog') {
        tabToolbar = (
            <ProductCatalogHeader
                handleDownloadReport={downloadReport}
                searchText={searchText}
                handleSearch={updateSearchText}
                filterOptions={filterOptions}
                category={filters.category}
                onCategoryChange={v => set({ category: v })}
                seller={filters.sellerName}
                onSellerChange={v => set({ sellerName: v })}
                sellerNp={filters.bppId}
                onSellerNpChange={v => set({ bppId: v })}
                visibility={filters.visibility}
                onVisibilityChange={v => set({ visibility: v })}
                availability={filters.availability}
                onAvailabilityChange={v => set({ availability: v })}
                city={filters.city}
                onCityChange={v => set({ city: v })}
            />
        );
    } else if (activeTab === 'vendors') {
        tabToolbar = (
            <Input
                allowClear
                placeholder="Search vendor name, Cashfree id, provider id…"
                prefix={<SearchOutlined className="text-[#98a2b3]" />}
                className="max-w-md"
                value={vendorSearchText}
                onChange={updateVendorSearch}
            />
        );
    } else if (activeTab === 'sellerNps') {
        tabToolbar = (
            <Input
                allowClear
                placeholder="Search bpp id, NP name, or URI…"
                prefix={<SearchOutlined className="text-[#98a2b3]" />}
                className="max-w-md"
                value={sellerNpSearchText}
                onChange={updateSellerNpSearch}
            />
        );
    }

    let tabBody = null;
    if (activeTab === 'catalog') {
        tabBody = (
            <>
                <Typography.Text className="text-[13px] text-[#868686]">{SUBTITLE}</Typography.Text>
                <OndcProductsTable
                    tableData={tableData}
                    isLoading={isLoading}
                    onTableChange={handleTableChange}
                    onToggleVisibility={toggleVisibility}
                    onView={openDetails}
                />
                <Pagination
                    current={filters.page}
                    size="default"
                    className="text-end pt-4 justify-end"
                    onChange={handlePageChange}
                    total={count}
                    showSizeChanger={false}
                />
            </>
        );
    } else if (activeTab === 'categories') {
        tabBody = <OndcCategoriesTree />;
    } else if (activeTab === 'review') {
        tabBody = <ReviewTab onCountsChange={setToReview} />;
    } else if (activeTab === 'rules') {
        tabBody = <CatalogRulesTab onOpenReview={() => setActiveTab('review')} />;
    } else if (activeTab === 'sellerNps') {
        tabBody = (
            <>
                <Typography.Text className="text-[13px] text-[#868686]">
                    {SELLER_NPS_SUBTITLE}
                </Typography.Text>
                <OndcSellerNpsTable
                    tableData={sellerNpsData}
                    isLoading={sellerNpsLoading}
                    onTableChange={handleSellerNpTableChange}
                    onToggleEnabled={toggleSellerNpEnabled}
                />
                <Pagination
                    current={sellerNpFilters.page}
                    size="default"
                    className="text-end pt-4 justify-end"
                    onChange={handleSellerNpPageChange}
                    total={sellerNpsCount}
                    showSizeChanger={false}
                />
            </>
        );
    } else {
        tabBody = (
            <>
                <Typography.Text className="text-[13px] text-[#868686]">
                    {VENDORS_SUBTITLE}
                </Typography.Text>
                <OndcVendorsTable
                    tableData={vendorsData}
                    isLoading={vendorsLoading}
                    onTableChange={handleVendorTableChange}
                />
                <Pagination
                    current={vendorFilters.page}
                    size="default"
                    className="text-end pt-4 justify-end"
                    onChange={handleVendorPageChange}
                    total={vendorsCount}
                    showSizeChanger={false}
                />
            </>
        );
    }

    return (
        <Flex vertical gap={16}>
            {tabToolbar}

            <Tabs
                activeKey={activeTab}
                onChange={key => setActiveTab(key as CatalogTab)}
                items={[
                    { key: 'catalog', label: 'Catalog' },
                    {
                        key: 'review',
                        label: (
                            <Flex align="center" gap={6}>
                                Review
                                {toReview > 0 && <Badge count={toReview} size="small" color="#FF4F4F" />}
                            </Flex>
                        ),
                    },
                    { key: 'categories', label: 'Categories' },
                    { key: 'vendors', label: 'Vendors' },
                    { key: 'sellerNps', label: 'Seller NPs' },
                    { key: 'rules', label: 'Rules' },
                ]}
            />

            {tabBody}
        </Flex>
    );
};

export default ProductsCatalog;
