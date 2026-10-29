import { useState, type FC } from 'react';

import { Flex, Skeleton, Typography } from 'antd';

import KeyAttributes from './KeyAttributes';
import ProductBuyBox from './ProductBuyBox';
import ProductGallery from './ProductGallery';
import SimilarProducts from './SimilarProducts';
import { ProductDetails as ProductDetailsType, ProductImage } from '../../types/productDetails';
import {
    formatIsoDuration,
    getBrand,
    getCountryOfOrigin,
    getHsn,
    getNetQuantity,
    parseConsumerCare,
} from '../../utils/productAttributes';
import ClampedTextWithMore from '../common/ClampedTextWithMore';

const { Text } = Typography;

interface ProductDetailsProps {
    productDetails: ProductDetailsType;
    productImages: ProductImage[];
    isLoading: boolean;
}

const SectionHeading: FC<{ children: string }> = ({ children }) => (
    <Text className="text-[18px] font-semibold tracking-[0.4px] text-black">{children}</Text>
);

const Hairline: FC = () => <div className="h-px w-full bg-[#ededed]" />;

/** A striped key/value column for the Product details table (each row rounded, per Figma). */
const DetailsColumn: FC<{ rows: { label: string; value: string }[] }> = ({ rows }) => (
    <Flex vertical className="flex-1">
        {rows.map((row, i) => (
            <Flex
                key={row.label}
                align="center"
                justify="space-between"
                className={`min-h-[42px] gap-3 rounded-l-[7px] px-4 py-1 ${i % 2 === 0 ? 'bg-[#f9f9f9]' : 'bg-white'}`}
            >
                {/* Without these, a long value (e.g. a full country name) squeezed the
                    label to one character per line on a 272px phone. */}
                <Text className="shrink-0 text-sm text-[#717171]">{row.label}</Text>
                <Text className="min-w-0 break-words text-right text-sm font-semibold text-[#1e293b]">
                    {row.value}
                </Text>
            </Flex>
        ))}
    </Flex>
);

const ProductDetails: FC<ProductDetailsProps> = ({ productImages, productDetails, isLoading }) => {
    const [showFull, setShowFull] = useState(false);

    if (isLoading || !productDetails) {
        return <Skeleton active className="my-8" paragraph={{ rows: 12 }} />;
    }

    const rawDesc = productDetails.longDesc || productDetails.shortDesc || '';
    // ONDC feeds often repeat the product name as the description — showing it
    // twice right under the title looks broken, so drop it there.
    const desc = rawDesc.trim() === productDetails.name?.trim() ? '' : rawDesc;
    const isLong = desc.length > 180;
    const shownDesc = showFull || !isLong ? desc : `${desc.slice(0, 180)}….`;

    const yesNo = (flag?: boolean | null) => {
        if (flag == null) return '';
        return flag ? 'Yes' : 'No';
    };
    const returnWindow = formatIsoDuration(productDetails.returnWindow);
    const timeToShip = formatIsoDuration(productDetails.timeToShip);
    const consumerCare = parseConsumerCare(productDetails.consumerCare);

    // Only rows the catalog actually provides — no placeholders.
    const detailRows = [
        { label: 'Brand', value: getBrand(productDetails) },
        { label: 'Country of origin', value: getCountryOfOrigin(productDetails) },
        { label: 'Net quantity', value: getNetQuantity(productDetails) },
        { label: 'HSN code', value: getHsn(productDetails) },
        { label: 'Returnable', value: yesNo(productDetails.returnable) },
        { label: 'Return window', value: productDetails.returnable ? returnWindow : '' },
        { label: 'Cancellable', value: yesNo(productDetails.cancellable) },
        { label: 'Ships within', value: timeToShip },
        {
            label: 'Min order quantity',
            value: productDetails.minQuantity ? `${productDetails.minQuantity}` : '',
        },
        {
            label: 'Max order quantity',
            value: productDetails.maxQuantity ? `${productDetails.maxQuantity}` : '',
        },
    ].filter(row => row.value);
    const detailsLeft = detailRows.slice(0, Math.ceil(detailRows.length / 2));
    const detailsRight = detailRows.slice(Math.ceil(detailRows.length / 2));

    // Returns & support copy built from real seller policy fields only.
    const supportLines = [
        productDetails.returnable != null &&
            (productDetails.returnable
                ? `Returns accepted${returnWindow ? ` within ${returnWindow}` : ''} of delivery.`
                : 'This item is not returnable.'),
        productDetails.cancellable != null &&
            (productDetails.cancellable
                ? 'Order can be cancelled before dispatch.'
                : 'This order cannot be cancelled once placed.'),
        consumerCare &&
            `Consumer care: ${[consumerCare.name, consumerCare.email, consumerCare.phone]
                .filter(Boolean)
                .join(' · ')}`,
    ].filter(Boolean) as string[];

    return (
        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            {/* Gallery + info (top-left cell on xl) */}
            <div className="flex min-w-0 flex-col gap-5 lg:flex-row">
                <div className="w-full max-w-full shrink-0 lg:w-[320px] xxl:w-[340px]">
                    <ProductGallery images={productImages} name={productDetails.name} />
                </div>
                <Flex vertical gap={20} className="min-w-0 flex-1">
                    <Flex vertical gap={10}>
                        <ClampedTextWithMore
                            text={productDetails.name}
                            clampClass="line-clamp-3"
                            textClassName="text-[24px] font-semibold leading-snug text-[#19191d] lg:text-[26px]"
                            moreClassName="text-sm font-semibold text-lightRed"
                            as="div"
                        />
                        {productDetails.vendorName && (
                            <Flex align="center" gap={10} wrap="wrap">
                                <Text className="text-base text-[#868686]">
                                    Sold by{' '}
                                    <span className="text-black">
                                        {productDetails.vendorName.trim()}
                                    </span>
                                </Text>
                            </Flex>
                        )}
                    </Flex>
                    {desc && (
                        <Text className="text-base leading-[1.6] tracking-[0.2px] text-[#19191d]">
                            {shownDesc}
                            {isLong && (
                                <>
                                    {' '}
                                    <button
                                        type="button"
                                        onClick={() => setShowFull(v => !v)}
                                        className="text-base font-semibold leading-[1.6] text-lightRed"
                                    >
                                        {showFull ? 'Read less' : 'Read more'}
                                    </button>
                                </>
                            )}
                        </Text>
                    )}
                    <KeyAttributes product={productDetails} />
                </Flex>
            </div>

            {/* Buy box: sticky 450px right column on xl+; slots after gallery/info below */}
            <div className="min-w-0 xl:col-start-2 xl:row-span-2 xl:row-start-1">
                <div className="xl:sticky xl:top-4">
                    <ProductBuyBox product={productDetails} />
                </div>
            </div>

            {/* Lower sections (bottom-left cell on xl) */}
            <Flex vertical gap={20} className="min-w-0">
                {/* About product — always shows the raw ONDC description, even when the
                    top-of-page paragraph is suppressed for duplicating the title */}
                {rawDesc && (
                    <>
                        <Hairline />
                        <Flex vertical gap={12}>
                            <SectionHeading>About product</SectionHeading>
                            <Text className="text-sm leading-[1.5] tracking-[0.2px] text-[#696969]">
                                {rawDesc}
                            </Text>
                        </Flex>
                    </>
                )}

                {/* Product details */}
                {detailRows.length > 0 && (
                    <>
                        <Hairline />
                        <Flex vertical gap={12}>
                            <SectionHeading>Product details</SectionHeading>
                            <div className="flex flex-col gap-3 md:flex-row md:gap-6">
                                <DetailsColumn rows={detailsLeft} />
                                {detailsRight.length > 0 && <DetailsColumn rows={detailsRight} />}
                            </div>
                        </Flex>
                    </>
                )}

                {/* Returns & support — only when the seller provided policy data */}
                {supportLines.length > 0 && (
                    <>
                        <Hairline />
                        <Flex vertical gap={12}>
                            <SectionHeading>Returns & support</SectionHeading>
                            <Flex vertical gap={4}>
                                {supportLines.map(line => (
                                    <Text
                                        key={line}
                                        className="text-sm leading-[1.5] tracking-[0.2px] text-[#696969]"
                                    >
                                        {line}
                                    </Text>
                                ))}
                            </Flex>
                        </Flex>
                    </>
                )}

                {/* Similar products */}
                <Hairline />
                <SimilarProducts product={productDetails} />
            </Flex>
        </div>
    );
};

export default ProductDetails;
