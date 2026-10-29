import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getInvoice } from '../api/index';
import { InvoiceResponse } from '../types/index';

export default function useGetInvoiceDetails(invoice: any) {
    const { id, role } = useAppSelector(store => store.reducer.auth);
    const [data, setData] = useState<
        | {
              id: number;
              recipientDetails: any;
              invoiceDetails: any;
              productDetails: any;
              paymentDetails: any;
              comments: string;
              termsConditions: string;
              updatedAt: string;
              createdAt: string;
              invoiceId: number;
          }
        | undefined
    >();
    const [dataSource, setDataSource] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const getInvoiceDetails = useCallback(async () => {
        const payload = {
            userId: id,
            userType: role,
            invoiceId: invoice,
        };
        const resp: InvoiceResponse | false = await getInvoice(payload);

        if (resp) {
            const parsedResp = {
                id: resp.id,
                recipientDetails: JSON.parse(resp.recipientDetails),
                invoiceDetails: JSON.parse(resp.invoiceDetails),
                productDetails: JSON.parse(resp.productDetails),
                paymentDetails: JSON.parse(resp.paymentDetails),
                paymentMode: resp.paymentMode,
                comments: resp.comments,
                termsConditions: resp.termsConditions,
                updatedAt: resp.updatedAt,
                createdAt: resp.createdAt,
                invoiceId: resp.invoiceId,
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
    }, [id, role, invoice]);

    useEffect(() => {
        getInvoiceDetails();
    }, [getInvoiceDetails]);
    return { data, dataSource, isLoading };
}
