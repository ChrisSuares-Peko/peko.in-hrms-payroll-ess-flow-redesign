import { useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import { invoice } from '../api/index';
import { setInvoiceResponse } from '../slices/InvoicesSlices';
import { BasicDetailsTypes, resetForm } from '../types/index';

export default function useInvoiceApi() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const handleInvoice = async (payload: BasicDetailsTypes & resetForm) => {
        setIsLoading(true);

        const res = await invoice({ ...payload, userId: id, userType: role });
        dispatch(setInvoiceResponse(res));

        if (res) {
            navigate(paths.invoice.invoicedetails);
        }
        setIsLoading(false);
    };

    return { handleInvoice, isLoading };
}
