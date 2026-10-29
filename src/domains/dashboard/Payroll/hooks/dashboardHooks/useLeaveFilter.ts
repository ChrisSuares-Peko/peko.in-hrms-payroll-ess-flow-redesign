import { PaginationProps } from 'antd';

import { filterState } from '../../types/salaryProfileTypes/employeeSalaryTable';
import { filterStates } from '../../types/types';

interface Props {
    setFilter: (value: any) => void;
}
const useLeaveFilter = ({ setFilter }: Props) => {
    const handleSearch = (e: any) => {
        setFilter((prevState: filterStates) => ({
            ...prevState,
            search: e.target.value,
            start: 1,
        }));
    };
    const handleChangeMonth = (selectedOption: string | number) => {
        setFilter((prevState: filterState) => ({
            ...prevState,
            month: selectedOption,
            page: 1,
        }));
    };
    const handlePageChange: PaginationProps['onChange'] = start => {
        setFilter((prevState: filterStates) => ({
            ...prevState,
            start,
        }));
    };
    const handleChangeYear = (selectedOption: number) => {
        setFilter((prevState: filterState) => ({
            ...prevState,
            year: selectedOption,
            page: 1,
        }));
    };

    return {
        handleSearch,
        handlePageChange,
        handleChangeMonth,
        handleChangeYear,
    };
};

export default useLeaveFilter;
