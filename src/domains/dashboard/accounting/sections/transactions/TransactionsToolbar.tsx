import { useState } from 'react';

import { DownloadOutlined, FilterOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Select } from 'antd';

import { removeEmoji } from '@src/utils/regex';

import FilterDrawer from './FilterDrawer';
import { filterTransactionTypeOptions, TransactionFilters } from '../../utils/transactionsData';

interface TransactionsToolbarProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    typeFilter: string;
    onTypeChange: (value: string) => void;
    onApplyFilters: (filters: TransactionFilters) => void;
    onExport: () => void;
    exporting: boolean;
}

const TransactionsToolbar = ({
    searchQuery,
    onSearchChange,
    typeFilter,
    onTypeChange,
    onApplyFilters,
    onExport,
    exporting,
}: TransactionsToolbarProps) => {
    const [filtersOpen, setFiltersOpen] = useState(false);

    return (
        <Flex gap={12} className="flex-col lg:flex-row lg:items-center">
            <Input
                value={searchQuery}
                onChange={event => onSearchChange(event.target.value.replace(removeEmoji, ''))}
                prefix={<SearchOutlined className="text-slate-400" />}
                placeholder="Search transactions"
                size="large"
                allowClear
                className="flex-1 !rounded-xl"
            />
            <Flex gap={12} className="shrink-0">
                <Select
                    size="large"
                    value={typeFilter}
                    onChange={onTypeChange}
                    options={filterTransactionTypeOptions}
                    className="min-w-0 flex-1 lg:w-32 lg:flex-none [&_.ant-select-selector]:!h-10 [&_.ant-select-selector]:!items-center [&_.ant-select-selector]:!rounded-xl [&_.ant-select-selector]:!border-borderSubtle"
                />
                <Button
                    size="large"
                    icon={<FilterOutlined />}
                    onClick={() => setFiltersOpen(true)}
                    className="min-w-0 flex-1 !rounded-xl !border-borderSubtle !text-bodyText lg:flex-none"
                >
                    Filters
                </Button>
                <Button
                    size="large"
                    icon={<DownloadOutlined />}
                    onClick={onExport}
                    loading={exporting}
                    className="min-w-0 flex-1 !rounded-xl !border-borderSubtle !text-bodyText lg:flex-none"
                >
                    Export
                </Button>
            </Flex>

            <FilterDrawer
                open={filtersOpen}
                onClose={() => setFiltersOpen(false)}
                onApply={onApplyFilters}
            />
        </Flex>
    );
};

export default TransactionsToolbar;
