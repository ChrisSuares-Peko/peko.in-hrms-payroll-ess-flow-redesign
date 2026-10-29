import React from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Input } from 'antd';

type Props = {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onClickHandler?: () => void;
    placeholder?: string;
    className?: string;
    maxLength?: number;
};

const SearchInput = ({
    value,
    onChange,
    onClickHandler,
    placeholder = 'Search',
    className,
    maxLength,
}: Props) => (
    <Input
        value={value}
        onChange={onChange}
        allowClear
        placeholder={placeholder}
        prefix={<SearchOutlined className="text-gray-400" />}
        className={className}
        onPressEnter={onClickHandler}
        maxLength={maxLength || Infinity}
    />
);

export default SearchInput;
