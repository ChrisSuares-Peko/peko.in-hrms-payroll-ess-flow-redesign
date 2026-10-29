import { Flex } from 'antd';

import { useCategoryPageContext } from '../../../contexts/CategoryPageContext';
import SearchInput from '../../common/SearchInput';
import SortSelect from '../../common/SortSelect';

const SearchSortFilter = () => {
    const { searchText, updateSearchText, handleSearch, filters, sortList, isLoading, handleSort } =
        useCategoryPageContext();

    return (
        <Flex className={`${isLoading ? 'mt-20' : 'mt-9'} sm:flex-row gap-2 w-full`}>
            {isLoading ? null : (
                <>
                    <SearchInput
                        value={searchText}
                        onChange={updateSearchText}
                        onClickHandler={handleSearch}
                    />
                    <SortSelect
                        value={filters.sort}
                        options={sortList}
                        onChange={value => handleSort(value)}
                    />
                </>
            )}
        </Flex>
    );
};

export default SearchSortFilter;
