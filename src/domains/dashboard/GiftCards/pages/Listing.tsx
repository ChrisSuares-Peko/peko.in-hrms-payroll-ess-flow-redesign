import { useEffect, useMemo, useRef, useState } from 'react';

import { Col, Row, Pagination, Skeleton, Grid, PaginationProps, Empty } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { debounce } from 'lodash';
import { useLocation, useNavigate } from 'react-router-dom';

import MoreTransactions from '@assets/svg/card.svg';
import Header from '@domains/dashboard/GiftCards/components/Header';

import CategoryFilter from '../components/CategoryFilter';
import GiftCard from '../components/GiftCard';
import GiftCardSmall from '../components/GiftCardSmall';
import TagElement from '../components/TagElement';
import useGiftCardApi from '../hooks/useGiftcardApi';
import { giftCardCategories } from '../utils/data';

const { useBreakpoint } = Grid;

const getQueryParam = (queryParams: URLSearchParams, param: string, defaultValue: number) => {
    const value = queryParams.get(param);
    return value ? parseInt(value, 10) : defaultValue;
};

const Listing = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
    const [searchText, setSearchText] = useState<string>('');
    const [debouncedSearchText, setDebouncedSearchText] = useState<string>(searchText);
    const [currentPage, setCurrentPage] = useState<number>(getQueryParam(queryParams, 'page', 1));
    const [limit, setLimit] = useState<number>(getQueryParam(queryParams, 'limit', 20));
    const offset = (currentPage - 1) * limit;
    const [category, setCategory] = useState('all');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const hasLoadedOnce = useRef(false);
    const [animateCards, setAnimateCards] = useState(true);

    const debounceSearch = debounce((searchQuery: string) => {
        setDebouncedSearchText(searchQuery);
    }, 500);

    useEffect(() => {
        debounceSearch(searchText);
        return () => {
            debounceSearch.cancel();
        };
    }, [searchText, debounceSearch]);

    useEffect(() => {
        const valuePage = getQueryParam(queryParams, 'page', 1);
        const valueLimit = getQueryParam(queryParams, 'limit', 24);
        setCurrentPage(valuePage);
        setLimit(valueLimit);
    }, [queryParams]);

    const handleSelectedCategoryChange = (cat: string) => {
        setAnimateCards(false);
        setSelectedCategory(cat);
        setCurrentPage(1);
        navigate(`?page=1&limit=${limit}`);
    };

    const selectedCategoryLabel =
        giftCardCategories.find(c => c.key === selectedCategory)?.label ?? 'all';

    const { data, isLoading, count } = useGiftCardApi(
        debouncedSearchText,
        currentPage,
        limit,
        category,
        offset,
        selectedCategoryLabel
    );

    // Holds the last successfully loaded data — keeps current page visible during pagination fetch
    const [displayedData, setDisplayedData] = useState(data);
    const [displayedCount, setDisplayedCount] = useState(count);

    useEffect(() => {
        if (!isLoading) {
            hasLoadedOnce.current = true;
            setDisplayedData(data);
            setDisplayedCount(count);
        }
    }, [isLoading, data, count]);

    const screens = useBreakpoint();

    const handlePageChange: PaginationProps['onChange'] = (page, length) => {
        setAnimateCards(false);
        setLimit(length);
        if (limit !== length) {
            setCurrentPage(1);
            navigate(`?page=1&limit=${length}`);
            return;
        }
        setCurrentPage(page);
        navigate(`?page=${page}&limit=${length}`);
    };

    const handleCategoryChange = (sortOrder: string) => {
        setAnimateCards(false);
        setCategory(sortOrder);
        navigate(`?page=${1}&limit=${limit}`);
    };

    const gutterSize: [number, number] = screens.sm ? [40, 35] : [25, 0];

    // Show skeleton only on the very first load (no data has ever been displayed)
    const isInitialLoad = !hasLoadedOnce.current;

    let cardsToDisplay;
    if (isInitialLoad) {
        cardsToDisplay = Array.from({ length: limit }).map((_, index) => (
            <Col xs={24} sm={12} md={8} xl={6} key={index}>
                <Skeleton paragraph={{ rows: 3 }} />
            </Col>
        ));
    } else if (displayedData.length === 0) {
        cardsToDisplay = (
            <Empty
                className="flex items-center justify-center min-h-[50vh]"
                image={MoreTransactions}
                description="No Gift Card Found"
            />
        );
    } else {
        cardsToDisplay = displayedData.map((item, i) => (
            <Col xs={12} sm={12} md={8} xl={6} key={i}>
                {screens.xs ? (
                    <GiftCardSmall
                        key={i}
                        image={item.image}
                        id={item.id}
                        name={item.name}
                        description={item.description}
                    />
                ) : (
                    <GiftCard
                        key={i}
                        image={item.image}
                        id={item.id}
                        name={item.name}
                        description={item.description}
                        usageType={item.usageType}
                        loaded={!isLoading}
                        animate={animateCards}
                    />
                )}
            </Col>
        ));
    }

    return (
        <Content className="">
            <Header
                searchText={searchText}
                setSearchText={setSearchText}
                category={category}
                setCategory={handleCategoryChange}
            />
            <CategoryFilter
                selectedCategory={selectedCategory}
                onCategoryChange={handleSelectedCategoryChange}
            />
            <TagElement
                count={displayedCount}
                category={category}
                setCategory={handleCategoryChange}
                searchText={searchText}
                setSearchText={setSearchText}
                setCurrentPage={setCurrentPage}
                selectedCategory={selectedCategory}
            />
            <Row
                gutter={gutterSize}
                className="h-full mt-6 "
                justify={displayedData && displayedData.length > 0 ? 'start' : 'center'}
                align="middle"
            >
                {cardsToDisplay}
            </Row>

            {displayedData.length > 0 && (
                <Pagination
                    className="mt-10 md:text-end xs:text-center"
                    size="small"
                    total={displayedCount}
                    current={currentPage}
                    onChange={handlePageChange}
                    disabled={isLoading}
                    defaultPageSize={24}
                    pageSizeOptions={['8', '16', '24', '32']}
                />
            )}
        </Content>
    );
};

export default Listing;
