import { CloseOutlined } from '@ant-design/icons';
import { Button, Drawer, Flex } from 'antd';

import FilterDrawerSections from './FilterDrawerSections';
import { useFilterDrawer } from './useFilterDrawer';
import { TransactionFilters } from '../../utils/transactionsData';

interface FilterDrawerProps {
    open: boolean;
    onClose: () => void;

    onApply: (filters: TransactionFilters) => void;
}

const FilterDrawer = ({ open, onClose, onApply }: FilterDrawerProps) => {
    const {
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
        handleReset,
        handleApply,
    } = useFilterDrawer(open, onClose, onApply);

    return (
        <Drawer
            open={open}
            onClose={onClose}
            placement="left"
            closeIcon={null}
            width="min(440px, 92vw)"
            zIndex={20}
            title={<span className="text-lg font-bold text-ink">Filters</span>}
            extra={
                <Button
                    type="text"
                    icon={<CloseOutlined />}
                    onClick={onClose}
                    className="!h-auto !p-0 !text-sm !font-medium !text-muted hover:!text-bodyText"
                >
                    Close
                </Button>
            }
            styles={{ body: { padding: 20 }, header: { padding: 20 } }}
            footer={
                <Flex gap={12} className="w-full">
                    <Button
                        type="primary"
                        size="large"
                        onClick={handleApply}
                        className="!flex-1 !rounded-lg"
                    >
                        Apply Filters
                    </Button>
                    <Button
                        size="large"
                        onClick={handleReset}
                        className="!rounded-lg !border-borderSubtle !text-bodyText"
                    >
                        Reset
                    </Button>
                </Flex>
            }
        >
            <FilterDrawerSections
                fromDate={fromDate}
                setFromDate={setFromDate}
                toDate={toDate}
                setToDate={setToDate}
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
        </Drawer>
    );
};

export default FilterDrawer;
