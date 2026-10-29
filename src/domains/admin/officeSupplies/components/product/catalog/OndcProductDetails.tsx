import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Card, Col, Flex, Image, Row, Select, Skeleton, Switch, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useNavigate, useParams } from 'react-router-dom';

import { Pill, SidebarCard } from '@src/domains/admin/officeSupplies/components/detail/DetailPrimitives';
import { paths } from '@src/routes/paths';
import { buildProductMetadataRows } from '@utils/ondcProductAttributes';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { DEFAULT_POSITION, FOLLOW, PositionChoice, positionLabel, positionOptions, renderPositionOption } from './review/reviewUtils';
import useOndcProductDetail from '../../../hooks/products/useOndcProductDetail';
import { AdminOndcProductDetail } from '../../../types/ondcProduct';

dayjs.extend(relativeTime);

const { Text } = Typography;

const IN_STOCK = { bg: '#ecfdf3', color: '#027a48' };
const OUT_STOCK = { bg: '#fef2f2', color: '#ef4444' };
const VISIBLE = { bg: '#ecfdf3', color: '#027a48' };
const HIDDEN = { bg: '#f5f5f5', color: '#475156' };

const displayOrDash = (value?: string | null) => (value?.trim() ? value : '-');

const inr = (value?: string | null) =>
    value ? `₹${formatNumberWithLocalString(Number(value))}` : '-';

/** Striped key/value rows for product metadata (matches mock layout). */
const MetadataRows = ({ rows }: { rows: { label: string; value: string }[] }) => (
    <Flex vertical className="flex-1 min-w-[220px]">
        {rows.map((row, i) => (
            <Flex
                key={row.label}
                align="center"
                justify="space-between"
                className={`min-h-[38px] gap-3 rounded-l-[7px] px-3 py-1 ${i % 2 === 0 ? 'bg-[#f9f9f9]' : 'bg-white'}`}
            >
                <Text className="text-sm text-[#717171]">{row.label}</Text>
                <Text className="text-sm font-semibold text-[#1e293b] text-right">{row.value}</Text>
            </Flex>
        ))}
    </Flex>
);

type SellerOfferRow = {
    key: string;
    seller: string;
    price: string;
    mrp: string;
    minOrderQty: string;
    shipping: string;
    stock: string;
};

const OndcProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { product, isLoading, notFound, isToggling, toggleVisibility, setListingPosition } = useOndcProductDetail(id);

    const backToProducts = () => navigate(`${paths.systemUser.manage}/${paths.manage.products}`);

    if (isLoading) {
        return (
            <Flex vertical gap={24}>
                <Skeleton active paragraph={{ rows: 2 }} />
                <Skeleton active paragraph={{ rows: 8 }} />
            </Flex>
        );
    }
    if (notFound || !product) {
        return (
            <Flex vertical gap={16} align="start">
                <Text className="text-lg font-medium">Product not found.</Text>
                <Button danger onClick={backToProducts}>
                    Back to products
                </Button>
            </Flex>
        );
    }

    return <ProductDetailContent product={product} isToggling={isToggling} toggleVisibility={toggleVisibility} setListingPosition={setListingPosition} backToProducts={backToProducts} />;
};

type ProductDetailContentProps = {
    product: AdminOndcProductDetail;
    isToggling: boolean;
    toggleVisibility: () => void;
    setListingPosition: ReturnType<typeof useOndcProductDetail>['setListingPosition'];
    backToProducts: () => void;
};

const ProductDetailContent = ({
    product,
    isToggling,
    toggleVisibility,
    setListingPosition,
    backToProducts,
}: ProductDetailContentProps) => {
    const stock = product.inStock ? IN_STOCK : OUT_STOCK;
    const visibility = product.visibleOnPeko ? VISIBLE : HIDDEN;
    const categoryLabel = [product.category, product.localCategory].filter(Boolean).join(' › ') || '-';
    const heroImage = product.images?.[0] || product.image || undefined;
    const ownPosition = product.listingPositionOverride;
    const inherited = product.sellerCategory?.listingPosition ?? DEFAULT_POSITION;
    const sellerCategoryText = product.sellerCategory ? `Seller category "${product.sellerCategory.label}"` : 'The seller category';
    const inheritedLabel = positionLabel(inherited);

    const metadataRows = buildProductMetadataRows({
        tags: product.tags,
        measureValue: product.measureValue,
        uom: product.uom,
        returnable: product.returnable,
        statutory: product.statutory,
    });

    const offerRow: SellerOfferRow = {
        key: String(product.id),
        seller: product.vendorName || '-',
        price: inr(product.price),
        mrp: inr(product.maxPrice),
        minOrderQty: product.minQuantity != null ? String(product.minQuantity) : '-',
        shipping: displayOrDash(product.attributes?.shippingLabel),
        stock: product.availableQuantity != null ? String(product.availableQuantity) : '-',
    };

    const offerColumns: ColumnsType<SellerOfferRow> = [
        { title: 'Seller', dataIndex: 'seller', key: 'seller' },
        { title: 'Price', dataIndex: 'price', key: 'price', width: 100 },
        { title: 'MRP', dataIndex: 'mrp', key: 'mrp', width: 100 },
        { title: 'Min Order Qty', dataIndex: 'minOrderQty', key: 'minOrderQty', width: 130 },
        { title: 'Shipping', dataIndex: 'shipping', key: 'shipping', width: 160 },
        { title: 'Stock', dataIndex: 'stock', key: 'stock', width: 80 },
    ];

    const domainTag =
        product.domain && product.localCategory
            ? `${product.domain} - ${product.localCategory}`
            : product.domain || product.localCategory || null;

    return (
        <Flex vertical gap={16}>
            <Button
                type="link"
                className="!px-0 !text-[#475156] w-fit"
                icon={<ArrowLeftOutlined />}
                onClick={backToProducts}
            >
                Back to products
            </Button>

            {/* Header */}
            <Flex vertical gap={4}>
                <Flex align="center" gap={12} wrap="wrap">
                    <Text className="text-[24px] font-semibold text-[#101828]">{product.name}</Text>
                    <Pill bg={visibility.bg} color={visibility.color}>
                        {product.visibleOnPeko ? 'Visible' : 'Hidden'}
                    </Pill>
                    <Pill bg={stock.bg} color={stock.color}>
                        {product.inStock ? 'In stock' : 'Out of stock'}
                    </Pill>
                </Flex>
                <Text className="text-[13px] text-[#868686]">
                    Catalog data is owned by the seller on the ONDC network. Peko controls visibility only.
                </Text>
            </Flex>

            <Row gutter={[24, 24]}>
                {/* LEFT */}
                <Col xs={24} lg={16}>
                    <Flex vertical gap={24}>
                        <Card title="Product" className="!rounded-xl">
                            <Flex gap={20} wrap="wrap" align="flex-start">
                                {heroImage && (
                                    <Image
                                        src={heroImage}
                                        width={96}
                                        height={96}
                                        preview={false}
                                        className="!rounded-lg !object-cover !border !border-[#e4e7ec]"
                                    />
                                )}
                                {metadataRows.length > 0 ? (
                                    <MetadataRows rows={metadataRows} />
                                ) : (
                                    <Text className="text-sm text-[#868686]">
                                        No product attributes provided by the seller.
                                    </Text>
                                )}
                            </Flex>
                        </Card>

                        <Card title="Seller Offers" className="!rounded-xl">
                            <Table
                                rowKey="key"
                                columns={offerColumns}
                                dataSource={[offerRow]}
                                pagination={false}
                                size="middle"
                            />
                        </Card>
                    </Flex>
                </Col>

                {/* RIGHT */}
                <Col xs={24} lg={8}>
                    <Flex vertical gap={16}>
                        <SidebarCard title="Seller">
                            <Text className="block text-[15px] font-medium text-[#101828]">
                                {product.vendorName || '-'}
                            </Text>
                            <Text className="text-[13px] text-[#868686]">
                                {product.networkId || product.bppId || '-'}
                            </Text>
                        </SidebarCard>

                        <SidebarCard title="Category mapping">
                            <Text className="block text-[15px] font-medium text-[#101828]">{categoryLabel}</Text>
                            {domainTag && (
                                <div className="mt-2">
                                    <Pill bg="#f0f5ff" color="#2f54eb">
                                        {domainTag}
                                    </Pill>
                                </div>
                            )}
                        </SidebarCard>

                        <SidebarCard title="Position in listing">
                            <Pill bg="#F2F4F7" color="#344054">
                                {positionLabel(ownPosition ?? inherited)}
                            </Pill>
                            <Text className="mt-2 block text-[12px] text-[#868686]">
                                {ownPosition
                                    ? `This product's own choice. ${sellerCategoryText} is listed as ${inheritedLabel}.`
                                    : `${sellerCategoryText} is listed as ${inheritedLabel}. Set on its Review page.`}
                            </Text>
                            <Flex justify="space-between" align="center" gap={12} className="mt-3">
                                <Text className="whitespace-nowrap text-[#4a5565]">Listed as</Text>
                                <Select
                                    className="min-w-0 max-w-[260px] flex-1"
                                    popupMatchSelectWidth={false}
                                    value={ownPosition ?? FOLLOW}
                                    onChange={(v: PositionChoice) => setListingPosition(v === FOLLOW ? null : v)}
                                    options={positionOptions(inherited)}
                                    optionRender={renderPositionOption}
                                />
                            </Flex>
                        </SidebarCard>

                        <SidebarCard title="Price & Availability">
                            <Flex vertical gap={10}>
                                <Flex justify="space-between">
                                    <Text className="text-[#4a5565]">Best price</Text>
                                    <Text className="font-medium text-[#252430]">{inr(product.price)}</Text>
                                </Flex>
                                <Flex justify="space-between" align="center">
                                    <Text className="text-[#4a5565]">Availability</Text>
                                    <Pill bg={stock.bg} color={stock.color}>
                                        {product.inStock ? 'In stock' : 'Out of stock'}
                                    </Pill>
                                </Flex>
                                <Flex justify="space-between">
                                    <Text className="text-[#4a5565]">Last synced</Text>
                                    <Text className="font-medium text-[#252430]">
                                        {product.lastSyncedAt ? dayjs(product.lastSyncedAt).fromNow() : '-'}
                                    </Text>
                                </Flex>
                            </Flex>
                        </SidebarCard>

                        <SidebarCard title="Visibility">
                            <Flex justify="space-between" align="center" className="mb-2">
                                <Text className="text-[#4a5565]">Visible on Peko</Text>
                                <Switch
                                    checked={product.visibleOnPeko}
                                    loading={isToggling}
                                    onChange={toggleVisibility}
                                    style={{
                                        backgroundColor: product.visibleOnPeko ? '#22c55e' : undefined,
                                    }}
                                />
                            </Flex>
                            <Text className="text-[12px] text-[#868686]">
                                Hiding removes this product from corporate listings and search. In-flight orders
                                and order history are not affected.
                            </Text>
                        </SidebarCard>
                    </Flex>
                </Col>
            </Row>
        </Flex>
    );
};

export default OndcProductDetails;
