import { useState, useCallback, useEffect } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { categoryListing } from '../api/index';
import { ICategoryListingCard, ICategoryListingResponse } from '../types/type';

export const useBusinessDocsListingApi = (
    searchKey: string,
    category: string,
    page: number,
    pageSize: number,
    sortBy: string,
    sortType: string
) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [categoryDetails, setCategoryDetails] = useState<ICategoryListingCard[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>();

    const getCategoryList = useCallback(async () => {
        const data: ICategoryListingResponse | false = await categoryListing({
            userId: id,
            userType: role,
            searchKey,
            category,
            page,
            pageSize,
            sortBy,
            sortType,
        });

        if (data) {
            const listingData = data;

            const arr = listingData?.documents?.map(item => ({
                title: item.documentName ?? '',
                documentUrl: item.documentUrl ?? '',
            }));

            setCount(listingData.totalCount);
            setCategoryDetails(arr);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [category, id, page, pageSize, role, searchKey, sortBy, sortType]);
    useEffect(() => {
        getCategoryList();
    }, [getCategoryList]);
    return { data: categoryDetails, isLoading, count };
};
