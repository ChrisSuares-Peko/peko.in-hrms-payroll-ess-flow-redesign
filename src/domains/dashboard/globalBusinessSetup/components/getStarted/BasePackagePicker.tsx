import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';

import BasePackageCard from './BasePackageCard';
import { PricingType } from '../../types/pricing';

interface BasePackagePickerProps {
    pricings: PricingType[];
    selectedIdx: number;
    onSelect: (idx: number) => void;
}

const ARROW_SIZE = 36;

const arrowBtnStyle: React.CSSProperties = {
    width: ARROW_SIZE,
    height: ARROW_SIZE,
    borderRadius: '50%',
    border: '1px solid #E5E7EB',
    background: '#fff',
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#6B7280',
    padding: 0,
    flexShrink: 0,
};

const BasePackagePicker: React.FC<BasePackagePickerProps> = ({
    pricings,
    selectedIdx,
    onSelect,
}) => {
    const scrollerRef = useRef<HTMLDivElement | null>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [cardsPerView, setCardsPerView] = useState(3);

    const updateScrollState = () => {
        const el = scrollerRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 4);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };

    const recomputeCardsPerView = () => {
        const el = scrollerRef.current;
        if (!el) return;
        const w = el.clientWidth;
        if (w < 560) setCardsPerView(1);
        else if (w < 880) setCardsPerView(2);
        else setCardsPerView(3);
    };

    useLayoutEffect(() => {
        updateScrollState();
        recomputeCardsPerView();
    }, [pricings.length]);

    useEffect(() => {
        const el = scrollerRef.current;
        if (!el) return;
        const onResize = () => {
            updateScrollState();
            recomputeCardsPerView();
        };
        el.addEventListener('scroll', updateScrollState, { passive: true });
        window.addEventListener('resize', onResize);
        // eslint-disable-next-line consistent-return
        return () => {
            el.removeEventListener('scroll', updateScrollState);
            window.removeEventListener('resize', onResize);
        };
    }, []);

    if (pricings.length === 0) return null;

    const scrollBy = (direction: 1 | -1) => {
        const el = scrollerRef.current;
        if (!el) return;
        const firstCard = el.querySelector<HTMLElement>('[data-package-card]');
        if (!firstCard) return;
        const gap = parseFloat(getComputedStyle(el).columnGap || '16') || 16;
        const cardWidth = firstCard.offsetWidth + gap;
        el.scrollBy({ left: direction * cardWidth, behavior: 'smooth' });
    };

    const arrowSlot = (
        side: 'left' | 'right',
        visible: boolean,
        icon: React.ReactNode,
        onClick: () => void
    ) => (
        <div
            style={{
                width: ARROW_SIZE,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            {visible && (
                <button
                    type="button"
                    aria-label={side === 'left' ? 'Scroll previous' : 'Scroll next'}
                    style={arrowBtnStyle}
                    onClick={onClick}
                >
                    {icon}
                </button>
            )}
        </div>
    );

    return (
        <Flex vertical gap={16}>
            <Typography.Text className="text-lg font-semibold text-neutral-900">
                Select Base Package
            </Typography.Text>
            <Flex align="stretch" gap={12}>
                {arrowSlot('left', canScrollLeft, <LeftOutlined style={{ fontSize: 14 }} />, () =>
                    scrollBy(-1)
                )}
                <div
                    ref={scrollerRef}
                    className="hide-scrollbar"
                    style={{
                        display: 'flex',
                        gap: 16,
                        overflowX: 'auto',
                        scrollSnapType: 'x mandatory',
                        scrollPaddingInline: 4,
                        scrollbarWidth: 'none',
                        flex: 1,
                        padding: '4px 4px 8px',
                        minWidth: 0,
                    }}
                >
                    {pricings.map((p, idx) => (
                        <div
                            key={p._id}
                            data-package-card
                            style={{
                                flex: `0 0 calc((100% - ${(cardsPerView - 1) * 16}px) / ${cardsPerView})`,
                                scrollSnapAlign: 'start',
                                scrollSnapStop: 'always',
                                display: 'flex',
                            }}
                        >
                            <BasePackageCard
                                pricing={p}
                                selected={idx === selectedIdx}
                                onSelect={() => onSelect(idx)}
                            />
                        </div>
                    ))}
                </div>
                {arrowSlot(
                    'right',
                    canScrollRight,
                    <RightOutlined style={{ fontSize: 14 }} />,
                    () => scrollBy(1)
                )}
            </Flex>
        </Flex>
    );
};

export default BasePackagePicker;
