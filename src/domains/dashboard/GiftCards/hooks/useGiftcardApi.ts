import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getGiftcards } from '../api/index';
import { GiftcardListResponse, GiftcardsTableData } from '../types/types';

export default function useGiftcardApi(
    searchText: string,
    page: number,
    limit: number,
    category: string,
    offset: number,
    categoryFilter: string = 'all'
) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [tableData, setTableData] = useState<GiftcardsTableData>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>(0);

    const getGiftCardList = useCallback(async () => {
        setIsLoading(true);
        const data: GiftcardListResponse | false = await getGiftcards({
            userId: id,
            userType: role,
            accessKeys: ["xoxoday","gift-card"],
            searchText,
            limit,
            page,
            category,
            categoryFilter,
            offset,
        });

        if (data) {
            const giftCardData = data as GiftcardListResponse;
            const arr = giftCardData?.rows?.map(giftCard => ({
                name: giftCard.product_name ?? '',
                description: giftCard.description ?? '',
                image: giftCard.image ?? '',
                id: giftCard.id ?? '',
                usageType: giftCard.usageType ?? '',
                serviceOperator:giftCard?.serviceOperator??''

            }));
            setTableData(arr);
            setCount(giftCardData.count); // Set the count based on the array length
        }
        setIsLoading(false); // Reset loading state after processing data
    }, [category, categoryFilter, id, limit, offset, page, role, searchText]);

    useEffect(() => {
        getGiftCardList();
    }, [getGiftCardList]);

    return { data: tableData, isLoading, count };
}
