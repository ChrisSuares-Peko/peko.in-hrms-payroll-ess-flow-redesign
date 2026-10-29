import { useCallback, useEffect, useRef, useState, type FC } from 'react';

import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Flex } from 'antd';

import ProductImageViewer from './ProductImageViewer';
import { ProductImage as ProductImageType } from '../../types/productDetails';
import ProductImageView from '../common/ProductImageView';

interface ProductGalleryProps {
    images: ProductImageType[];
    name?: string;
}

/**
 * Product image gallery: large image + thumbnail strip with left/right scroll
 * navigation. Clicking the large image opens it enlarged (ProductImageViewer),
 * which shares this index — picking a thumbnail there moves this gallery too.
 */
const ProductGallery: FC<ProductGalleryProps> = ({ images, name }) => {
    const [index, setIndex] = useState(0);
    const [viewerOpen, setViewerOpen] = useState(false);
    const thumbnailsRef = useRef<HTMLDivElement>(null);
    const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);

    const [canScrollThumbLeft, setCanScrollThumbLeft] = useState(false);
    const [canScrollThumbRight, setCanScrollThumbRight] = useState(false);
    const [hasThumbOverflow, setHasThumbOverflow] = useState(false);

    // Reset index whenever the product/image set changes
    useEffect(() => {
        setIndex(0);
    }, [images]);

    const updateThumbScrollState = useCallback(() => {
        const el = thumbnailsRef.current;
        if (!el) return;
        const maxScroll = el.scrollWidth - el.clientWidth;
        setHasThumbOverflow(maxScroll > 1);
        setCanScrollThumbLeft(el.scrollLeft > 4);
        setCanScrollThumbRight(maxScroll - el.scrollLeft > 4);
    }, []);

    useEffect(() => {
        const el = thumbnailsRef.current;
        if (!el) return undefined;

        requestAnimationFrame(updateThumbScrollState);
        el.addEventListener('scroll', updateThumbScrollState);

        const resizeObserver = new ResizeObserver(updateThumbScrollState);
        resizeObserver.observe(el);

        return () => {
            el.removeEventListener('scroll', updateThumbScrollState);
            resizeObserver.disconnect();
        };
    }, [updateThumbScrollState, images]);

    // Keep active thumbnail scrolled into view
    useEffect(() => {
        thumbnailRefs.current[index]?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center',
        });
    }, [index]);

    const handlePrev = () => {
        setIndex(prev => Math.max(0, prev - 1));
    };

    const handleNext = () => {
        setIndex(prev => Math.min((images?.length || 1) - 1, prev + 1));
    };

    const scrollThumbnails = (direction: -1 | 1) => {
        const el = thumbnailsRef.current;
        if (!el) return;
        el.scrollBy({ left: direction * 140, behavior: 'smooth' });
    };

    const main = images?.[index]?.productImageUrl || images?.[0]?.productImageUrl || '';
    const hasMultiple = images && images.length > 1;

    return (
        <Flex vertical gap={12} className="w-full max-w-[380px]">
            {/* Main Preview Image Container */}
            <div className="relative flex aspect-square max-h-[300px] w-full items-center justify-center overflow-hidden rounded-3xl bg-[#f7f7f7]">
                {/* The whole panel opens the enlarged viewer; the prev/next arrows below
                    are sibling buttons, so they never open it. */}
                <button
                    type="button"
                    aria-label="View larger image"
                    onClick={() => setViewerOpen(true)}
                    disabled={!main}
                    className="flex h-full w-full cursor-zoom-in items-center justify-center disabled:cursor-default"
                >
                    <ProductImageView
                        src={main}
                        alt={name}
                        className="max-h-[87%] max-w-[96%] object-contain mix-blend-multiply"
                        placeholderClassName="h-[35%] w-[35%] opacity-40"
                    />
                </button>

                {hasMultiple && (
                    <>
                        <button
                            type="button"
                            aria-label="Previous image"
                            onClick={handlePrev}
                            disabled={index === 0}
                            className="absolute left-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-md transition hover:bg-white hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-0"
                        >
                            <LeftOutlined className="text-xs" />
                        </button>
                        <button
                            type="button"
                            aria-label="Next image"
                            onClick={handleNext}
                            disabled={index === images.length - 1}
                            className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-md transition hover:bg-white hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-0"
                        >
                            <RightOutlined className="text-xs" />
                        </button>
                    </>
                )}
            </div>

            {/* Thumbnails Row with Navigation */}
            {hasMultiple && (
                <div className="relative flex w-full items-center gap-1.5">
                    {hasThumbOverflow && (
                        <button
                            type="button"
                            aria-label="Scroll thumbnails left"
                            disabled={!canScrollThumbLeft}
                            onClick={() => scrollThumbnails(-1)}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#ededed] bg-white text-gray-600 shadow-sm transition hover:bg-[#f7f7f7] active:scale-95 disabled:cursor-not-allowed disabled:opacity-25"
                        >
                            <LeftOutlined className="text-xs" />
                        </button>
                    )}
                    <div
                        ref={thumbnailsRef}
                        className="hide-scrollbar flex-1 overflow-x-auto scroll-smooth"
                    >
                        <div className="mx-auto flex w-max gap-3 py-1">
                            {images.map((img, i) => (
                                <button
                                    key={img.id ?? i}
                                    ref={el => {
                                        thumbnailRefs.current[i] = el;
                                    }}
                                    type="button"
                                    onClick={() => setIndex(i)}
                                    className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-[#f7f7f7] transition-colors ${
                                        i === index ? 'border-lightRed' : 'border-[#ededed]'
                                    }`}
                                >
                                    <ProductImageView
                                        src={img.productImageUrl}
                                        alt={`${name}-${i}`}
                                        className="max-h-[80%] max-w-[80%] object-contain mix-blend-multiply"
                                        placeholderClassName="h-[45%] w-[45%] opacity-40"
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                    {hasThumbOverflow && (
                        <button
                            type="button"
                            aria-label="Scroll thumbnails right"
                            disabled={!canScrollThumbRight}
                            onClick={() => scrollThumbnails(1)}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#ededed] bg-white text-gray-600 shadow-sm transition hover:bg-[#f7f7f7] active:scale-95 disabled:cursor-not-allowed disabled:opacity-25"
                        >
                            <RightOutlined className="text-xs" />
                        </button>
                    )}
                </div>
            )}

            <ProductImageViewer
                open={viewerOpen}
                images={images || []}
                index={index}
                onIndexChange={setIndex}
                onClose={() => setViewerOpen(false)}
                name={name}
            />
        </Flex>
    );
};

export default ProductGallery;
