import React from 'react';

import { Select } from 'antd';

import DownArrow from '../../assets/icons/DownArrow.svg';

type Option = {
    label: string;
    value: string;
};

type Props = {
    value?: string;
    options: Option[];
    onChange: (value: string) => void;
    className?: string;
};

const SortSelect = ({ value, options, onChange, className }: Props) => (
    <Select
        value={value}
        options={options}
        onChange={onChange}
        suffixIcon={<img src={DownArrow} alt="sort" className="w-3 h-3 opacity-60" />}
        className={`${className} w-[45%] md:w-[20%]`}
    />
);

export default SortSelect;
