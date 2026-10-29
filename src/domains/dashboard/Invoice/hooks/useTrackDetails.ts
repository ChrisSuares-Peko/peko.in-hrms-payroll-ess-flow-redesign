import { useCallback, useEffect, useState } from 'react';

import { useDispatch } from 'react-redux';

import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getInvoice, paymentLink } from '../api/index';
import { getpaymentlinkPayload } from '../types/paymentlinkType';

export default function useTrackDetails(Invoiceid: number) {
    const { id, role } = useAppSelector(store => store.reducer.auth);
    const dispatch = useDispatch();
    const [data, setData] = useState<any>();
    const [dataSource, setDataSource] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isLoadingPaymentLink, setIsLoadingPaymentLink] = useState<boolean>(false);
    const getInvoiceDetails = useCallback(async () => {
        setIsLoading(true);
        const payload = {
            userId: id,
            userType: role,
            invoiceId: Invoiceid,
        };

        const resp: any = await getInvoice(payload);
        if (resp) {
            const parsedResp = {
                id: resp.id,
                recipientDetails: JSON.parse(resp.recipientDetails),
                invoiceDetails: JSON.parse(resp.invoiceDetails),
                productDetails: JSON.parse(resp.productDetails),
                paymentDetails: JSON.parse(resp.paymentDetails),
                comments: resp.comments,
                termsConditions: resp.termsConditions,
                updatedAt: resp.updatedAt,
                createdAt: resp.createdAt,
                invoiceId: resp.invoiceId,
                paymentMode: resp.paymentMode,
                status: resp.status,
                dueDate: resp.dueDate,
                amount: resp.amount,
                paymentLink: resp.paymentLink,
            };
            setData(parsedResp);

            if (parsedResp.productDetails) {
                const arr = parsedResp?.productDetails?.map((product: any, index: number) => ({
                    key: index.toString(),
                    name: {
                        firstRow: product.item,
                        secondRow: '', // Add the appropriate value here if needed
                    },
                    quantity: product.quantity,
                    price: product.price,
                    amount: product.price * product.quantity,
                }));
                setDataSource([...arr]);
            }
        }
        setIsLoading(false);
    }, [id, role, Invoiceid]);

    const generatePaymentLink = async () => {
        setIsLoadingPaymentLink(true);
        const payload: getpaymentlinkPayload & { invoiceId: number } = {
            full_name: data.recipientDetails.customerName,
            email: data.recipientDetails.customerEmail,
            phone_number: data.recipientDetails.customerPhone,
            amount: data.amount,
            notification: 'EML',
            invoiceId: data.id,
            expires_at: 24,
            purpose_message: 'Invoice payment',
        };
        const res = await paymentLink({
            userId: id,
            userType: role,
            ...payload,
        });
        if (res && res.paymentLink) {
            dispatch(
                showToast({
                    description: 'Payment link generated successfully',
                    variant: 'success',
                })
            );
            getInvoiceDetails();
        }
        setIsLoadingPaymentLink(false);
    };

    useEffect(() => {
        getInvoiceDetails();
    }, [getInvoiceDetails]);
    return {
        trackerData: data,
        dataSource,
        Loading: isLoading,
        generatePaymentLink,
        isLoadingPaymentLink,
    };
}
