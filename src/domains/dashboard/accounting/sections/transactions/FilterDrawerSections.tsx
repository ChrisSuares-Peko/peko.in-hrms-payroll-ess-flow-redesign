import { DatePicker, Flex } from 'antd';
import type { Dayjs } from 'dayjs';

import { FIELD, SectionLabel } from './FilterDrawer.constants';
import FilterDrawerChipGroups from './FilterDrawerChipGroups';
import { FinancialAccount } from '../../api/transactions';

interface FilterDrawerSectionsProps {
    fromDate: Dayjs | null;
    setFromDate: (value: Dayjs | null) => void;
    toDate: Dayjs | null;
    setToDate: (value: Dayjs | null) => void;
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

const FilterDrawerSections = ({
    fromDate,
    setFromDate,
    toDate,
    setToDate,
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
}: FilterDrawerSectionsProps) => (
    <Flex vertical gap={24} className="w-full">
        <Flex vertical gap={10}>
            <SectionLabel>Date Range</SectionLabel>
            <Flex gap={12} className="w-full flex-col sm:flex-row">
                <DatePicker
                    value={fromDate}
                    onChange={setFromDate}
                    format="MMM DD"
                    placeholder="Mar 01"
                    className={`min-w-0 flex-1 ${FIELD}`}
                />
                <DatePicker
                    value={toDate}
                    onChange={setToDate}
                    format="MMM DD"
                    placeholder="Mar 31"
                    disabledDate={current => Boolean(fromDate) && current.isBefore(fromDate, 'day')}
                    className={`min-w-0 flex-1 ${FIELD}`}
                />
            </Flex>
        </Flex>

        <FilterDrawerChipGroups
            txnType={txnType}
            setTxnType={setTxnType}
            categories={categories}
            setCategories={setCategories}
            status={status}
            setStatus={setStatus}
            sources={sources}
            setSources={setSources}
            bankAccounts={bankAccounts}
            setBankAccounts={setBankAccounts}
            accounts={accounts}
        />
    </Flex>
);

export default FilterDrawerSections;
