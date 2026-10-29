import { useState, useCallback, useEffect } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { AllChequeBooks } from '../../api/financialDoc';
import { ChequeBookListingResponse } from '../../types/financials/index';

export const useGetAllChequeBookListApi = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [chequeBookListData, setChequeBookListData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const getChequeBookList = useCallback(async () => {
        setIsLoading(true);
        const data: ChequeBookListingResponse | false = await AllChequeBooks({
            userId: id,
            userType: role,
        });

        if (data) {
            const arr = data?.result?.map(item => ({
                bookId: item.bookId ?? '',
                accountName: item.accountName ?? '',
                accountNumber: item.accountNumber ?? '',
                bankName: item?.bankName ?? '',
                accountBalance: item?.accountBalance ?? '',
                status: item?.status ?? '',
                action: '',
                id: item?.id ?? '',
                document: item?.document ?? '',
                documentAvailability: item.document ? 'Available' : 'NA',
            }));
            setChequeBookListData(arr);
        }
        setIsLoading(false);
    }, [id, role]);
    useEffect(() => {
        getChequeBookList();
    }, [getChequeBookList]);

    const generateChequeBooksDropdown = (data: any[]) => {
        const excludedStatuses = ['Exhausted', 'Lost', 'Cancelled', 'Pending', 'Expired'];

        return data
            .filter(book => !excludedStatuses.includes(book.status))
            .map(book => ({
                value: book.id,
                label: `${book.bookId}, ${book.accountName}, ${book.bankName}`,
            }));
    };

    return {
        data: chequeBookListData,
        loading: isLoading,
        generateChequeBooksDropdown,
    };
};
