import { useCallback, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import { paymentLink } from '../api/index';
import { setPaymentLink, setpaymentLinkForm } from '../slices/InvoicesSlices';

export default function useGetPaymentlink() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [getData, setData] = useState<any>();

    const getPaymentLink = useCallback(
        async (payload: any) => {
            setIsLoading(true);
            const res: any = await paymentLink({
                userId: id,
                userType: role,
                ...payload,
            });
            if (res) {
                setData(res);
                dispatch(setPaymentLink(res.paymentLink));
                dispatch(setpaymentLinkForm(res));
                navigate(`/${paths.invoice.index}/${paths.invoice.success}`);
                setIsLoading(false);
                return res;
            }
            setIsLoading(false);
            return false;
        },
        [dispatch, id, navigate, role]
    );

    return { getPaymentLink, getData, isLoading };
}
