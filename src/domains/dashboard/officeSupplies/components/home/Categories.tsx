import { FC } from 'react';

// Import categoryIcons and specify its type
import { Empty, Flex, Image, Typography } from 'antd';
// import clevertap from 'clevertap-web-sdk';

import CategoriesSkeleton from './skeltons/CategoriesSkelton';
import AllCategoryIcon from '../../assets/icons/sell.svg';
import { Category } from '../../types/category';

interface CategoriesProps {
    categories: Category[];
    selectedCategory: number | null;
    isLoading: boolean;
    setSelectedCategory: (name: number | null) => void;
    setSelectedCategoryName: (name: string) => void;
}

const Categories: FC<CategoriesProps> = ({
    categories,
    selectedCategory,
    isLoading,
    setSelectedCategory,
    setSelectedCategoryName,
}) => (
    <Flex
        gap={20}
        justify="start"
        align="start"
        className="Flex category_center md:w-full px-2 py-2 sm:mt-12 sm:mb-8 mt-5 overflow-x-scroll overflow-y-clip"
    >
        <CategoriesSkeleton loading={isLoading} />
        {categories.length === 0 && !isLoading && (
            <Empty className="mx-auto" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
        {categories.length !== 0 && !isLoading && (
            <Flex
                align="center"
                vertical
                className="text-center text-textBlack cursor-pointer hover:scale-105 xs:mb-5 md:mb-0"
                onClick={() => {
                    setSelectedCategory(null);
                    setSelectedCategoryName('All Categories');
                    // clevertap.event.push('supply_category', {
                    //     all: true,
                    // });
                }}
            >
                <Flex
                    justify="center"
                    align="center"
                    className={`border ${selectedCategory === null ? 'border-bgOrange' : 'border-whitesmoke'} 
            rounded-full w-14 h-14 xl:w-[4.5rem] xl:h-[4.5rem]`}
                >
                    <Image preview={false} src={AllCategoryIcon} alt="Stationary Icon" />
                </Flex>
                <Typography.Text
                    className={`text-center xs:text-[0.7rem] xl:text-[0.9rem] xxl:text-base mt-2 ${selectedCategory === 1 ? 'text-bgOrange' : 'text-black'} `}
                >
                    All
                </Typography.Text>
            </Flex>
        )}
        {categories.map((value, index) => (
            <Flex
                align="center"
                vertical
                className="text-center text-textBlack cursor-pointer hover:scale-105 xs:mb-5 md:mb-0"
                onClick={() => {
                    setSelectedCategory(value.id);
                    setSelectedCategoryName(value.categoryName);
                    // clevertap.event.push('supply_category', {
                    //     [value.categoryName?.split(' ')?.join('_')?.toLowerCase()]: true,
                    // });
                }}
                key={index}
            >
                <Flex
                    justify="center"
                    align="center"
                    className={`border ${selectedCategory === value.id ? 'border-bgOrange' : 'border-whitesmoke'} 
                              rounded-full w-14 h-14 xl:w-[4.5rem] xl:h-[4.5rem]`}
                >
                    <Image
                        width={30}
                        height={30}
                        preview={false}
                        src={value.categoryImage}
                        alt="Stationary Icon"
                    />
                </Flex>
                <Typography.Text
                    className={`text-center xs:text-[0.7rem] xl:text-[0.9rem] xxl:text-base mt-2 
                            ${selectedCategory === value.id ? 'text-bgOrange' : 'text-black'} `}
                >
                    {value.categoryName}
                </Typography.Text>
            </Flex>
        ))}
    </Flex>
);
export default Categories;
