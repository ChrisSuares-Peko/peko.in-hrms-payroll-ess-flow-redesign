import { FC, useCallback, useEffect, useRef, useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import {
    Button,
    Flex,
    Input,
    Pagination,
    Popover,
    Select,
    Switch,
    Table,
    Tooltip,
    TreeSelect,
} from 'antd';
import { TableProps } from 'antd/lib';

import useDebounce from '@src/hooks/useDebounce';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import {
    FOLLOW,
    NewPill,
    PositionChoice,
    categoryTreeData,
    hiddenReasonText,
    pekoCategoryLabel,
    positionOptions,
    renderPositionOption,
} from './reviewUtils';
import { ProductFilters } from '../../../../hooks/products/useSellerCategoryReview';
import { OndcCategoryTreeRow } from '../../../../types/ondcCategory';
import {
    BulkVisibilityMode,
    ListingPosition,
    ProductVisibilityFilter,
    SellerCategory,
    SellerCategoryProduct,
} from '../../../../types/ondcSellerCategory';
import { plural } from '../rules/ruleUtils';

/** Search runs once typing pauses for this long; Enter searches immediately. */
const SEARCH_DEBOUNCE_MS = 400;

interface Props {
    category: SellerCategory;
    tree: OndcCategoryTreeRow[];
    products: SellerCategoryProduct[];
    total: number;
    loading: boolean;
    filters: ProductFilters;
    onFiltersChange: (patch: Partial<ProductFilters>) => void;
    onVisibility: (mode: BulkVisibilityMode, productIds: number[]) => Promise<boolean>;
    onCategory: (productId: number, pekoCategoryId: number | null) => Promise<boolean>;
    onPosition: (productId: number, listingPosition: ListingPosition | null) => Promise<boolean>;
}

/** "Change" popover: pick a subcategory for one product, or go back to the mapping. */
const CategoryPicker: FC<{
    product: SellerCategoryProduct;
    tree: OndcCategoryTreeRow[];
    onPick: (pekoCategoryId: number | null) => Promise<boolean>;
}> = ({ product, tree, onPick }) => {
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const pick = async (id: number | null) => {
        setBusy(true);
        const done = await onPick(id);
        setBusy(false);
        if (done) setOpen(false);
    };
    return (
        <Popover
            open={open}
            onOpenChange={setOpen}
            trigger="click"
            placement="bottomLeft"
            title="Peko category for this product"
            content={
                <div className="flex w-[280px] flex-col gap-2">
                    <TreeSelect
                        placeholder="Choose a subcategory"
                        value={
                            product.overridden ? (product.pekoCategory?.id ?? undefined) : undefined
                        }
                        onChange={v => typeof v === 'number' && pick(v)}
                        treeData={categoryTreeData(tree)}
                        treeDefaultExpandAll
                        showSearch
                        treeNodeFilterProp="title"
                        disabled={busy}
                    />
                    {product.overridden && (
                        <Button size="small" disabled={busy} onClick={() => pick(null)}>
                            Follow the seller category&apos;s mapping
                        </Button>
                    )}
                </div>
            }
        >
            <button
                type="button"
                className="cursor-pointer border-none bg-transparent p-0 text-[12px] text-[#3538CD] hover:underline"
            >
                Change
            </button>
        </Popover>
    );
};

const ReviewProductsCard: FC<Props> = ({
    category,
    tree,
    products,
    total,
    loading,
    filters,
    onFiltersChange,
    onVisibility,
    onCategory,
    onPosition,
}) => {
    const [selected, setSelected] = useState<number[]>([]);
    const [busy, setBusy] = useState<BulkVisibilityMode | null>(null);
    const [search, setSearch] = useState(filters.searchText);
    const debouncedSearch = useDebounce(search, SEARCH_DEBOUNCE_MS);

    // Read through a ref so the debounce effect fires only when the typed text
    // settles — the parent passes a fresh onFiltersChange on every render.
    const latest = useRef({ filters, onFiltersChange });
    latest.current = { filters, onFiltersChange };

    /** Search for `text` unless it is already the active search (Enter, then the debounce, fire once). */
    const applySearch = useCallback((text: string) => {
        const q = text.trim();
        if (q === latest.current.filters.searchText) return;
        latest.current.onFiltersChange({ searchText: q, page: 1 });
    }, []);

    useEffect(() => {
        applySearch(debouncedSearch);
    }, [debouncedSearch, applySearch]);

    const bulk = async (mode: BulkVisibilityMode) => {
        setBusy(mode);
        const done = await onVisibility(mode, selected);
        setBusy(null);
        if (done) setSelected([]);
    };

    const columns: TableProps<SellerCategoryProduct>['columns'] = [
        {
            title: 'Product',
            key: 'name',
            render: (_, p) => (
                <Flex vertical gap={2} className="min-w-0">
                    <span className="break-words text-[13px] text-[#101828]">
                        {p.name} {p.isNew && <NewPill />}
                    </span>
                    <span className="break-words text-[11px] text-[#667085]">
                        {p.vendorName || '—'}
                    </span>
                </Flex>
            ),
        },
        {
            title: 'Price',
            key: 'price',
            width: 96,
            render: (_, p) => (p.price == null ? '—' : `₹${formatNumberWithLocalString(p.price)}`),
        },
        {
            title: 'Peko category',
            key: 'pekoCategory',
            width: 170,
            render: (_, p) => (
                <Flex align="center" gap={8} wrap="wrap">
                    {p.overridden ? (
                        <Tooltip title="This product's own choice — it ignores the seller category's mapping">
                            <span className="text-[12px] text-[#101828]">
                                {pekoCategoryLabel(p.pekoCategory)}{' '}
                                <span className="text-[11px] text-[#B54708]">· own choice</span>
                            </span>
                        </Tooltip>
                    ) : (
                        <Tooltip
                            title={pekoCategoryLabel(p.pekoCategory) || 'No Peko category yet'}
                        >
                            <span className="text-[12px] text-[#475467]">Follows mapping</span>
                        </Tooltip>
                    )}
                    <CategoryPicker product={p} tree={tree} onPick={id => onCategory(p.id, id)} />
                </Flex>
            ),
        },
        {
            title: 'Position',
            key: 'position',
            width: 170,
            render: (_, p) => (
                <Flex vertical gap={2}>
                    <Select
                        size="small"
                        className="!w-full"
                        popupMatchSelectWidth={false}
                        value={p.listingPosition ?? FOLLOW}
                        onChange={(v: PositionChoice) => onPosition(p.id, v === FOLLOW ? null : v)}
                        options={positionOptions(category.listingPosition, true)}
                        optionRender={renderPositionOption}
                    />
                    {p.listingPosition && (
                        <span className="text-[11px] text-[#B54708]">Own choice</span>
                    )}
                </Flex>
            ),
        },
        {
            title: 'Visible on Peko',
            key: 'visible',
            width: 160,
            render: (_, p) => {
                const reason = hiddenReasonText(p, category);
                // a new product's switch is still on, so Approve/Hide stand in for it
                if (p.isNew) {
                    return (
                        <Flex vertical gap={4}>
                            <Flex gap={6}>
                                <Button
                                    size="small"
                                    type="primary"
                                    onClick={() => onVisibility('show', [p.id])}
                                >
                                    Approve
                                </Button>
                                <Button size="small" onClick={() => onVisibility('hide', [p.id])}>
                                    Hide
                                </Button>
                            </Flex>
                            {reason && (
                                <span className="text-[11px] leading-[14px] text-[#98A2B3]">
                                    {reason}
                                </span>
                            )}
                        </Flex>
                    );
                }
                // a switched-on product that a rule or the mapping still hides is drawn
                // grey (index.css paints every checked switch green with !important)
                const muted = p.visibleOnPeko && !!reason;
                return (
                    <Flex vertical gap={4}>
                        <Switch
                            size="small"
                            className={`!w-fit ${muted ? '[&.ant-switch-checked]:!bg-[#D0D5DD]' : ''}`}
                            checked={p.visibleOnPeko}
                            onChange={checked => onVisibility(checked ? 'show' : 'hide', [p.id])}
                        />
                        {reason && (
                            <span className="text-[11px] leading-[14px] text-[#98A2B3]">
                                {reason}
                            </span>
                        )}
                    </Flex>
                );
            },
        },
    ];

    return (
        <section className="rounded-xl border border-[#EAECF0] bg-white">
            <Flex
                justify="space-between"
                align="center"
                wrap="wrap"
                gap={8}
                className="border-b border-[#F2F4F7] px-5 py-4"
            >
                <span className="text-[14px] font-semibold text-[#101828]">
                    Products ·{' '}
                    {filters.searchText
                        ? `${total} of ${plural(category.productCount, 'product')} match`
                        : plural(category.productCount, 'product')}
                </span>
                <Flex gap={8} wrap="wrap">
                    <Select<ProductVisibilityFilter>
                        size="small"
                        className="!w-[110px]"
                        value={filters.visibility}
                        onChange={v => onFiltersChange({ visibility: v, page: 1 })}
                        options={[
                            { value: 'all', label: 'All' },
                            { value: 'visible', label: 'Visible' },
                            { value: 'hidden', label: 'Hidden' },
                            { value: 'new', label: 'New' },
                        ]}
                    />
                    <Input
                        size="small"
                        allowClear
                        className="!w-[200px]"
                        prefix={<SearchOutlined className="text-[#98A2B3]" />}
                        placeholder="Search product or seller"
                        value={search}
                        onChange={e => {
                            setSearch(e.target.value);
                            // clearing (incl. the × button) resets the list straight away
                            if (!e.target.value) applySearch('');
                        }}
                        onPressEnter={() => applySearch(search)}
                    />
                </Flex>
            </Flex>

            {category.status === 'mapped' && category.newProductCount > 0 && (
                <Flex
                    align="center"
                    justify="space-between"
                    gap={8}
                    wrap="wrap"
                    className="mx-5 mt-3 rounded-lg bg-[#FFFAF5] px-4 py-3 text-[12px] text-[#B54708]"
                >
                    <span>
                        {plural(category.newProductCount, 'new product')}{' '}
                        {category.newProductCount === 1 ? 'is' : 'are'} hidden from corporates
                        until you approve or hide{' '}
                        {category.newProductCount === 1 ? 'it' : 'them'}.
                    </span>
                    <Flex gap={8}>
                        {filters.visibility !== 'new' && (
                            <Button
                                size="small"
                                onClick={() => onFiltersChange({ visibility: 'new', page: 1 })}
                            >
                                Show new only
                            </Button>
                        )}
                        <Button
                            size="small"
                            type="primary"
                            loading={busy === 'approveNew'}
                            onClick={() => bulk('approveNew')}
                        >
                            Approve all new
                        </Button>
                    </Flex>
                </Flex>
            )}

            <Flex
                align="center"
                gap={8}
                wrap="wrap"
                className="px-5 py-3 text-[12px] text-[#667085]"
            >
                <span>
                    {selected.length
                        ? `${selected.length} selected`
                        : 'Select products for bulk actions'}
                </span>
                <Button
                    size="small"
                    disabled={!selected.length}
                    loading={busy === 'hide'}
                    onClick={() => bulk('hide')}
                >
                    Hide selected
                </Button>
                <Button
                    size="small"
                    disabled={!selected.length}
                    loading={busy === 'show'}
                    onClick={() => bulk('show')}
                >
                    Show selected
                </Button>
                <Button
                    size="small"
                    disabled={!selected.length}
                    loading={busy === 'only'}
                    onClick={() => bulk('only')}
                >
                    Show only selected
                </Button>
                <span className="text-[11px] text-[#98A2B3]">
                    Product changes apply immediately.
                </span>
            </Flex>

            <div className="px-5">
                <Table
                    size="middle"
                    rowKey={p => p.id}
                    columns={columns}
                    dataSource={products}
                    loading={loading}
                    pagination={false}
                    // fixed layout: columns share the card width and long names wrap,
                    // so the table never needs a horizontal scrollbar
                    tableLayout="fixed"
                    rowSelection={{
                        selectedRowKeys: selected,
                        onChange: keys => setSelected(keys.map(Number)),
                    }}
                    locale={{ emptyText: 'No products match.' }}
                />
            </div>
            <Flex justify="end" className="px-5 py-4">
                <Pagination
                    size="small"
                    current={filters.page}
                    pageSize={filters.itemsPerPage}
                    total={total}
                    onChange={page => onFiltersChange({ page })}
                    showSizeChanger={false}
                    hideOnSinglePage
                />
            </Flex>
        </section>
    );
};

export default ReviewProductsCard;
