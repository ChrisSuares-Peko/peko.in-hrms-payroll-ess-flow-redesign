import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, DatePicker, Grid, Input, Select } from 'antd';
import type { Dayjs } from 'dayjs';

type RecurringStatusFilter = 'ALL' | 'ACTIVE' | 'PAUSED' | 'ENDED';

const STATUS_FILTER_OPTIONS = [
    { label: 'All', value: 'ALL' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Paused', value: 'PAUSED' },
    { label: 'Ended', value: 'ENDED' },
];

interface RecurringListHeaderProps {
    onMakeRecurring: () => void;
    filter: RecurringStatusFilter;
    onFilterChange: (v: RecurringStatusFilter) => void;
    range: [Dayjs, Dayjs] | null;
    onRangeChange: (v: [Dayjs, Dayjs] | null) => void;
    search: string;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
}

const RecurringListHeader = ({
    onMakeRecurring,
    filter,
    onFilterChange,
    range,
    onRangeChange,
    search,
    onChange,
}: RecurringListHeaderProps) => {
    const screens = Grid.useBreakpoint();
    const isBelowSm = !screens.sm;
    const isSmMd = screens.sm && !screens.lg;

    const actions = isSmMd ? (
        <div className="w-full grid grid-cols-2 gap-2">
            <Select
                value={filter}
                onChange={(v: RecurringStatusFilter) => onFilterChange(v)}
                options={STATUS_FILTER_OPTIONS}
                className="!w-full"
            />
            <DatePicker.RangePicker
                value={range}
                onChange={vals =>
                    onRangeChange(
                        vals && vals[0] && vals[1]
                            ? ([vals[0], vals[1]] as unknown as [Dayjs, Dayjs])
                            : null
                    )
                }
                className="!w-full"
            />
            <Input
                value={search}
                placeholder="Search schedules or customers"
                prefix={<SearchOutlined className="text-gray-400" />}
                onChange={onChange}
                allowClear
                className="!w-full col-span-2"
            />
            <Button
                type="primary"
                danger
                icon={<PlusOutlined />}
                onClick={onMakeRecurring}
                className="!w-full col-span-2"
            >
                Make invoice recurring
            </Button>
        </div>
    ) : (
        <>
            <Select
                value={filter}
                onChange={(v: RecurringStatusFilter) => onFilterChange(v)}
                options={STATUS_FILTER_OPTIONS}
                className={isBelowSm ? '!w-full' : '!w-32'}
            />
            <DatePicker.RangePicker
                value={range}
                onChange={vals =>
                    onRangeChange(
                        vals && vals[0] && vals[1]
                            ? ([vals[0], vals[1]] as unknown as [Dayjs, Dayjs])
                            : null
                    )
                }
                className={isBelowSm ? '!w-full' : '!w-64'}
            />
            <Input
                value={search}
                placeholder="Search schedules or customers"
                prefix={<SearchOutlined className="text-gray-400" />}
                onChange={onChange}
                allowClear
                className={isBelowSm ? '!w-full' : '!w-60'}
            />
            <Button
                type="primary"
                danger
                icon={<PlusOutlined />}
                onClick={onMakeRecurring}
                className={isBelowSm ? '!w-full' : ''}
            >
                Make invoice recurring
            </Button>
        </>
    );

    return (
        <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 m-0">Recurring</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Automate invoicing for retainers, subscriptions, and repeat billing.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">{actions}</div>
            </div>
        </div>
    );
};

export default RecurringListHeader;
