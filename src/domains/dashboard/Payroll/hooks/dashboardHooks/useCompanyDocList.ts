import { useState, useCallback, useEffect } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { categoryListing } from '../../api/dashBoardIndex';

export const useCompanyDocList = (
    searchKey: string,
    category: string,
    page: number,
    pageSize: number,
    sortBy: string,
    sortType: string
) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [categoryDetails, setCategoryDetails] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>();

    const getCompanyDocCategoryList = useCallback(async () => {
        const data: any | false = await categoryListing({
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

            const arr = listingData?.documents?.map((item: any) => ({
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
        getCompanyDocCategoryList();
    }, [getCompanyDocCategoryList]);
    return { data: categoryDetails, isLoading, count };
};
