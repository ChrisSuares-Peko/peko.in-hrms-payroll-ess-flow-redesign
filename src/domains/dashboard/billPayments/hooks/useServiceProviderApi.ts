import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getServiceProvider } from '../api/index';
import { OptionsType, ServiceProviderResponse } from '../types/index';

export default function useServiceProviderApi(categoryName?: string) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [serviceProviderData, setServiceProviderData] = useState<OptionsType[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [searchText, setSearchText] = useState('');
    const pageSize = 100;

    const getServiceProviderList = useCallback(
        async ({
            page,
            search,
            append,
        }: {
            page: number;
            search: string;
            append: boolean;
        }) => {
            if (!categoryName) {
                setIsLoading(false);
                setIsLoadingMore(false);
                return;
            }
            if (append) setIsLoadingMore(true);
            else setIsLoading(true);

            const data: ServiceProviderResponse | false = await getServiceProvider({
                userId: id,
                userType: role,
                categoryName,
                page,
                itemsPerPage: pageSize,
                searchText: search,
            });

            if (data) {
                const providersData = data.billersArray?.map((provider: any) => ({
                    value: provider.billerId ?? '',
                    label: provider.billerName ?? '',
                    customerParams: Array.isArray(provider.billerInputParams?.paramInfo)
                        ? provider.billerInputParams.paramInfo
                        : [provider.billerInputParams?.paramInfo].filter(Boolean),
                    billerAdhoc: provider.billerAdhoc ?? '',
                    billerFetchRequiremet: provider.billerFetchRequiremet ?? '',
                    billerFetchRequirement: provider.billerFetchRequirement ?? '',
                    billerPaymentExactness: provider.billerPaymentExactness ?? '',
                    billerSupportBillValidation: provider.billerSupportBillValidation ?? '',
                    billerPaymentModes: provider.billerPaymentModes ?? undefined,
                    billerPaymentChannels: provider.billerPaymentChannels ?? undefined,
                }));

                setServiceProviderData(prev => {
                    if (!append) return providersData;
                    const merged = [...prev, ...providersData];
                    const uniqueByValue = new Map(merged.map(item => [item.value, item]));
                    return Array.from(uniqueByValue.values());
                });
                setCurrentPage(page);
                setHasMore((providersData?.length || 0) === pageSize);
            } else if (!append) {
                setServiceProviderData([]);
                setHasMore(false);
            }
            setIsLoading(false);
            setIsLoadingMore(false);
        },
        [id, role, categoryName]
    );

    const loadMoreServiceProviders = useCallback(() => {
        if (isLoading || isLoadingMore || !hasMore || !categoryName) return;
        getServiceProviderList({
            page: currentPage + 1,
            search: searchText,
            append: true,
        });
    }, [
        categoryName,
        currentPage,
        getServiceProviderList,
        hasMore,
        isLoading,
        isLoadingMore,
        searchText,
    ]);

    const handleServiceProviderSearch = useCallback(
        (search: string) => {
            setSearchText(search);
            getServiceProviderList({
                page: 1,
                search,
                append: false,
            });
        },
        [getServiceProviderList]
    );

    // Reset to the full unfiltered list. Used when the dropdown reopens after a stale search,
    // since AntD Select clears its internal search input on selection but does not fire onSearch('').
    const resetSearchIfDirty = useCallback(() => {
        if (searchText !== '') {
            setSearchText('');
            getServiceProviderList({ page: 1, search: '', append: false });
        }
    }, [searchText, getServiceProviderList]);

    useEffect(() => {
        if (!categoryName) {
            setServiceProviderData([]);
            return;
        }
        setCurrentPage(1);
        setSearchText('');
        setHasMore(true);
        getServiceProviderList({
            page: 1,
            search: '',
            append: false,
        });
    }, [categoryName, getServiceProviderList]);

    return {
        serviceProviderData,
        isLoading,
        isLoadingMore,
        hasMore,
        loadMoreServiceProviders,
        handleServiceProviderSearch,
        resetSearchIfDirty,
    };
}
