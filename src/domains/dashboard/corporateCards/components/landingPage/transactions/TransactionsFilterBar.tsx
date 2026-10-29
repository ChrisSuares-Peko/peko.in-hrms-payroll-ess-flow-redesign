import { ReactNode } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { DatePicker, Input, Select } from 'antd';
import dayjs, { Dayjs } from 'dayjs';

import { TransactionsVariant } from './TransactionsTable';
import { stripEmojis } from '../../../utils/helpers';
import { STATUS_OPTIONS } from '../../../utils/transactionsData';
import { SelectOption } from '../../../utils/types';

const { RangePicker } = DatePicker;

type DateRange = [Dayjs | null, Dayjs | null] | null;

const FilterField = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className="flex flex-col gap-1.5">
        <span className="text-sm text-textBody">{label}</span>
        {children}
    </div>
);

interface TransactionsFilterBarProps {
    variant?: TransactionsVariant;
    dateRange?: DateRange;
    onDateRangeChange?: (value: DateRange) => void;
    selectedCardholder?: string;
    onCardholderChange?: (value: string | undefined) => void;
    cardholderOptions?: SelectOption[];
    selectedAdminCard?: string;
    onAdminCardChange?: (value: string | undefined) => void;
    adminCardOptions?: SelectOption[];
    selectedCard?: string;
    onCardChange?: (value: string | undefined) => void;
    cardOptions?: SelectOption[];
    selectedStatus?: string;
    onStatusChange?: (value: string | undefined) => void;
    search?: string;
    onSearchChange?: (value: string) => void;
}

const TransactionsFilterBar = ({
    variant = 'admin',
    dateRange,
    onDateRangeChange,
    selectedCardholder,
    onCardholderChange,
    cardholderOptions = [],
    selectedAdminCard,
    onAdminCardChange,
    adminCardOptions = [],
    selectedCard,
    onCardChange,
    cardOptions = [],
    selectedStatus,
    onStatusChange,
    search,
    onSearchChange,
}: TransactionsFilterBarProps) => {
    const isAdmin = variant === 'admin';

    return (
        <div className="rounded-2xl border border-borderCard bg-white mt-2 p-5">
            {isAdmin ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <FilterField label="From">
                        <RangePicker
                            className="w-full"
                            placeholder={['Start date', 'End date']}
                            value={dateRange}
                            disabledDate={current => current > dayjs().endOf('day')}
                            onChange={val => onDateRangeChange?.(val as DateRange)}
                        />
                    </FilterField>
                    <FilterField label="Cardholder">
                        <Select
                            allowClear
                            placeholder="Select Cardholder"
                            options={cardholderOptions}
                            value={selectedCardholder}
                            onChange={val => onCardholderChange?.(val)}
                            className="w-full"
                        />
                    </FilterField>
                    <FilterField label="Card">
                        <Select
                            allowClear
                            placeholder="Select Card"
                            options={adminCardOptions}
                            value={selectedAdminCard}
                            onChange={val => onAdminCardChange?.(val)}
                            className="w-full"
                        />
                    </FilterField>
                    <FilterField label="Status">
                        <Select
                            allowClear
                            placeholder="Select Status"
                            options={STATUS_OPTIONS}
                            value={selectedStatus}
                            onChange={val => onStatusChange?.(val)}
                            className="w-full"
                        />
                    </FilterField>
                    <FilterField label="Search">
                        <Input
                            allowClear
                            prefix={<SearchOutlined className="text-textGreyLight" />}
                            placeholder="Search"
                            value={search}
                            onChange={e => onSearchChange?.(stripEmojis(e.target.value))}
                        />
                    </FilterField>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_2fr]">
                    <FilterField label="From">
                        <RangePicker
                            className="w-full"
                            placeholder={['Start date', 'End date']}
                            value={dateRange}
                            disabledDate={current => current > dayjs().endOf('day')}
                            onChange={val => onDateRangeChange?.(val as DateRange)}
                        />
                    </FilterField>
                    <FilterField label="Card">
                        <Select
                            allowClear
                            placeholder="Select Card"
                            options={cardOptions}
                            value={selectedCard}
                            onChange={val => onCardChange?.(val)}
                            className="w-full"
                        />
                    </FilterField>
                    <FilterField label="Status">
                        <Select
                            allowClear
                            placeholder="Select Status"
                            options={STATUS_OPTIONS}
                            value={selectedStatus}
                            onChange={val => onStatusChange?.(val)}
                            className="w-full"
                        />
                    </FilterField>
                    <FilterField label="Search">
                        <Input
                            allowClear
                            prefix={<SearchOutlined className="text-textGreyLight" />}
                            placeholder="Search"
                            value={search}
                            onChange={e => onSearchChange?.(stripEmojis(e.target.value))}
                        />
                    </FilterField>
                </div>
            )}
        </div>
    );
};

export default TransactionsFilterBar;
