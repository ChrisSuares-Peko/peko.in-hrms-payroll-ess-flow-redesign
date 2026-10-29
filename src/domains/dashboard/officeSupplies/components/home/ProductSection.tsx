import { useCallback, useEffect, useRef, useState, type FC } from 'react';

import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Flex, Skeleton, Typography } from 'antd';

import ProductCard from './ProductCard';
import chevronRightIcon from '../../assets/icons/chevron-right.svg';
import { ProductCardProps } from '../../types/products';

interface ProductSectionProps {
    title: string;
    subtitle?: string;
    products: ProductCardProps[];
    isLoading: boolean;
    /**
     * Figma-matched scroll affordance: the overflowing edge fades into the page
     * background under a small grey circular chevron, instead of the plain arrow
     * sitting on top of the edge card. Opt-in — only Top Deals uses it.
     */
    fadeEdges?: boolean;
}

/**
 * Each card is one All-Products column (2 / 3 / 5 per row). Cards must not
 * grow, and the track must pack from the start — otherwise 2–4 items in a
 * 5-up row leave a hole between the first and last card.
 */
const CARD_W =
    'box-border w-1/2 max-w-[50%] shrink-0 grow-0 basis-1/2 overflow-visible lg:w-1/3 lg:max-w-[33.333%] lg:basis-1/3 xl:w-1/5 xl:max-w-[20%] xl:basis-1/5';
// Both edge fades render together whenever the track is mid-scroll, so this width
// is doubled in practice. At the old 54% that was 108% of the carousel — on a phone
// (2 cards in view) both visible products washed out to white.
const FADE_W = 'w-[22%] lg:w-[36%] xl:w-[22%]';
const FADE_BTN =
    'pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.06]';
/** Ignore sub-pixel / padding noise so arrows do not appear on a non-overflowing row. */
const SCROLL_EPS = 8;

/**
 * A titled horizontal carousel of products (reuses ProductCard in `bare` mode).
 * Renders nothing once loaded with no products, so empty/stubbed sections
 * (Top Rated, Frequently Bought) stay hidden until they have data.
 */
const ProductSection: FC<ProductSectionProps> = ({
    title,
    subtitle,
    products,
    isLoading,
    fadeEdges = false,
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const updateArrows = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        const maxScroll = el.scrollWidth - el.clientWidth;
        setCanScrollLeft(el.scrollLeft > SCROLL_EPS);
        setCanScrollRight(maxScroll - el.scrollLeft > SCROLL_EPS);
    }, []);

    // Measure after paint and keep in sync with scrolling *and* resizing — the
    // edge fades must appear/disappear as the viewport (or sidebar) changes.
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return undefined;

        requestAnimationFrame(updateArrows);
        el.addEventListener('scroll', updateArrows);

        const resizeObserver = new ResizeObserver(updateArrows);
        resizeObserver.observe(el);

        return () => {
            el.removeEventListener('scroll', updateArrows);
            resizeObserver.disconnect();
        };
    }, [updateArrows, products, isLoading]);

    const scrollBy = (direction: -1 | 1) => {
        const el = scrollRef.current;
        if (!el) return;
        // Advance exactly one card. Measure the real card instead of assuming 5 in
        // view (CARD_W is 2-up below lg, 3-up at lg, 5-up at xl) — at /5 a phone tap
        // moved 40% of a card and parked the track mid-card.
        const card = el.firstElementChild as HTMLElement | null;
        const amount = card?.offsetWidth || el.clientWidth / 5;
        el.scrollBy({ left: direction * amount, behavior: 'smooth' });
    };

    if (!isLoading && products.length === 0) return null;

    /**
     * Scroll affordance for one edge. `fadeEdges` renders the Figma treatment (a
     * gradient fading the edge card into the page background, with a grey 32px
     * chevron button centred on the full card); otherwise the original white
     * pill arrow.
     */
    const renderEdge = (side: 'left' | 'right') => {
        const isLeft = side === 'left';
        if (!(isLeft ? canScrollLeft : canScrollRight)) return null;
        const onClick = () => scrollBy(isLeft ? -1 : 1);

        if (!fadeEdges) {
            const Arrow = isLeft ? LeftOutlined : RightOutlined;
            return (
                <Arrow
                    className={`absolute ${
                        isLeft ? 'left-0' : 'right-0'
                    } top-1/2 z-10 -translate-y-1/2 cursor-pointer rounded-full bg-white/90 px-1 py-2 shadow-sm`}
                    onClick={onClick}
                />
            );
        }

        return (
            <div
                className={`pointer-events-none absolute inset-y-0 z-10 flex items-center from-transparent to-white ${FADE_W} ${
                    isLeft ? 'left-0 justify-start bg-gradient-to-l' : 'right-0 justify-end bg-gradient-to-r'
                }`}
            >
                <button
                    type="button"
                    aria-label={isLeft ? 'Scroll left' : 'Scroll right'}
                    className={FADE_BTN}
                    onClick={onClick}
                >
                    <img
                        src={chevronRightIcon}
                        alt=""
                        className={`h-[14px] w-[14px] ${isLeft ? 'rotate-180' : ''}`}
                    />
                </button>
            </div>
        );
    };

    return (
        <Flex vertical className="mb-8 w-full mt-8">
            <Flex vertical className="mb-4">
                <Typography.Text className="text-lg font-medium text-[#19191d]">
                    {title}
                </Typography.Text>
                {subtitle && (
                    <Typography.Text className="mt-0.5 text-[13px] text-[#868686]">
                        {subtitle}
                    </Typography.Text>
                )}
            </Flex>

            {isLoading ? (
                <div className="flex w-full min-w-0 flex-nowrap justify-start overflow-visible">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton.Node key={i} active className={`!h-64 ${CARD_W}`}>
                            <span />
                        </Skeleton.Node>
                    ))}
                </div>
            ) : (
                <div className="relative w-full min-w-0 overflow-visible">
                    {renderEdge('left')}

                    <div
                        ref={scrollRef}
                        className="hide-scrollbar flex w-full min-w-0 flex-nowrap items-stretch justify-start gap-0 overflow-x-auto overflow-y-visible scroll-smooth py-1"
                    >
                        {products.map(product => (
                            <div key={product.id} className={CARD_W}>
                                <ProductCard bare {...product} />
                            </div>
                        ))}
                    </div>

                    {renderEdge('right')}
                </div>
            )}
        </Flex>
    );
};

export default ProductSection;
