import React from 'react';

import { Tag } from 'antd';

interface PriceTagProps {
    price: number;
    onClick: () => void;
    selected: boolean;
}

const PriceTag: React.FC<PriceTagProps> = ({ price, onClick, selected }) => (
    <Tag
        onClick={onClick}
        style={{ backgroundColor: 'white' }}
        className={`giftcard-price-tag text-center cursor-pointer xs:mt-1 md:mt-0 ${
            selected ? 'border border-brandPrimary bg-stone-50 text-brandPrimary' : 'border border-[#ccc] text-black'
        }`}
    >
        {`₹ ${Number(price).toFixed(2)}`}
    </Tag>
);

export default PriceTag;
