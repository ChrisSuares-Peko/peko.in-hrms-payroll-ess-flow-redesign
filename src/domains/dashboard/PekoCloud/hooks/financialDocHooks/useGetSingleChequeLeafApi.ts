import { useCallback, useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import { getSingleChequeLeaf } from '../../api/financialDoc';
import { SingleChequeLeafResponse } from '../../types/financials';

export default function GetSingleChequeLeafDetails(chequeLeafId: string) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [chequeLeafDetails, setChequeLeafDetails] = useState<SingleChequeLeafResponse>();
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const getChequeLeafDetails = useCallback(async () => {
        const data: SingleChequeLeafResponse | false = await getSingleChequeLeaf({
            userId: id,
            userType: role,
            chequeLeafId,
        });
        if (data) {
            const chequeDetails = data as SingleChequeLeafResponse;
            setChequeLeafDetails(chequeDetails);
            setIsLoading(false);
        } else {
            navigate(`/${paths.pekoCloud.index}`);
            dispatch(
                showToast({
                    description: 'Cheque leaf not found',
                    variant: 'error',
                })
            );
            setIsLoading(false);
        }
    }, [chequeLeafId, dispatch, id, navigate, role]);

    useEffect(() => {
        getChequeLeafDetails();
    }, [getChequeLeafDetails]);

    return { chequeLeafDetails, isLoading, getChequeLeafDetails };
}
