import { useCallback, useEffect, useState } from 'react';

import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { SuccessGenericResponse } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import {
    addGuideline,
    getPayentLink,
    getTemplate,
    paymentLink,
    updateGuideline,
} from '../api/index';
import { setPaymentLink, setpaymentLinkForm } from '../slices/InvoicesSlices';
import { Row, guidelineRequest } from '../types/guidelineTypes';
import { getpaymentlinkPayload } from '../types/paymentlinkType';

export default function useGuidelines(invoiceId?: number) {
    const { id, role } = useAppSelector(store => store.reducer.auth);
    const { Details } = useAppSelector(state => state.reducer.invoices);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState<Row[]>([]);

    const guidelineAdd = useCallback(
        async (payload: guidelineRequest & getpaymentlinkPayload, isViewPage?: boolean) => {
            setIsLoading(true);

            const response: any = await addGuideline({
                userId: id,
                userType: role,
                ...payload,
            });

            if (response) {
                if (Details?.paymentMode === 'payment link') {
                    const res = await paymentLink({
                        userId: id,
                        userType: role,
                        ...payload,
                    });
                    if (res && res.paymentLink) {
                        dispatch(setPaymentLink(res.paymentLink));
                        dispatch(setpaymentLinkForm(res));
                        navigate(`/${paths.invoice.index}/${paths.invoice.success}`);
                    }
                    return;
                }

                // Show success message and navigate
                dispatch(
                    showToast({
                        description: 'Guideline added successfully',
                        variant: 'success',
                    })
                );
                if (!isViewPage) {
                    navigate(`/${paths.invoice.index}/${paths.invoice.invoicehistory}`);
                }
            }
            setIsLoading(false);
        },
        [Details?.paymentMode, dispatch, id, navigate, role]
    );

    const guidelineUpdate = useCallback(
        async (payload: guidelineRequest) => {
            setIsLoading(true);
            const response: SuccessGenericResponse<any> | false = await updateGuideline({
                userId: id,
                userType: role,
                ...payload,
            });

            if (response !== false) {
                if (response.status) {
                    dispatch(
                        showToast({
                            description: 'Guideline updated successfully',
                            variant: 'success',
                        })
                    );
                }
            }
            setIsLoading(false);
        },
        [dispatch, id, role]
    );

    const templateData = useCallback(async () => {
        const response: any = await getTemplate({
            userId: id,
            userType: role,
        });

        if (response) {
            setData(response.rows);
        }
    }, [id, role]);

    const generatePaymentLink = useCallback(
        async (invoiceid: number) => {
            setIsLoading(true);
            const response: any = await getPayentLink({
                userId: id,
                userType: role,
                invoiceId: invoiceid,
            });

            if (response) {
                dispatch(setPaymentLink(response.link));
                dispatch(setpaymentLinkForm(response));
                navigate(`/${paths.invoice.index}/${paths.invoice.success}`);
                setIsLoading(false);
            }
        },
        [dispatch, id, navigate, role]
    );

    useEffect(() => {
        templateData();
    }, [templateData]);

    return { guidelineAdd, data, guidelineUpdate, generatePaymentLink, isLoading };
}
