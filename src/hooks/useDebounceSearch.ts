import { useEffect, useState } from 'react';

import useDebounce from './useDebounce';

const useDebounceSearch = (setFilters: any, initialValue = '') => {
    const [searchText, setSearchText] = useState(initialValue);
    const debouncedSearchText = useDebounce(searchText, 300);

    const updateSearchText = (e: React.ChangeEvent<HTMLInputElement>) => {
        const clean = e.target.value
            .replace(
                /\p{Emoji_Presentation}|\p{Extended_Pictographic}|\p{Emoji_Modifier_Base}|\p{Emoji_Modifier}/gu,
                ''
            )
            .trimStart();
        if (clean === searchText) return;
        setSearchText(clean);
    };

    useEffect(() => {
        setFilters((prevFilters: any) => ({
            ...prevFilters,
            searchText: debouncedSearchText,
            page: 1,
        }));
    }, [setFilters, debouncedSearchText]);

    return {
        searchText,
        setSearchText,
        updateSearchText,
    };
};

export default useDebounceSearch;
