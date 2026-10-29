import { PaginationProps } from 'antd';

interface Props {
    setFilter: (value: any) => void;
}

const useAssetFilter = ({ setFilter }: Props) => {
    const handleSearch = (e: any) => {
        setFilter((prev: any) => ({
            ...prev,
            searchText: e.target.value,
            page: 1,
        }));
    };

    const handleAssetTypeChange = (value: string) => {
        setFilter((prev: any) => ({
            ...prev,
            assetType: value,
            page: 1,
        }));
    };

    const handleStatusChange = (value: string) => {

        setFilter((prev: any) => ({
            ...prev,
            assetStatus: value,
            page: 1,
        }));
    };

    const handlePagination: PaginationProps['onChange'] = (page, limit) => {
        setFilter((prev: any) => ({
            ...prev,
            page,
            limit,
        }));
    };

    return {
        handleSearch,
        handleAssetTypeChange,
        handleStatusChange,
        handlePagination,
    };
};

export default useAssetFilter;