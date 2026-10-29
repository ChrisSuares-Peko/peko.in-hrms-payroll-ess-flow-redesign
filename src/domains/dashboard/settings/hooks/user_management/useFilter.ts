import { PaginationProps } from 'antd';

import { SubCorporateQueryParams } from '../../types/userManagement';

interface PropsType {
    setFilters: React.Dispatch<React.SetStateAction<SubCorporateQueryParams>>;
}

const useFilter = ({ setFilters }: PropsType) => {
    const handlePageChange: PaginationProps['onChange'] = page => {
        setFilters(prevState => ({
            ...prevState,
            page,
        }));
    };

    const reloadTable = () => {
        setFilters(prevState => ({
            ...prevState,
            reload: !prevState.reload,
        }));
    };

    const handleSearch = (searchText: string) => {
        setFilters(prevState => ({
            ...prevState,
            searchText,
        }));
    };

    return {
        handlePageChange,
        reloadTable,
        handleSearch,
    };
};

export default useFilter;
