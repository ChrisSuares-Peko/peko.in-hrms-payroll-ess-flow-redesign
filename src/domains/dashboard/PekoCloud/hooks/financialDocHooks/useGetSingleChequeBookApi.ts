import { useCallback, useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import { getSingleChequeBook } from '../../api/financialDoc';
import { SingleChequeBookResponse } from '../../types/financials';

export default function GetSingleChequeBookDetails(chequeBookId: string) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [chequeBookDetails, setChequeBookDetails] = useState<SingleChequeBookResponse>();
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const getChequeBookDetails = useCallback(async () => {
        const data: SingleChequeBookResponse | false = await getSingleChequeBook({
            userId: id,
            userType: role,
            chequeBookId,
        });
        if (data) {
            const assetDetailData = data as SingleChequeBookResponse;
            setChequeBookDetails(assetDetailData);
            setIsLoading(false);
        } else {
            navigate(`/${paths.pekoCloud.index}`);
            dispatch(
                showToast({
                    description: 'Cheque book not found',
                    variant: 'error',
                })
            );
            setIsLoading(false);
        }
    }, [chequeBookId, dispatch, id, navigate, role]);

    useEffect(() => {
        getChequeBookDetails();
    }, [getChequeBookDetails]);

    return { chequeBookDetails, isLoading, getChequeBookDetails };
}
