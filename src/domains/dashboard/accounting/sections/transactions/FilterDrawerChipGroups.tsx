import { Checkbox, Flex, Radio } from 'antd';

import { chip, SectionLabel } from './FilterDrawer.constants';
import { FinancialAccount } from '../../api/transactions';
import {
    filterCategoryOptions,
    filterSourceOptions,
    filterStatusOptions,
    filterTransactionTypeOptions,
} from '../../utils/transactionsData';

interface FilterDrawerChipGroupsProps {
    txnType: string;
    setTxnType: (value: string) => void;
    categories: string[];
    setCategories: (value: string[]) => void;
    status: string;
    setStatus: (value: string) => void;
    sources: string[];
    setSources: (value: string[]) => void;
    bankAccounts: string[];
    setBankAccounts: (value: string[]) => void;
    accounts: FinancialAccount[];
}

const FilterDrawerChipGroups = ({
    txnType,
    setTxnType,
    categories,
    setCategories,
    status,
    setStatus,
    sources,
    setSources,
    bankAccounts,
    setBankAccounts,
    accounts,
}: FilterDrawerChipGroupsProps) => (
    <>
        <Flex vertical gap={10}>
            <SectionLabel>Transaction Type</SectionLabel>
            <Radio.Group
                value={txnType}
                onChange={event => setTxnType(event.target.value)}
                className="flex flex-wrap gap-2"
            >
                {filterTransactionTypeOptions.map(option => (
                    <Radio
                        key={option.value}
                        value={option.value}
                        className={chip(txnType === option.value)}
                    >
                        {option.label}
                    </Radio>
                ))}
            </Radio.Group>
        </Flex>

        <Flex vertical gap={10}>
            <SectionLabel>Category</SectionLabel>
            <Checkbox.Group
                value={categories}
                onChange={value => setCategories(value as string[])}
                className="flex flex-wrap gap-2"
            >
                {filterCategoryOptions.map(category => (
                    <Checkbox
                        key={category}
                        value={category}
                        className={chip(categories.includes(category))}
                    >
                        {category}
                    </Checkbox>
                ))}
            </Checkbox.Group>
        </Flex>

        <Flex vertical gap={10}>
            <SectionLabel>Status</SectionLabel>
            <Radio.Group
                value={status}
                onChange={event => setStatus(event.target.value)}
                className="flex flex-wrap gap-2"
            >
                {filterStatusOptions.map(option => (
                    <Radio
                        key={option.value}
                        value={option.value}
                        className={chip(status === option.value)}
                    >
                        {option.label}
                    </Radio>
                ))}
            </Radio.Group>
        </Flex>

        <Flex vertical gap={10}>
            <SectionLabel>Source</SectionLabel>
            <Checkbox.Group
                value={sources}
                onChange={value => setSources(value as string[])}
                className="flex flex-wrap gap-2"
            >
                {filterSourceOptions.map(source => (
                    <Checkbox
                        key={source}
                        value={source}
                        className={chip(sources.includes(source))}
                    >
                        {source}
                    </Checkbox>
                ))}
            </Checkbox.Group>
        </Flex>

        {accounts.length > 0 && (
            <Flex vertical gap={10}>
                <SectionLabel>Bank Account</SectionLabel>
                <Checkbox.Group
                    value={bankAccounts}
                    onChange={value => setBankAccounts(value as string[])}
                    className="flex flex-wrap gap-2"
                >
                    {accounts.map(account => {
                        const id = String(account.id);
                        return (
                            <Checkbox
                                key={id}
                                value={id}
                                className={chip(bankAccounts.includes(id))}
                            >
                                {account.accountName}
                            </Checkbox>
                        );
                    })}
                </Checkbox.Group>
            </Flex>
        )}
    </>
);

export default FilterDrawerChipGroups;
