import { PaginationProps } from 'antd';
import type { RangePickerProps } from 'antd/es/date-picker';
import { TableProps } from 'antd/es/table';

type FilterState = {
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: string;
};

interface Props {
    setFilter: React.Dispatch<React.SetStateAction<any>>;
}

const useFilter = ({ setFilter }: Props) => {
    const handleSearch = (search: string) => {
        setFilter((prev: FilterState) => ({ ...prev, search, page: 1 }));
    };

    const handleStatusChange = (status: string | undefined) => {
        setFilter((prev: FilterState) => ({ ...prev, status, page: 1 }));
    };

    const handleTypeChange = (type: string | undefined) => {
        setFilter((prev: FilterState) => ({ ...prev, type, page: 1 }));
    };

    const handleDateChange: RangePickerProps['onChange'] = (_: unknown, dateStrings: [string, string]) => {
        const [startDate, endDate] = dateStrings;
        setFilter((prev: FilterState) => ({
            ...prev,
            startDate: startDate || undefined,
            endDate:   endDate   || undefined,
            page: 1,
        }));
    };

    const handlePageChange: PaginationProps['onChange'] = (page, limit) => {
        setFilter((prev: FilterState) => ({ ...prev, page, limit }));
    };

    const handleTableChange: TableProps<any>['onChange'] = (_, __, sorter) => {
        const s = Array.isArray(sorter) ? sorter[0] : sorter;
        if (s?.order) {
            setFilter((prev: FilterState) => ({
                ...prev,
                sortBy:    s.field as string,
                sortOrder: s.order === 'ascend' ? 'ASC' : 'DESC',
                page: 1,
            }));
        } else {
            setFilter((prev: FilterState) => ({ ...prev, sortBy: undefined, sortOrder: undefined, page: 1 }));
        }
    };

    return {
        handleSearch,
        handleStatusChange,
        handleTypeChange,
        handleDateChange,
        handlePageChange,
        handleTableChange,
    };
};

export default useFilter;
