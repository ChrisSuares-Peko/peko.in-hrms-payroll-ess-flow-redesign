import type { FC } from 'react';

import { InfoCircleOutlined, RightOutlined } from '@ant-design/icons';
import { Button } from 'antd';

import { plural } from './ruleUtils';

interface Props {
    waitingProducts: number;
    sellerCategories: number;
    excludedProducts: number;
    onOpenReview: () => void;
}

const UnmappedCategoriesBanner: FC<Props> = ({
    waitingProducts,
    sellerCategories,
    excludedProducts,
    onOpenReview,
}) => {
    if (!waitingProducts && !excludedProducts) return null;
    return (
        <section className="flex flex-col gap-3 rounded-xl border border-dashed border-[#D0D5DD] bg-[#F9FAFB] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
                <InfoCircleOutlined className="mt-0.5 text-[14px] text-[#475467]" />
                <div className="flex flex-col gap-0.5">
                    <span className="text-[13px] font-semibold text-[#101828]">
                        {waitingProducts
                            ? `${plural(waitingProducts, 'product')} ${waitingProducts === 1 ? 'is' : 'are'} waiting on ${plural(
                                  sellerCategories,
                                  'seller category',
                                  'seller categories'
                              )} that ${sellerCategories === 1 ? 'is' : 'are'} not mapped yet`
                            : `${plural(excludedProducts, 'product')} hidden by an excluded seller category`}
                    </span>
                    <span className="text-[12px] text-[#667085]">
                        {waitingProducts > 0 &&
                            'They stay hidden until their seller category is mapped to a Peko category or excluded on the Review tab. This is not a setting you can relax here. '}
                        {excludedProducts > 0 &&
                            `${plural(excludedProducts, 'product')} ${
                                excludedProducts === 1 ? 'is' : 'are'
                            } hidden because their seller category was excluded from the listing.`}
                    </span>
                </div>
            </div>
            <Button size="small" className="shrink-0" onClick={onOpenReview}>
                Open Review <RightOutlined className="text-[10px]" />
            </Button>
        </section>
    );
};

export default UnmappedCategoriesBanner;
