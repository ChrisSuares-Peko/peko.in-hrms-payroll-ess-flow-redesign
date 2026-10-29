import { SearchOutlined } from '@ant-design/icons';
import { DatePicker, Flex, Input, Select } from 'antd';
import { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

export type AttendanceDateRange = [Dayjs | null, Dayjs | null] | null;

const stripEmoji = (value: string) =>
    value.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '');

interface SelectOption {
    label: string;
    value: string;
}

interface AttendanceFiltersProps {
    statusValue: string;
    statusOptions: SelectOption[];
    onStatusChange: (value: string) => void;
    range: AttendanceDateRange;
    onRangeChange: (range: AttendanceDateRange) => void;
    search: string;
    onSearchChange: (value: string) => void;
}

// Shared filter bar for the Attendance tables (History + Overtime): a status
// dropdown, a From/To date range and a search box.
const AttendanceFilters = ({
    statusValue,
    statusOptions,
    onStatusChange,
    range,
    onRangeChange,
    search,
    onSearchChange,
}: AttendanceFiltersProps) => (
    <Flex align="center" gap={8} wrap="wrap">
        <Select
            value={statusValue}
            onChange={onStatusChange}
            options={statusOptions}
            className="min-w-[110px]"
        />
        <RangePicker
            value={range}
            onChange={onRangeChange}
            format="DD MMM YYYY"
            placeholder={['From date', 'To date']}
            className="w-[260px]"
        />
        <Input
            allowClear
            value={search}
            onChange={e => onSearchChange(stripEmoji(e.target.value))}
            placeholder="Search"
            prefix={<SearchOutlined className="text-gray-400" />}
            className="w-44"
        />
    </Flex>
);

export default AttendanceFilters;
