import React, { memo } from 'react';

import { Flex, Image, Typography } from 'antd';

import AllCategoryIcon from '@domains/dashboard/Subscriptions/assets/icons/category.svg';
import CategoriesSkeleton from '@src/domains/dashboard/officeSupplies/components/home/skeltons/CategoriesSkelton';
import useScreenSize from '@src/hooks/useScreenSize';

import { categories } from '../../types/types';

import '../../assets/styles/styles.css';

const { Text } = Typography;

interface CategoriesProps {
    category: categories[];
    selectedCategory: number | null;
    isLoading: boolean;
    setSelectedCategory: (name: number | null) => void;
}

function toTitleCase(str: string) {
    return str.replace(/\w\S*/g, txt => {
        const excludeWords = ['IT'];
        if (excludeWords.includes(txt.toUpperCase())) {
            return txt.toUpperCase();
        }
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

const Categories = ({
    category,
    isLoading,
    selectedCategory,
    setSelectedCategory,
}: CategoriesProps) => {
    const { md } = useScreenSize();

    return (
        <Flex
            gap={25}
            data-testid="categories-skeleton"
            className="Flex gap-30 category_center md:w-full px-2 mt-12 mb-8 overflow-x-scroll overflow-y-clip"
        >
            <CategoriesSkeleton loading={isLoading} />

            {category.length !== 0 && !isLoading && (
                <Flex
                    align="center"
                    vertical
                    className="text-center text-textBlack cursor-pointer hover:scale-105 xs:mb-7 md:mb-0"
                    onClick={() => {
                        setSelectedCategory(null);
                    }}
                    style={{ height: md ? '8rem' : '6rem', width: '5.1rem' }}
                >
                    <Flex
                        justify="center"
                        align="center"
                        //                 className={`border mt-2 ${selectedCategory === null ? 'border-bgOrange' : 'border-whitesmoke'}
                        // rounded-full w-14 h-14 xl:w-[4.5rem] xl:h-[4.5rem]`}
                        className={`border mt-2 ${selectedCategory === null ? 'border-bgOrange' : 'border-whitesmoke'} 
                          rounded-full w-16 h-16 xl:w-[4.5rem] xl:h-[4.5rem]`}
                    >
                        <Image preview={false} src={AllCategoryIcon} alt="Stationary Icon" />
                    </Flex>
                    <Text
                        className={`text-center text-xs md:text-[0.93rem] w-[6.59rem] mt-3 line-clamp-1 ${selectedCategory === 1 ? 'text-bgOrange' : 'text-black'} `}
                    >
                        All
                    </Text>
                </Flex>
            )}
            {category.map((value, index) => (
                <Flex
                    align="center"
                    vertical
                    className="text-center text-textBlack cursor-pointer hover:scale-105"
                    onClick={() => {
                        setSelectedCategory(value.id);
                    }}
                    key={index}
                    style={{ height: '8rem', width: '5.1rem' }}
                >
                    <Flex
                        justify="center"
                        align="center"
                        className={`border mt-2 ${selectedCategory === value.id ? 'border-bgOrange' : 'border-whitesmoke'} 
                          rounded-full w-16 h-16 xl:w-[4.5rem] xl:h-[4.5rem]`}
                    >
                        <Image
                            width={30}
                            height={30}
                            preview={false}
                            src={value.categoryImage}
                            alt="Stationary Icon"
                        />
                    </Flex>
                    {/* <Popover placement="bottom" content={toTitleCase(value.categoryName)}> */}
                    <Text
                        className={`text-center text-xs md:text-[0.93rem] w-[6.59rem] mt-3
                        ${selectedCategory === value.id ? 'text-bgOrange' : 'text-black'} `}
                    >
                        {toTitleCase(value.categoryName)}
                    </Text>
                    {/* </Popover> */}
                </Flex>
            ))}
        </Flex>
    );
};

export default memo(Categories);
