import { ReloadOutlined, SearchOutlined, SwapRightOutlined } from '@ant-design/icons';
import { Button, DatePicker, Flex, Input, Select, Tag, Typography } from 'antd';
import dayjs from 'dayjs';

import useScreenSize from '@src/hooks/useScreenSize';

import {
    STATUS_OPTIONS,
    TRANSACTION_TYPE_LABEL,
    TRANSACTION_TYPE_OPTIONS,
    TransactionStatus,
} from './transactionMeta';
import { TransactedCorporateOption } from '../../types/corporateCardTransactions';

const dateFormat = 'YYYY-MM-DD';
const disabledDate = (current: dayjs.Dayjs) => current && current > dayjs().endOf('day');

type Chip = { key: string; label: string; onRemove: () => void };

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <Flex vertical gap={6} className="min-w-0">
        <Typography.Text className="text-xs font-medium text-textGreyColor">
            {label}
        </Typography.Text>
        {children}
    </Flex>
);

type Props = {
    from: string;
    to: string;
    corporateId?: number;
    status?: TransactionStatus;
    transactionType?: number;
    cardLast4: string;
    searchText: string;
    corporates: TransactedCorporateOption[];
    isDateRangeChanged: boolean;
    handleFromChange: (dates: any, dateStrings: any) => void;
    handleToChange: (dates: any, dateStrings: any) => void;
    handleDateChange: (dates: any, dateStrings: any) => void;
    onCorporateChange: (val?: number) => void;
    onStatusChange: (val?: TransactionStatus) => void;
    onTransactionTypeChange: (val?: string) => void;
    onCardLast4Change: (val: string) => void;
    onSearchChange: (val: string) => void;
    onReset: () => void;
};

const Header = ({
    from,
    to,
    corporateId,
    status,
    transactionType,
    cardLast4,
    searchText,
    corporates,
    isDateRangeChanged,
    handleFromChange,
    handleToChange,
    handleDateChange,
    onCorporateChange,
    onStatusChange,
    onTransactionTypeChange,
    onCardLast4Change,
    onSearchChange,
    onReset,
}: Props) => {
    const { xs } = useScreenSize();

    const corporateOptions = corporates.map(corporate => ({
        label: corporate.name,
        value: corporate.corporateId,
    }));

    const chips: Chip[] = [];
    if (searchText) {
        chips.push({
            key: 'search',
            label: `Search: “${searchText}”`,
            onRemove: () => onSearchChange(''),
        });
    }
    if (corporateId !== undefined) {
        const name = corporates.find(item => item.corporateId === corporateId)?.name;
        chips.push({
            key: 'corporate',
            label: `Corporate: ${name ?? `#${corporateId}`}`,
            onRemove: () => onCorporateChange(undefined),
        });
    }
    if (status) {
        chips.push({
            key: 'status',
            label: `Status: ${status}`,
            onRemove: () => onStatusChange(undefined),
        });
    }
    if (transactionType !== undefined) {
        chips.push({
            key: 'type',
            label: `Type: ${TRANSACTION_TYPE_LABEL[transactionType] ?? transactionType}`,
            onRemove: () => onTransactionTypeChange(undefined),
        });
    }
    if (cardLast4) {
        chips.push({
            key: 'card',
            label: `Card ending: ${cardLast4}`,
            onRemove: () => onCardLast4Change(''),
        });
    }

    const canReset = chips.length > 0 || isDateRangeChanged;

    return (
        <Flex vertical gap={16}>
            <Flex gap={12} wrap align="center">
                <Input
                    allowClear
                    value={searchText}
                    prefix={<SearchOutlined className="text-textGreyColor" />}
                    placeholder="Search by transaction ID, vendor reference or merchant"
                    className="w-full min-w-60 flex-1 sm:w-auto"
                    maxLength={100}
                    onChange={event => onSearchChange(event.target.value)}
                />
                {xs ? (
                    <Flex align="center" gap={8} className="w-full">
                        <DatePicker
                            className="w-full"
                            onChange={handleFromChange}
                            format={dateFormat}
                            value={dayjs(from, dateFormat)}
                            disabledDate={disabledDate}
                        />
                        <SwapRightOutlined className="text-textGreyColor" />
                        <DatePicker
                            className="w-full"
                            onChange={handleToChange}
                            format={dateFormat}
                            value={dayjs(to, dateFormat)}
                            disabledDate={disabledDate}
                        />
                    </Flex>
                ) : (
                    <DatePicker.RangePicker
                        onChange={handleDateChange}
                        format={dateFormat}
                        className="w-[250px]"
                        value={[dayjs(from, dateFormat), dayjs(to, dateFormat)]}
                        disabledDate={disabledDate}
                    />
                )}
                <Button
                    icon={<ReloadOutlined />}
                    disabled={!canReset}
                    onClick={onReset}
                    className="w-full sm:w-auto"
                >
                    Reset
                </Button>
            </Flex>

            <div className="grid grid-cols-1 gap-x-3 gap-y-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                <Field label="Corporate">
                    <Select<number | undefined>
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        value={corporateId}
                        options={corporateOptions}
                        placeholder="All corporates"
                        className="w-full"
                        onChange={onCorporateChange}
                    />
                </Field>
                <Field label="Status">
                    <Select<TransactionStatus | undefined>
                        allowClear
                        value={status}
                        options={STATUS_OPTIONS}
                        placeholder="All statuses"
                        className="w-full"
                        onChange={onStatusChange}
                    />
                </Field>
                <Field label="Transaction type">
                    <Select<string | undefined>
                        allowClear
                        value={transactionType !== undefined ? String(transactionType) : undefined}
                        options={TRANSACTION_TYPE_OPTIONS}
                        placeholder="All types"
                        className="w-full"
                        onChange={onTransactionTypeChange}
                    />
                </Field>
                <Field label="Card last 4 digits">
                    <Input
                        allowClear
                        placeholder="e.g. 4821"
                        className="w-full"
                        maxLength={4}
                        value={cardLast4}
                        onChange={event => onCardLast4Change(event.target.value.replace(/\D/g, ''))}
                    />
                </Field>
            </div>

            {chips.length > 0 && (
                <Flex gap={8} wrap align="center">
                    <Typography.Text className="whitespace-nowrap text-xs text-textGreyColor">
                        Filtered by
                    </Typography.Text>
                    {chips.map(chip => (
                        <Tag
                            key={chip.key}
                            closable
                            onClose={chip.onRemove}
                            className="m-0 rounded-full border-0 bg-bgLightGray px-3 py-1 text-xs font-medium text-textBody"
                        >
                            {chip.label}
                        </Tag>
                    ))}
                </Flex>
            )}
        </Flex>
    );
};

export default Header;
