import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Empty, Flex, Skeleton, Typography } from 'antd';

import CategoryTile from './CategoryTile';
import useNavigateToCategoryPageAndUpdateStore from '../../../hooks/category/useNavigateToCategoryPageAndUpdateStore';
import useCategoryTile from '../../../hooks/home/useCategoryTile';
import useGetCategories from '../../../hooks/home/useGetCategories';
import { IsoftwareCategory } from '../../../types';

const { Text } = Typography;

const Categories = () => {
    const { categoryList, isLoading } = useGetCategories();
    const { tileIconSize, scrollRef, scrollLeft, scrollRight, canScrollLeft, canScrollRight } =
        useCategoryTile(categoryList, isLoading);
    const { navigateAndUpdateStore } = useNavigateToCategoryPageAndUpdateStore();

    return (
        <Flex vertical className="w-full mt-5 md:mt-7 lg:mt-9 lg:gap-2">
            <Text className="font-semibold text-lg lg:text-2xl text-fontSubHeader">
                Search By Category
            </Text>

            {isLoading && <Skeleton />}

            {!isLoading && categoryList.length === 0 && (
                <Empty className="mx-auto" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}

            {!isLoading && categoryList.length > 0 && (
                <Flex justify="flex-start" align="center">
                    {canScrollLeft && (
                        <LeftOutlined
                            className="h-10 w-10 lg:h-11 lg:w-11 cursor-pointer"
                            onClick={scrollLeft}
                        />
                    )}

                    <Flex
                        ref={scrollRef}
                        justify="flex-start"
                        align="center"
                        className="w-full h-14 gap-2 flex-nowrap overflow-x-auto scroll-smooth"
                        style={{
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                        }}
                    >
                        {categoryList.map((category: IsoftwareCategory) => (
                            <CategoryTile
                                key={category.name}
                                category={category}
                                navigateAndUpdateStore={navigateAndUpdateStore}
                                tileIconSize={tileIconSize}
                            />
                        ))}
                    </Flex>
                    {canScrollRight && (
                        <RightOutlined
                            className="h-10 w-10 lg:h-11 lg:w-11 ms-1 ps-7 cursor-pointer"
                            onClick={scrollRight}
                        />
                    )}
                </Flex>
            )}
        </Flex>
    );
};

export default Categories;
