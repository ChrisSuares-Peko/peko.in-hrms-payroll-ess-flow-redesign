import React from 'react';

import { FilterOutlined, ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { Button, Flex } from 'antd';

interface FilterHotelSmProps {
    sortOption: string;
    hasFilterApplied: boolean;
    handleSortChange: (option: string) => void;
    toggleModal: () => void;
}

const FilterHotelSm: React.FC<FilterHotelSmProps> = ({
    sortOption,
    handleSortChange,
    toggleModal,
    hasFilterApplied,
}) => (
    <Flex justify="space-between" align="center" className="mt-3 ">
        <Button
            icon={<FilterOutlined />}
            className={`border ${hasFilterApplied ? 'border-brandPrimary' : 'border-gray-300'} text-black rounded-lg bg-white py-0 px-2 xs375:px-2`}
            onClick={toggleModal}
        >
            Filter
        </Button>

        <Button
            icon={<ArrowDownOutlined />}
            className={`border ${sortOption === 'priceLowToHigh' ? 'border-brandPrimary' : 'border-gray-300'} text-black rounded-lg bg-white py-0 px-1 xs375:px-2`}
            onClick={() => handleSortChange('priceLowToHigh')}
        >
            Price
        </Button>

        <Button
            icon={<ArrowUpOutlined />}
            className={`border-gray-300 text-black rounded-lg bg-white  py-0 px-1 xs375:px-2 ${sortOption === 'priceHighToLow' ? 'border-brandPrimary' : 'border-gray-300'}`}
            onClick={() => handleSortChange('priceHighToLow')}
        >
            Price
        </Button>

        <Button
            className={`border-gray-300 text-black rounded-lg bg-white  py-0 px-1 xs375:px-2 ${sortOption === 'popular' ? 'border-brandPrimary' : 'border-gray-300'}`}
            onClick={() => handleSortChange('popular')}
        >
            Popular
        </Button>
    </Flex>
);

export default FilterHotelSm;
