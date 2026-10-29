import { useEffect, useRef, useState, type FC } from 'react';

import { Flex, Pagination, Row, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

import useScreenSize from '@src/hooks/useScreenSize';

import CategoryBar from './CategoryBar';
import ProductCard from './ProductCard';
import ProductSection from './ProductSection';
import SearchLocationBar from './SearchLocationBar';
import OfficeSuppliesHomeSkeleton from './skeltons/OfficeSuppliesHomeSkeleton';
import ProductsSkelton from './skeltons/ProductsSkelton';
import noProductsSVG from '../../assets/icons/noProducts.svg';
import { useOfficeSupplySections } from '../../hooks/useOfficeSupplySections';
import { useProductsApi } from '../../hooks/useProductsApi';
import { ondcCityCode, SelectedCity } from '../../utils/indianCityStdCodes';
import { OfficeCategory } from '../../utils/officeSupplyCategories';

interface ProductListingProps {
    selectedCity: SelectedCity | null;
    setSelectedCity: (city: SelectedCity | null) => void;
    isLoadingCity?: boolean;
    categories: OfficeCategory[];
    isLoadingCategories?: boolean;
    onSearch: (searchText: string) => void;
    onSelectCategory: (category: OfficeCategory) => void;
}

/**
 * Office supplies "browse home" — search/city bar, category bar, curated
 * carousels (Top Deals / Frequently Ordered), and the All Products grid.
 */
const ProductListing: FC<ProductListingProps> = ({
    selectedCity,
    setSelectedCity,
    isLoadingCity = false,
    categories,
    isLoadingCategories = false,
    onSearch,
    onSelectCategory,
}) => {
    const screen = useScreenSize();
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(20);
    // Sections fetch only after the city catalog has resolved, so Top Deals
    // and All Products paint together instead of the carousel popping in later.
    const [sectionsCity, setSectionsCity] = useState<string | undefined>();

    const catalogCity = ondcCityCode(selectedCity);

    const { data = [], isLoading, isFetchingCity, count, citySearchTick } = useProductsApi(
        catalogCity,
        currentPage,
        pageSize,
        '',
        undefined,
        {}
    );

    useEffect(() => {
        setSectionsCity(undefined);
    }, [catalogCity]);

    useEffect(() => {
        if (catalogCity && !isLoadingCity && !isFetchingCity && !isLoading) {
            setSectionsCity(catalogCity);
        }
    }, [catalogCity, isLoadingCity, isFetchingCity, isLoading]);

    const {
        topDeals,
        frequentlyBought,
        isLoading: isLoadingSections,
        refetch: refetchSections,
    } = useOfficeSupplySections(sectionsCity);

    // Reset page whenever the city changes.
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCity?.code]);

    const seenSearchTick = useRef(0);
    useEffect(() => {
        seenSearchTick.current = 0;
    }, [catalogCity]);
    useEffect(() => {
        if (!sectionsCity || citySearchTick <= seenSearchTick.current) return;
        seenSearchTick.current = citySearchTick;
        refetchSections();
    }, [citySearchTick, refetchSections, sectionsCity]);

    const isPageLoading =
        isLoadingCity ||
        isFetchingCity ||
        isLoadingSections ||
        (!!catalogCity && !sectionsCity) ||
        (!!catalogCity && isLoadingCategories && isLoading && !sectionsCity);

    const showSections = !!catalogCity && !isPageLoading;
    const showSkeleton = !!catalogCity && (isLoading || isFetchingCity);
    const showEmpty = showSections && !showSkeleton && data.length === 0;

    const handleScroll = () => {
        const productsContainer = document.getElementById('myContainer');
        if (productsContainer) {
            productsContainer.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <Flex className="mx-0 mt-6" vertical gap={4}>
            <SearchLocationBar
                selectedCity={selectedCity}
                onSelectCity={setSelectedCity}
                isLoadingCity={isLoadingCity}
                searchText=""
                setSearchText={onSearch}
            />

            {!!catalogCity && (
                <CategoryBar
                    categories={categories}
                    isLoading={isLoadingCategories}
                    selected="all"
                    onSelect={onSelectCategory}
                />
            )}

            {isPageLoading && !!catalogCity && <OfficeSuppliesHomeSkeleton />}

            {!catalogCity && !isPageLoading && (
                <Flex vertical gap={20} className="h-96 w-full" justify="center" align="center">
                    <ReactSVG width={120} src={noProductsSVG} />
                    <Typography.Text className="text-center text-base text-gray-400">
                        {selectedCity ? 'No products found' : 'Select a city to view products'}
                    </Typography.Text>
                </Flex>
            )}

            {/* Curated carousels and All Products landing grid */}
            {showSections && (
                <Flex vertical className="w-full">
                    <ProductSection
                        fadeEdges
                        title="Top deals for your location"
                        subtitle="Lowest prices from sellers delivering near you"
                        products={topDeals}
                        isLoading={false}
                    />
                    <ProductSection
                        title="Frequently ordered"
                        subtitle="Typical office restocks, ready to add again"
                        products={frequentlyBought}
                        isLoading={false}
                    />

                    <div className="my-8 h-px w-full bg-[#ededed]" />

                    {/* All Products grid — gap-4 (16px) heading→cards; flex-col avoids Row gutter eating gap */}
                    <div className="mt-8 flex w-full flex-col gap-4">
                        <Typography.Text className="block text-lg font-medium text-[#19191d]">
                            All Products
                        </Typography.Text>

                        <Row
                            justify="start"
                            id="products_container"
                            className="!mt-0 overflow-visible"
                            gutter={screen.xs ? [0, 16] : [0, 24]}
                        >
                            <ProductsSkelton loading={showSkeleton} itemCount={12} />

                            {showEmpty && (
                                <Flex
                                    vertical
                                    gap={30}
                                    className="mt-18 h-96 w-full"
                                    justify="center"
                                    align="center"
                                >
                                    <ReactSVG width={120} src={noProductsSVG} />
                                    <Typography.Text className="ms-2 text-center text-base text-gray-300">
                                        No products found
                                    </Typography.Text>
                                </Flex>
                            )}

                            {!showSkeleton &&
                                data?.map(product => <ProductCard key={product.id} {...product} />)}
                        </Row>

                        {data.length !== 0 && !showSkeleton && (
                            <Pagination
                                className="mt-10 text-center sm:text-end"
                                total={count}
                                current={currentPage}
                                defaultPageSize={pageSize}
                                onChange={(page, pageSize2) => {
                                    handleScroll();
                                    setCurrentPage(page);
                                    setPageSize(pageSize2);
                                }}
                            />
                        )}
                    </div>
                </Flex>
            )}
        </Flex>
    );
};

export default ProductListing;
