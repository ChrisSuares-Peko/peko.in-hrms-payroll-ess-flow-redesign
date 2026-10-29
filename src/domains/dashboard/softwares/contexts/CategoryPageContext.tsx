import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import { useNavigate, useSearchParams } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';
import { removeEmoji } from '@utils/regex';

import { fetchParentCategoryProducts } from '../api';
import useNavigateToCategoryPageAndUpdateStore from '../hooks/category/useNavigateToCategoryPageAndUpdateStore';
import useGetCategories from '../hooks/home/useGetCategories';
import { setQueryParams } from '../slice/softwareSlice';
import { FiltersType, ICategoryProductsResponse, IsoftwareCategory } from '../types';

export type CategoryPageContextType = {
    categoryList: IsoftwareCategory[];
    labeledCategories: { label: string; value: string; icon: string }[];
    categoryIsLoading: boolean;
    currentCategory: string;
    handleCategoryChange: (value: string) => void;
    categoryProducts: ICategoryProductsResponse | null;
    isLoading: boolean;
    filters: FiltersType;
    setFilters: React.Dispatch<React.SetStateAction<FiltersType>>;
    searchText: string;
    updateSearchText: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleSearch: () => void;
    sortList: { label: string; value: string }[];
    noProduct: boolean;
    handlePagination: (page: number, pageSize: number) => void;
    handleSort: (value: string) => void;
};

const CategoryPageContext = createContext<CategoryPageContextType | null>(null);

export const useCategoryPageContext = () => {
    const context = useContext(CategoryPageContext);
    if (!context) {
        throw new Error('useCategoryPageContext must be used within CategoryPageProvider');
    }
    return context;
};

type Props = {
    children: React.ReactNode;
};

export const CategoryPageProvider = ({ children }: Props) => {
    const { isLoading: categoryIsLoading } = useGetCategories();

    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const weburl = searchParams.get('weburl');

    const { categoryList, queryParams } = useAppSelector(state => state.reducer.software);
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [categoryProducts, setCategoryProducts] = useState<ICategoryProductsResponse | null>(
        null
    );

    const [isLoading, setIsLoading] = useState<boolean>(true);

    const initialPage = Number(searchParams.get('page')) || 1;
    const initialLimit = Number(searchParams.get('limit')) || 12;
    const initialSort = searchParams.get('sort') || 'rating';

    const [filters, setFilters] = useState<FiltersType>({
        page: initialPage,
        limit: initialLimit,
        sort: initialSort,
    });

    const [searchText, setSearchText] = useState('');
    const [noProduct, setNoProduct] = useState(false);

    const { navigateAndUpdateStore } = useNavigateToCategoryPageAndUpdateStore();

    // ---------------- CATEGORY ----------------

    const currentCategory = weburl || queryParams.category || '';

    useEffect(() => {
        if (!currentCategory) {
            navigate(paths.softwares.index, { replace: true });
        }
    }, [currentCategory, navigate]);

    useEffect(() => {
        if (!currentCategory) return;

        const pageParam = searchParams.get('page');
        const sortParam = searchParams.get('sort');
        const limitParam = searchParams.get('limit');

        if (!pageParam || !sortParam || !limitParam) {
            const params = new URLSearchParams();

            params.set('weburl', currentCategory);
            params.set('page', String(initialPage));
            params.set('limit', String(initialLimit));
            params.set('sort', initialSort);

            setSearchParams(params, { replace: true });
        }
    }, [currentCategory, initialLimit, initialPage, initialSort, searchParams, setSearchParams]);

    useEffect(() => {
        if (!currentCategory) return;

        const params = new URLSearchParams();

        params.set('weburl', currentCategory);
        params.set('page', String(filters.page));
        params.set('limit', String(filters.limit));
        params.set('sort', filters.sort ?? 'rating');

        setSearchParams(params, { replace: true });
    }, [filters.page, filters.limit, filters.sort, currentCategory, setSearchParams]);

    const labeledCategories = useMemo(
        () =>
            categoryList.map(category => ({
                label: category.name,
                value: category.weburl,
                icon: category.icon,
            })),
        [categoryList]
    );

    const handleCategoryChange = useCallback(
        (value: string) => {
            navigateAndUpdateStore(value);
        },
        [navigateAndUpdateStore]
    );

    // ---------------- PRODUCTS FETCH ----------------

    useEffect(() => {
        if (!currentCategory) return;

        const fetchCategoryProducts = async () => {
            setIsLoading(true);

            const data = await fetchParentCategoryProducts({
                userId: id,
                userType: role,
                parentCategory: currentCategory,
                page: filters.page,
                limit: filters.limit,
                sortBy: filters.sort,
            });

            if (data && data.products && data.products.length > 0) {
                setNoProduct(false);
                setCategoryProducts(data);

                window.scrollTo({ top: 0 });
                const container = document.getElementById('myContainer');
                container?.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                dispatch(
                    showToast({
                        description:
                            'No products were found in this category. Please try another category or refresh the page.',
                        variant: 'error',
                    })
                );
                setNoProduct(true);
            }

            setIsLoading(false);
        };

        fetchCategoryProducts();
    }, [currentCategory, id, role, filters.page, filters.limit, filters.sort, dispatch]);

    // ---------------- SEARCH ----------------

    const updateSearchText = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value.replace(removeEmoji, '');

            if (value.length <= 100) {
                setSearchText(value);
            } else {
                dispatch(
                    showToast({
                        description: 'Please limit your search query to 100 words or fewer.',
                        variant: 'error',
                    })
                );
            }
        },
        [dispatch]
    );

    const handleSearch = useCallback(() => {
        const trimmed = searchText.trim();

        if (trimmed.length < 3) {
            dispatch(
                showToast({
                    description: 'Please provide a search with at least 3 letters',
                    variant: 'error',
                })
            );
            return;
        }

        dispatch(
            setQueryParams({
                search: trimmed,
                parentCategorySlug: currentCategory,
            })
        );

        navigate(`${paths.softwares.searchResults}?query=${encodeURIComponent(trimmed)}`);
    }, [searchText, dispatch, navigate, currentCategory]);

    const isInitialMount = useRef(true);
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return undefined;
        }

        const trimmed = searchText.trim();
        if (trimmed.length < 3) return undefined;

        const timer = setTimeout(() => {
            dispatch(setQueryParams({ search: trimmed, parentCategorySlug: currentCategory }));
            navigate(`${paths.softwares.searchResults}?query=${encodeURIComponent(trimmed)}`);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchText, dispatch, navigate, currentCategory]);

    // ---------------- SORT LIST ----------------

    const sortList = useMemo(
        () => [
            { label: 'Rating', value: 'rating' },
            { label: 'Name', value: 'name' },
        ],
        []
    );

    const handleSort = useCallback((value: string) => {
        setFilters(prev => ({
            ...prev,
            sort: value,
            page: 1,
        }));
    }, []);

    // ---------------- PAGINATION ----------------
    const handlePagination = useCallback((page: number, pageSize: number) => {
        setFilters(prev => ({
            ...prev,
            page,
            limit: pageSize || prev.limit,
        }));
    }, []);

    const value = useMemo(
        () => ({
            categoryList,
            labeledCategories,
            currentCategory,
            handleCategoryChange,
            categoryProducts,
            isLoading,
            filters,
            setFilters,
            searchText,
            updateSearchText,
            handleSearch,
            sortList,
            categoryIsLoading,
            noProduct,
            handlePagination,
            handleSort,
        }),
        [
            categoryList,
            labeledCategories,
            currentCategory,
            handleCategoryChange,
            categoryProducts,
            isLoading,
            filters,
            searchText,
            sortList,
            categoryIsLoading,
            updateSearchText,
            handleSearch,
            noProduct,
            handlePagination,
            handleSort,
        ]
    );

    return <CategoryPageContext.Provider value={value}>{children}</CategoryPageContext.Provider>;
};
