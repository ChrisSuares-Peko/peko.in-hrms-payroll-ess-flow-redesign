import { useState, type FC } from 'react';

// import { Alert } from 'antd';
import dayjs from 'dayjs';

import useDebounce from '@src/hooks/useDebounce';

import TableBody from '../components/orderHistory/TableBody';
import TableHeader from '../components/orderHistory/TableHeader';
import filter from '../utils/filter';

interface HistoryPageProps {}

const HistoryPage: FC<HistoryPageProps> = () => {
    const [searchText, setSearchText] = useState<string>('');
    const debouncedSearchText = useDebounce(searchText, 300); // Use the custom hook
    const today = dayjs();
    const todayFormatted = today.format('YYYY-MM-DD');
    const thirtyDaysAgo = today.subtract(1, 'month').format('YYYY-MM-DD');

    const fromDate = thirtyDaysAgo;
    const toDate = todayFormatted;
    const initialValues = {
        page: 1,
        pageSize: 10,
        from: fromDate,
        to: toDate,
    };
    const [filters, setFilters] = useState(initialValues);
    const { handleDateChange, handleFromChange, handleToChange } = filter({
        setFilters,
        initalStartDate: initialValues.from,
        initalEndDate: initialValues.to,
    });
    return (
        <>
            <TableHeader
                searchText={searchText}
                setSearchText={setSearchText}
                handleFromChange={handleFromChange}
                handleToChange={handleToChange}
                handleDateChange={handleDateChange}
                from={filters.from}
                to={filters.to}
            />

            {/* <Alert
                className="md:mb-2 "
                message={
                    <span>
                        <strong>Important:</strong> Once signed, documents are stored for up to{' '}
                        <strong>30 days</strong>. After this period, they are permanently deleted
                        from our systems.
                    </span>
                }
                type="warning"
                showIcon
            /> */}

            <TableBody searchText={debouncedSearchText} filters={filters} />
        </>
    );
};

export default HistoryPage;
