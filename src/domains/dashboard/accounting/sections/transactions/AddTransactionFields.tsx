import { Button, DatePicker, Flex, Input, Select, Typography } from 'antd';
import type { Dayjs } from 'dayjs';

import type { TransactionKind } from './useAddTransactionForm';
import {
    addTransactionModal,
    CategoryOption,
    transactionCategoryOptions,
} from '../../utils/transactionsData';

const { Text } = Typography;
const { TextArea } = Input;

const sanitizeAmount = (value: string) =>
    value
        .replace(/[^0-9.]/g, '')
        .replace(/(\..*?)\..*/g, '$1')
        .replace(/(\.\d{2})\d+/, '$1');

// Letters, numbers, spaces and everyday punctuation only — blocks symbols like @ # $ % ^ * that
// don't belong in a payment description/note.
const sanitizeDescription = (value: string) => value.replace(/[^a-zA-Z0-9\s.,&\-/():']/g, '');

const FIELD = '!rounded-md !border-borderSubtle !bg-white';
const SELECT_FIELD =
    'w-full [&_.ant-select-selector]:!rounded-md [&_.ant-select-selector]:!border-borderSubtle [&_.ant-select-selector]:!bg-white';

const FieldLabel = ({ text, required }: { text: string; required?: boolean }) => (
    <Text className="text-sm font-medium text-ink">
        {required && <Text className="mr-1 text-danger">*</Text>}
        {text}
    </Text>
);

interface AddTransactionFieldsProps {
    kind: TransactionKind;
    setKind: (kind: TransactionKind) => void;
    amount: string;
    setAmount: (amount: string) => void;
    date: Dayjs | null;
    setDate: (date: Dayjs | null) => void;
    category: string | undefined;
    handleCategoryChange: (value: string) => void;
    subcategory: string | undefined;
    setSubcategory: (value: string | undefined) => void;
    subcategoryOptions: CategoryOption[];
    description: string;
    setDescription: (description: string) => void;
    errors: Record<string, string>;
}

const AddTransactionFields = ({
    kind,
    setKind,
    amount,
    setAmount,
    date,
    setDate,
    category,
    handleCategoryChange,
    subcategory,
    setSubcategory,
    subcategoryOptions,
    description,
    setDescription,
    errors,
}: AddTransactionFieldsProps) => (
    <>
        <Flex vertical gap={8}>
            <Text className="text-sm font-medium text-ink">Transaction Type</Text>
            <Flex gap={12}>
                {(['Expense', 'Income'] as TransactionKind[]).map(option => {
                    const isActive = kind === option;
                    return (
                        <Button
                            key={option}
                            type="text"
                            onClick={() => setKind(option)}
                            className={`!h-10 flex-1 !rounded-xl !border !border-solid !bg-white !font-semibold ${
                                isActive
                                    ? '!border-danger !text-danger'
                                    : '!border-borderSubtle !text-bodyText'
                            }`}
                        >
                            {option}
                        </Button>
                    );
                })}
            </Flex>
        </Flex>

        <Flex gap={16} className="flex-col sm:flex-row">
            <Flex vertical gap={8} className="min-w-0 flex-1">
                <FieldLabel text="Amount (₹)" required />
                <Input
                    size="large"
                    inputMode="decimal"
                    placeholder="0.00"
                    prefix={<span className="text-slate-400">₹</span>}
                    value={amount}
                    status={errors.amount ? 'error' : undefined}
                    onChange={event => setAmount(sanitizeAmount(event.target.value))}
                    className={FIELD}
                />
                {errors.amount && <Text className="text-sm text-danger">{errors.amount}</Text>}
            </Flex>
            <Flex vertical gap={8} className="min-w-0 flex-1">
                <FieldLabel text="Date" required />
                <DatePicker
                    size="large"
                    value={date}
                    onChange={setDate}
                    format="DD/MM/YYYY"
                    placeholder="dd/mm/yyyy"
                    status={errors.date ? 'error' : undefined}
                    className={`w-full ${FIELD}`}
                />
                {errors.date && <Text className="text-sm text-danger">{errors.date}</Text>}
            </Flex>
        </Flex>

        <Flex gap={16} className="flex-col sm:flex-row">
            <Flex vertical gap={8} className="min-w-0 flex-1">
                <Text className="text-sm font-medium text-ink">Category</Text>
                <Select
                    size="large"
                    placeholder="Select category"
                    options={transactionCategoryOptions}
                    value={category}
                    onChange={handleCategoryChange}
                    className={SELECT_FIELD}
                />
            </Flex>
            <Flex vertical gap={8} className="min-w-0 flex-1">
                <Text className="text-sm font-medium text-ink">Subcategory</Text>
                <Select
                    size="large"
                    placeholder="Select subcategory"
                    options={subcategoryOptions}
                    value={subcategory}
                    onChange={setSubcategory}
                    disabled={!category}
                    className={SELECT_FIELD}
                />
            </Flex>
        </Flex>

        <Flex vertical gap={8}>
            <FieldLabel text="Payment Description" required />
            <TextArea
                rows={3}
                placeholder={addTransactionModal.descriptionPlaceholder}
                value={description}
                status={errors.description ? 'error' : undefined}
                onChange={event => setDescription(sanitizeDescription(event.target.value))}
                maxLength={addTransactionModal.descriptionMaxLength}
                showCount
                className="!rounded-xl !border-borderSubtle !bg-white"
            />
            {errors.description && (
                <Text className="text-sm text-danger">{errors.description}</Text>
            )}
        </Flex>
    </>
);

export default AddTransactionFields;
