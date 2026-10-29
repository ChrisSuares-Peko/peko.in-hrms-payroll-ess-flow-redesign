import { useState, type FC } from 'react';

import { Flex, Image, Skeleton, Typography } from 'antd';

import { OfficeCategory } from '../../utils/officeSupplyCategories';

interface CategoryBarProps {
    categories: OfficeCategory[];
    isLoading?: boolean;
    /** currently selected category key */
    selected: string;
    onSelect: (category: OfficeCategory) => void;
}

/**
 * Horizontal row of category circles (Figma-matched). "All Product" is the
 * default; picking a category shows all of its products. There is deliberately
 * no subcategory flyout — a category's subcategories still drive its product
 * filter (see officeSupplyCategories.ts), they just aren't offered as choices.
 */
const categoryBarScrollClass =
    // Scrollbar hidden only from sm up: on a phone this strip scrolls
    // horizontally (8 chips ~768px) and hiding every affordance left no
    // signal that more categories exist off-screen.
    'mt-4 w-full overflow-x-auto py-2 sm:[scrollbar-width:none] sm:[&::-webkit-scrollbar]:hidden';

const categoryRowClass = 'mx-auto w-max min-w-full flex-nowrap';

const CategoryBar: FC<CategoryBarProps> = ({
    categories,
    isLoading = false,
    selected,
    onSelect,
}) => {
    // Hover preview uses the same orange chip as the selection. The selected
    // category keeps that treatment while another chip is hovered — otherwise
    // "All Product" (or any selected chip) flashes back to grey/black.
    const [hoveredKey, setHoveredKey] = useState<string | null>(null);

    if (isLoading) {
        return (
            <div
                className={categoryBarScrollClass}
            >
                <Flex align="start" gap={20} justify="center" className={categoryRowClass}>
                    {Array.from({ length: 8 }).map((_, index) => (
                        <Flex
                            key={index}
                            vertical
                            align="center"
                            gap={6}
                            className="min-w-[76px] shrink-0"
                        >
                            <Skeleton.Avatar active size={64} shape="circle" className="!flex !shrink-0" />
                            <div className="h-3 w-14 shrink-0 rounded bg-[#f0f0f0]" />
                        </Flex>
                    ))}
                </Flex>
            </div>
        );
    }

    return (
        <div
            className={categoryBarScrollClass}
        >
            <Flex align="start" gap={20} justify="center" className={categoryRowClass}>
                {categories.map(cat => {
                    const active = selected === cat.key;
                    const isAll = cat.key === 'all';
                    const isHovered = hoveredKey === cat.key;
                    const emphasized = isHovered || active;

                    let labelClass = 'text-[#5b5b5b]';
                    if (emphasized) {
                        labelClass =
                            'text-bgOrange underline decoration-2 underline-offset-4 decoration-bgOrange';
                    } else if (isAll) {
                        labelClass = 'text-black';
                    }

                    return (
                        <Flex
                            key={cat.key}
                            vertical
                            align="center"
                            gap={6}
                            className="group min-w-[76px] shrink-0 cursor-pointer"
                            onClick={() => onSelect(cat)}
                            onMouseEnter={() => setHoveredKey(cat.key)}
                            onMouseLeave={() => setHoveredKey(null)}
                        >
                            <Flex
                                align="center"
                                justify="center"
                                className={`h-16 w-16 overflow-hidden rounded-full border transition-transform duration-200 group-hover:scale-105 ${
                                    emphasized ? 'border-bgOrange' : 'border-[#e2e2e2]'
                                }`}
                            >
                                <Image
                                    src={cat.image}
                                    alt={cat.label}
                                    preview={false}
                                    className={
                                        isAll ? '!h-7 !w-7 object-contain' : '!h-10 object-cover'
                                    }
                                />
                            </Flex>
                            <Typography.Text
                                className={`whitespace-nowrap text-center text-xs leading-tight ${labelClass}`}
                            >
                                {cat.label}
                            </Typography.Text>
                        </Flex>
                    );
                })}
            </Flex>
        </div>
    );
};

export default CategoryBar;
