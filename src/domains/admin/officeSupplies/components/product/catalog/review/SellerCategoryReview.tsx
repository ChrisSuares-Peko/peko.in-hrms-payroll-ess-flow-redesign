import { useMemo, useState } from 'react';

import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Flex, Result, Skeleton, Typography } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import DecisionCard from './DecisionCard';
import ReviewProductsCard from './ReviewProductsCard';
import {
    DomainPill,
    NewPill,
    NewProductsPill,
    StatusPill,
    productCountsText,
    sourcesText,
} from './reviewUtils';
import useSellerCategoryReview, {
    ProductFilters,
} from '../../../../hooks/products/useSellerCategoryReview';
import { timeAgo } from '../rules/ruleUtils';

export const reviewTabPath = () => `${paths.systemUser.manage}/${paths.manage.productsReview}`;

/**
 * Manage › Products › Review › one seller category: decide where its products
 * go, see what changed, and adjust single products (own Peko category, the
 * Visible on Peko switch).
 */
const SellerCategoryReview = () => {
    const { id } = useParams();
    const sellerCategoryId = Number(id);
    const navigate = useNavigate();
    const [filters, setFilters] = useState<ProductFilters>({
        visibility: 'all',
        searchText: '',
        page: 1,
        itemsPerPage: 20,
    });
    const review = useSellerCategoryReview(sellerCategoryId, filters);
    const { category } = review;
    const backToReview = () => navigate(reviewTabPath());

    const subtitle = useMemo(() => {
        if (!category) return '';
        const sources = sourcesText(category);
        return [
            productCountsText(category),
            sources && `sent by ${sources}`,
            category.firstSeenAt && `first seen ${timeAgo(category.firstSeenAt)}`,
        ]
            .filter(Boolean)
            .join(' · ');
    }, [category]);

    if (review.notFound) {
        return (
            <Result
                status="404"
                title="Seller category not found"
                extra={<Button onClick={backToReview}>Back to Review</Button>}
            />
        );
    }

    return (
        <Flex vertical gap={16}>
            <Button
                type="link"
                className="!px-0 !text-[#475156] w-fit"
                icon={<ArrowLeftOutlined />}
                onClick={backToReview}
            >
                Back to Review
            </Button>

            {!category ? (
                <Skeleton active paragraph={{ rows: 8 }} />
            ) : (
                <>
                    <Flex vertical gap={4}>
                        <Flex align="center" gap={10} wrap="wrap">
                            <Typography.Title
                                level={3}
                                className="!m-0 !text-[22px] !text-[#101828]"
                            >
                                {category.label}
                            </Typography.Title>
                            <DomainPill code={category.ondcDomain} />
                            <StatusPill status={category.status} />
                            {category.isNew && <NewPill />}
                            {category.status === 'mapped' && category.newProductCount > 0 && (
                                <NewProductsPill count={category.newProductCount} />
                            )}
                        </Flex>
                        <span className="text-[12px] text-[#667085]">{subtitle}</span>
                    </Flex>

                    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,8fr)]">
                        <Flex vertical gap={16}>
                            <DecisionCard
                                category={category}
                                tree={review.tree}
                                onSave={review.saveDecision}
                            />
                            <section className="rounded-xl border border-[#EAECF0] bg-white p-5">
                                <Typography.Text className="text-[13px] font-semibold text-[#101828]">
                                    History
                                </Typography.Text>
                                {review.history.length === 0 ? (
                                    <div className="mt-2 text-[12px] text-[#667085]">
                                        No decisions yet.
                                    </div>
                                ) : (
                                    <ol className="m-0 mt-3 flex list-none flex-col gap-3 p-0">
                                        {review.history.map(h => (
                                            <li key={h.id} className="flex flex-col gap-0.5">
                                                <span className="text-[12px] font-medium text-[#101828]">
                                                    {h.action}
                                                </span>
                                                <span className="text-[11px] text-[#98A2B3]">
                                                    {h.actorName || 'Admin'} ·{' '}
                                                    {timeAgo(h.createdAt)}
                                                </span>
                                            </li>
                                        ))}
                                    </ol>
                                )}
                            </section>
                        </Flex>

                        <ReviewProductsCard
                            category={category}
                            tree={review.tree}
                            products={review.products}
                            total={review.productTotal}
                            loading={review.productsLoading}
                            filters={filters}
                            onFiltersChange={patch => setFilters(prev => ({ ...prev, ...patch }))}
                            onVisibility={review.setVisibility}
                            onCategory={review.setProductCategory}
                            onPosition={review.setProductPosition}
                        />
                    </div>
                </>
            )}
        </Flex>
    );
};

export default SellerCategoryReview;
