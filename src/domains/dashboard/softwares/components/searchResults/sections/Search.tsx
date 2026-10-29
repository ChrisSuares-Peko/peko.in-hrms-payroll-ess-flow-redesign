import { useSearchInputContext, useSearchResultContext } from '../../../contexts/SearchPageContext';
import SearchInput from '../../common/SearchInput';

const Search = () => {
    const { searchText, updateSearchText } = useSearchInputContext();
    const { searchHandler } = useSearchResultContext();
    return (
        <SearchInput
            value={searchText}
            onChange={updateSearchText}
            onClickHandler={searchHandler}
            maxLength={100}
        />
    );
};

export default Search;
