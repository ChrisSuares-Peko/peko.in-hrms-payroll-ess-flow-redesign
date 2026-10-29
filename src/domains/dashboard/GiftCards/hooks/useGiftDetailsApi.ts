import { useCallback, useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import { getGiftDetails } from '../api/index';
import { GiftCardDetailResponse } from '../types/types';

export default function GetGiftDetails(giftCardID: string) {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [giftDetails, setGiftDetails] = useState<GiftCardDetailResponse>();
    const [isLoading, setIsLoading] = useState(true);

    const getCardDetails = useCallback(async () => {
        const data = await getGiftDetails({
            userId: id,
            userType: role,
            cardID: giftCardID,
        });

        if (data) {
            const giftCardDetailData = data;
            setGiftDetails(giftCardDetailData);
            setIsLoading(false);
        } else {
            navigate(`/${paths.giftcards.index}`);
            dispatch(
                showToast({
                    description: 'Product not found',
                    variant: 'error',
                })
            );
            setIsLoading(false);
        }
    }, [id, role, giftCardID, navigate, dispatch]);

    useEffect(() => {
        getCardDetails();
    }, [getCardDetails]);

    return { data: giftDetails, isLoading };
}
