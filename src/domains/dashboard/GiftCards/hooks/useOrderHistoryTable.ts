/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect, useState } from 'react';

import { debounce } from 'lodash';

import { useAppSelector } from '@src/hooks/store';

import { getOrderHistoryTable } from '../api/index';
import { GiftCardOrderTypes } from '../types/employee';
import { OrderHistoryListResponse, OrderHistoryTableData } from '../types/types';

export const useOrderHistoryTable = (
    draw: number,
    start: number,
    length: number,
    search: string
) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [tableData, setTableData] = useState<OrderHistoryTableData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>();
    const [previousSearch, setPreviousSearch] = useState(search);
    const getOrderHistoryList = useCallback(async () => {
        setIsLoading(true);
        const data: OrderHistoryListResponse | false = await getOrderHistoryTable({
            userId: id,
            userType: role,
            draw,
            start,
            length,
            search,
            from: '',
            to: '',
        });

        if (data) {
            const orderHistoryData = data as OrderHistoryListResponse;

            const arr = orderHistoryData?.result?.map(orderHistory => {
                const response = orderHistory.order;
                let orderResponse
                if(response.orderResponse){

                     orderResponse = JSON.parse(response.orderResponse);
                }
                console.log("orderResponse here",orderResponse)
                 const selectedCard = orderResponse?.giftCardDetails;
                 const rawOrderType = orderResponse?.orderType;
                 console.log("orderType",rawOrderType)
                 let orderType: string;
                if (rawOrderType === GiftCardOrderTypes.BULKPURCHASE) {
                    orderType = 'Bulk Purchase';
                } else if (rawOrderType === GiftCardOrderTypes.BUYFOREMPLOYEE) {
                    orderType = 'Buy for Employees';
                } else if (rawOrderType === GiftCardOrderTypes.BUYFORSELF) {
                    orderType = 'Buy for Self';
                } else if (rawOrderType === GiftCardOrderTypes.BUYFOROTHER) {
                    orderType = 'Buy for Other';
                } else {
                    orderType = 'N/A';
                }
                return {
                    txnId: response?.corporateTxnId ?? '',
                    date: response?.transactionDate ?? '',
                    giftCardName: orderResponse?.giftCardDetails.product_name,
                    paymentMode: response?.paymentMode ?? '',
                     orderType: orderType ?? '',
                    status: response?.status ?? '',
                    amount: response?.amountInINR ?? '',

                    quantity: orderResponse?.number_of_items ?? orderResponse?.giftCardDetails.quantity ?? 0,
                     formData: {
                        amount: selectedCard?.individualCardPrice ?? '',
                        quantity: orderResponse?.number_of_items ?? orderResponse?.giftCardDetails.quantity ?? '',
                        orderType: rawOrderType ?? '',
                    },
                    addressDetails: {
                        receiverFirstName: orderResponse?.receiverName ?? '',
                        receiverEmail: orderResponse?.receiverEmail ?? '',
                        senderName: orderResponse?.senderName ?? '',
                        message: orderResponse?.message ?? '',
                        employee: orderResponse?.employee ?? [],
                    },
                    productDetails: {
                        id: selectedCard?.id,
                        product_id: selectedCard?.product_id,
                        product_name: selectedCard?.product_name,
                        product_image: selectedCard?.image,
                        accessKey: orderResponse?.accesskey,
                        serviceOperatorId: selectedCard?.serviceOperatorId ?? orderResponse?.serviceOperatorId,
                    },
                };
            });
            setCount(orderHistoryData.totalData);
            setTableData(arr);
            setIsLoading(false);
        }
        setIsLoading(false);
    }, [draw, id, length, role, search, start]);

    const debouncedGetOrderHistoryList = useCallback(
        debounce(() => {
            getOrderHistoryList();
            setPreviousSearch(search);
        }, 500),
        [getOrderHistoryList, search]
    );

    useEffect(() => {
        if (previousSearch !== search) {
            debouncedGetOrderHistoryList();
        } else {
            getOrderHistoryList();
        }
        return () => {
            debouncedGetOrderHistoryList.cancel();
        };
    }, [getOrderHistoryList, search, debouncedGetOrderHistoryList, length, start]);

    return { data: tableData, isLoading, count };
};
