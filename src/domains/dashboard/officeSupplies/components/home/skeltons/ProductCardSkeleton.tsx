import type { FC } from 'react';

import { Flex } from 'antd';

type ProductCardSkeletonProps = {
    /** Carousel cards match All Products column widths; grid cards fill the column. */
    bare?: boolean;
};

/** Placeholder matching ProductCard image panel + text lines. */
const ProductCardSkeleton: FC<ProductCardSkeletonProps> = ({ bare = false }) => (
    <Flex
        align="center"
        vertical
        gap={10}
        className={`animate-pulse ${
            bare
                ? 'w-1/2 shrink-0 p-3 lg:w-1/3 xl:w-1/5'
                : 'w-full rounded-2xl bg-white p-3 md:w-10/12'
        }`}
    >
        <div className="aspect-[49/50] w-full rounded-xl bg-[#f3f4f6]" />
        <Flex vertical gap={6} className="w-full px-1">
            <div className="h-3 w-4/5 rounded bg-[#f3f4f6]" />
            <div className="h-3 w-3/5 rounded bg-[#f3f4f6]" />
            <div className="h-4 w-2/5 rounded bg-[#f3f4f6]" />
            <div className="mt-1 h-9 w-full rounded-lg bg-[#f3f4f6]" />
        </Flex>
    </Flex>
);

export default ProductCardSkeleton;
