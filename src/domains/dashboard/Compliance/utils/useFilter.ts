import type { PaginationProps } from 'antd';

export interface ComplianceFilterState {
    searchText: string;
    page: number;
    pageSize: number;
    from: string;
    to: string;
    status: string;
}

export const COMPLIANCE_FILTER_INITIAL_STATE: ComplianceFilterState = {
    searchText: '',
    page: 1,
    pageSize: 10,
    from: '',
    to: '',
    status: '',
};

interface Props {
    setFilter: React.Dispatch<React.SetStateAction<ComplianceFilterState>>;
}

const useFilter = ({ setFilter }: Props) => {
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilter((prev) => ({ ...prev, searchText: e.target.value, page: 1 }));
    };

    const handlePageChange: PaginationProps['onChange'] = (page) => {
        setFilter((prev) => ({ ...prev, page }));
    };

    const handleStatusFilter = (status: string) => {
        setFilter((prev) => ({ ...prev, status, page: 1 }));
    };

    const handleDateRange = (from: string, to: string) => {
        setFilter((prev) => ({ ...prev, from, to, page: 1 }));
    };

    return {
        handleSearch,
        handlePageChange,
        handleStatusFilter,
        handleDateRange,
    };
};

export default useFilter;
