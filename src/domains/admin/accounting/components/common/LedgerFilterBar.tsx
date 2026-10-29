import { ChangeEvent, ReactNode } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Flex, Input, Select } from 'antd';

export type FilterChoice = { value: string; label: string };

// What a filter is, apart from the choice made: the same shape on every ledger screen.
export type FilterSpec = {
    key: string;
    label: string;
    placeholder: string;
    options: FilterChoice[];
    className: string;
};

export type FilterSelect = FilterSpec & {
    value: string | undefined;
    onChange: (value: string | undefined) => void;
};

type SearchProps = {
    value: string;
    placeholder: string;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export const LedgerSearchInput = ({ value, placeholder, onChange }: SearchProps) => (
    <Input
        allowClear
        prefix={<SearchOutlined className="text-navTextColor" />}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full sm:w-80"
    />
);

type LedgerFilterBarProps = {
    selects: FilterSelect[];
    search: SearchProps;
    note?: ReactNode;
};

// The search and filters under a table's export buttons, at the right end.
const LedgerFilterBar = ({ selects, search, note }: LedgerFilterBarProps) => (
    <Flex justify="end" align="center" gap={12} wrap="wrap" className="mb-4">
        {note}
        {selects.map(({ key, label, placeholder, options, value, onChange, className }) => (
            <Select
                key={key}
                allowClear
                aria-label={label}
                placeholder={placeholder}
                value={value}
                options={options}
                onChange={next => onChange(next || undefined)}
                className={className}
            />
        ))}
        <LedgerSearchInput {...search} />
    </Flex>
);

export default LedgerFilterBar;
