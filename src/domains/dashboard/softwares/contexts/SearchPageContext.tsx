import {
    createContext,
    useContext,
    useEffect,
    useState,
    useMemo,
    useCallback,
    useRef,
    ReactNode,
} from 'react';

import { useNavigate, useSearchParams } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';
import { removeEmoji } from '@utils/regex';

import { fetchSearchProducts } from '../api';
import useFromWhere from '../hooks/general/useFromWhere';
import { setQueryParams } from '../slice/softwareSlice';
import { IProductCard, ISearchProductRequestPayload } from '../types';

type SearchResultContextType = {
    query: string;
    products: IProductCard[];
    isLoading: boolean;
    productsCount: number;
    searchHandler: () => void;
};

type SearchInputContextType = {
    searchText: string;
    updateSearchText: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const SearchResultContext = createContext<SearchResultContextType | null>(null);
const SearchInputContext = createContext<SearchInputContextType | null>(null);

export const useSearchResultContext = () => {
    const context = useContext(SearchResultContext);
    if (!context) {
        throw new Error('useSearchResultContext must be used inside SearchPageProvider');
    }
    return context;
};

export const useSearchInputContext = () => {
    const context = useContext(SearchInputContext);
    if (!context) {
        throw new Error('useSearchInputContext must be used inside SearchPageProvider');
    }
    return context;
};

export const SearchPageProvider = ({ children }: { children: ReactNode }) => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const { role, id } = useAppSelector(state => state.reducer.auth);
    const { queryParams } = useAppSelector(state => state.reducer.software);

    const query = searchParams.get('query') ?? queryParams.search ?? '';
    const parentCategorySlug =
        searchParams.get('parentCategorySlug') ?? queryParams.parentCategorySlug ?? '';

    const [products, setProducts] = useState<IProductCard[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchText, setSearchText] = useState(query);

    const fromWhere = useFromWhere(2);

    const searchTextRef = useRef(searchText);
    useEffect(() => {
        searchTextRef.current = searchText;
    }, [searchText]);

    useEffect(() => {
        if (!query) {
            navigate(paths.softwares.index, { replace: true });
        }
    }, [query, navigate]);

    useEffect(() => {
        setSearchText(query);
    }, [query]);

    useEffect(() => {
        if (!query) return;

        const fetchResults = async () => {
            setIsLoading(true);

            const payload: ISearchProductRequestPayload = {
                userId: id,
                userType: role,
                query,
                ...(parentCategorySlug && { parentCategorySlug }),
            };

            const data = await fetchSearchProducts(payload);

            if (data && data?.products) setProducts(data.products);

            setIsLoading(false);
        };

        fetchResults();
    }, [query, id, role, parentCategorySlug]);

    const searchHandler = useCallback(() => {
        const trimmedQuery = searchTextRef.current.trim();

        if (!trimmedQuery) return;

        const params = new URLSearchParams();
        params.set('query', trimmedQuery);

        if (parentCategorySlug) {
            params.set('parentCategorySlug', parentCategorySlug);
        }

        dispatch(setQueryParams({ search: trimmedQuery, parentCategorySlug }));

        if (fromWhere === paths.softwares.index) {
            navigate(
                `/${paths.softwares.index}/${paths.softwares.searchResults}?${params.toString()}`,
                { replace: true }
            );
        } else if (fromWhere === paths.softwares.category) {
            navigate(
                `/${paths.softwares.index}/${paths.softwares.category}/${paths.softwares.searchResults}?${params.toString()}`,
                { replace: true }
            );
        }
    }, [dispatch, fromWhere, navigate, parentCategorySlug]);

    const updateSearchText = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value.replace(removeEmoji, '');

            if (value.length > 100) {
                dispatch(
                    showToast({
                        description: 'Please limit your search query to 100 characters or fewer.',
                        variant: 'error',
                    })
                );
                return;
            }

            if (!value.trim()) {
                setProducts([]);
            }

            setSearchText(value);
        },
        [dispatch]
    );

    useEffect(() => {
        if (searchText === query) return undefined;

        const trimmed = searchText.trim();
        if (trimmed.length < 3) return undefined;

        const timer = setTimeout(() => {
            searchHandler();
        }, 500);

        return () => clearTimeout(timer);
    }, [searchText, query, searchHandler]);

    const searchResultValue = useMemo(
        () => ({
            query,
            products,
            isLoading,
            productsCount: products.length,
            searchHandler,
        }),
        [query, products, isLoading, searchHandler]
    );

    const searchInputValue = useMemo(
        () => ({
            searchText,
            updateSearchText,
        }),
        [searchText, updateSearchText]
    );

    return (
        <SearchResultContext.Provider value={searchResultValue}>
            <SearchInputContext.Provider value={searchInputValue}>
                {children}
            </SearchInputContext.Provider>
        </SearchResultContext.Provider>
    );
};
