import React, { useEffect, useRef, useState } from 'react';

import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { Button, Checkbox, Flex, Pagination, Tag, Typography } from 'antd';

import DomainResultRow from './DomainResultRow';
import { DomainResult } from '../../types/index';

const { Title, Text } = Typography;

interface Props {
    exactMatch: DomainResult | null;
    isDomainAvailable: boolean;
    suggestions: DomainResult[];
    otherDomains: DomainResult[];
    popularTlds: string[];
    selectedDomains: Set<string>;
    isProceedLoading: boolean;
    addingId: string | null;
    updatingId: string | null;
    checkDomainInCart: (classkey: string, domainName: string) => boolean;
    onAdd: (domain: DomainResult) => void;
    onRemove: (domain: DomainResult) => void;
    onToggleSelect: (classkey: string) => void;
    onProceedToCart: () => void;
    onAddSelectedToCart: () => void;
    addingSelected: boolean;
    cartItemCount: number;
}

const DomainSearchResults: React.FC<Props> = ({
    exactMatch,
    isDomainAvailable,
    suggestions,
    otherDomains,
    popularTlds,
    selectedDomains,
    isProceedLoading,
    addingId,
    updatingId,
    checkDomainInCart,
    onAdd,
    onRemove,
    onToggleSelect,
    onProceedToCart,
    onAddSelectedToCart,
    addingSelected,
    cartItemCount,
}) => {
    const extractTld = (domain: string) => domain.split('.').slice(1).join('.');
    const popularSet = new Set(popularTlds);
    const selectedCount = selectedDomains.size;

    const popularSuggestions = popularTlds.length > 0
        ? suggestions.filter(d => popularSet.has(extractTld(d.domain)))
        : [];

    const otherSuggestions = [
        ...(popularTlds.length > 0
            ? suggestions.filter(d => !popularSet.has(extractTld(d.domain)))
            : suggestions
        ),
        ...otherDomains,
    ];

    const PAGE_SIZE = 10;
    const [page, setPage] = useState(1);
    const listTopRef = useRef<HTMLDivElement>(null);

    const popularCount = popularSuggestions.length;
    const allResults = [...popularSuggestions, ...otherSuggestions];
    const totalResults = allResults.length;

    // Reset to the first page whenever a new search loads a fresh result set.
    useEffect(() => {
        setPage(1);
    }, [suggestions, otherDomains]);

    const startIdx = (page - 1) * PAGE_SIZE;
    const pageItems = allResults.slice(startIdx, startIdx + PAGE_SIZE);
    // Popular suggestions are ordered first in allResults, so a global index below
    // popularCount marks a popular item on the current page.
    const pagePopular = pageItems.filter((_, i) => startIdx + i < popularCount);
    const pageOther = pageItems.filter((_, i) => startIdx + i >= popularCount);

    const showPopularSection = popularTlds.length > 0 && pagePopular.length > 0;
    const showOtherSection = pageOther.length > 0;

    const handlePageChange = (p: number) => {
        setPage(p);
        listTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const proceedButton = (
        <Button
            size="large"
            className="bg-lightRed border-lightRed text-white"
            loading={isProceedLoading}
            style={{ height: 52, paddingInline: 28 }}
            onClick={onProceedToCart}
        >
            Proceed to Cart
        </Button>
    );

    // Shown at the top only when multiple domains are selected — bulk-adds them and stays on the page.
    const addToCartButton = (
        <Button
            size="large"
            className="border-lightRed text-lightRed"
            loading={addingSelected}
            style={{ height: 52, paddingInline: 28 }}
            onClick={onAddSelectedToCart}
        >
            Add to Cart ({selectedCount})
        </Button>
    );

    const renderRow = (domain: DomainResult) => (
        <DomainResultRow
            key={domain.domain}
            domain={domain}
            inCart={checkDomainInCart(domain.classkey, domain.domain)}
            isSelected={selectedDomains.has(domain.domain)}
            addingId={addingId}
            updatingId={updatingId}
            onAdd={onAdd}
            onRemove={onRemove}
            onToggleSelect={onToggleSelect}
        />
    );

    return (
        <>
            {exactMatch && (
                isDomainAvailable ? (() => {
                    const isSelected = selectedDomains.has(exactMatch.domain);
                    const inCart = checkDomainInCart(exactMatch.classkey, exactMatch.domain);
                    const isLoading =
                        addingId === exactMatch.classkey || updatingId === exactMatch.classkey;
                    return (
                        <div
                            className={`mb-4 rounded-[20px] py-4 px-6 border ${
                                isSelected
                                    ? 'border-green-400 bg-green-50'
                                    : 'border-[0.7px] border-slate-300 bg-[#F8FAFC]'
                            }`}
                        >
                            <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                                <Flex align="center" gap={20}>
                                    <Checkbox
                                        checked={isSelected}
                                        onChange={() => onToggleSelect(exactMatch.domain)}
                                    />
                                    <Flex align="center" gap={12}>
                                        <div className="bg-green-500 rounded-full flex items-center justify-center w-7 h-7 shrink-0">
                                            <CheckOutlined
                                                style={{ color: '#fff', fontSize: 14 }}
                                            />
                                        </div>
                                        <Text className="text-slate-800" style={{ fontSize: 18 }}>
                                            <Text strong style={{ fontSize: 20 }}>
                                                {exactMatch.displayDomain || exactMatch.domain}
                                            </Text>{' '}
                                            is available
                                        </Text>
                                        {exactMatch.isPremium && <Tag color="gold">Premium</Tag>}
                                    </Flex>
                                </Flex>
                                <Flex align="center" gap={24}>
                                    {exactMatch.price != null && (
                                        <Text
                                            strong
                                            style={{ fontSize: 20 }}
                                            className="text-slate-800"
                                        >
                                            ₹ {exactMatch.price.toLocaleString('en-IN')}/Year
                                            {(exactMatch.registrationYears ?? 1) > 1 && (
                                                <Text className="text-slate-500 text-sm font-normal">
                                                    {' '}({exactMatch.registrationYears}-yr min)
                                                </Text>
                                            )}
                                        </Text>
                                    )}
                                    {inCart ? (
                                        <Button
                                            className="w-[120px] h-[45px] border-slate-300 text-slate-500"
                                            loading={isLoading}
                                            onClick={() => onRemove(exactMatch)}
                                        >
                                            Remove
                                        </Button>
                                    ) : (
                                        <Button
                                            className="w-[120px] h-[45px] border-brandColor text-brandColor"
                                            loading={isLoading}
                                            onClick={() => onAdd(exactMatch)}
                                        >
                                            Add to Cart
                                        </Button>
                                    )}
                                </Flex>
                            </Flex>
                        </div>
                    );
                })() : (
                    <div className="mb-4 border border-red-200 bg-red-50 rounded-[20px] py-4 px-6">
                        <Flex align="center" gap={12}>
                            <div className="bg-lightRed rounded-full flex items-center justify-center w-7 h-7 shrink-0">
                                <CloseOutlined style={{ color: '#fff', fontSize: 14 }} />
                            </div>
                            <Text className="text-slate-800" style={{ fontSize: 18 }}>
                                <Text strong style={{ fontSize: 20 }}>
                                    {exactMatch.displayDomain || exactMatch.domain}
                                </Text>{' '}
                                is not available
                            </Text>
                        </Flex>
                    </div>
                )
            )}

            <div ref={listTopRef}>
                {showPopularSection && (
                    <div className="mb-[70px]">
                        <Flex justify="space-between" align="center" className="mb-[30px]">
                            <Title level={4} className="!mb-0 !text-[#101010]">
                                Popular Domain Names
                            </Title>
                            {selectedCount >= 2 && addToCartButton}
                        </Flex>
                        <Flex vertical gap={22}>
                            {pagePopular.map(renderRow)}
                        </Flex>
                    </div>
                )}

                {showOtherSection && (
                    <div className="mb-6">
                        <Flex justify="space-between" align="center" className="mb-[30px]">
                            <Title level={4} className="!mb-0 !text-[#101010]">
                                Other Domain Names
                            </Title>
                            {!showPopularSection && selectedCount >= 2 && addToCartButton}
                        </Flex>
                        <Flex vertical gap={22}>
                            {pageOther.map(renderRow)}
                        </Flex>
                    </div>
                )}

                {totalResults > PAGE_SIZE && (
                    <Flex justify="center" className="mb-6">
                        <Pagination
                            current={page}
                            total={totalResults}
                            pageSize={PAGE_SIZE}
                            showSizeChanger={false}
                            onChange={handlePageChange}
                        />
                    </Flex>
                )}

                {cartItemCount > 0 && (
                    <Flex justify="end" className="mb-6">
                        {proceedButton}
                    </Flex>
                )}
            </div>
        </>
    );
};

export default DomainSearchResults;
