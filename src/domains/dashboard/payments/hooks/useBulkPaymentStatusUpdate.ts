import React, { useEffect, useRef } from 'react';

import Pusher from 'pusher-js';

import { VITE_PUSHER_APPKEY } from '@src/config-global';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { setUserInfo } from '@src/slices/userSlice';

import { getBulkPaymentStatusApi } from '../api/index';
import { BulkPaymentResp, BulkPaymentStatusResp } from '../types/index';

const POLL_INTERVAL_MS = 5000;

const useBulkPaymentStatusUpdate = (
    id: number,
    role: string,
    batchId: number,
    bulkPaymentData: BulkPaymentResp[],
    setBulkPaymentData: React.Dispatch<React.SetStateAction<BulkPaymentResp[]>>
) => {
    const dispatch = useAppDispatch();
    const { user } = useAppSelector(state => state.reducer.user);
    const pusherRef = useRef<Pusher | null>(null);
    const allDoneRef = useRef(false);

    // Interval polling — fires immediately then every POLL_INTERVAL_MS.
    // Stops automatically once every item reaches a terminal state (SUCCESS / FAILURE).
    // Acts as a reliable fallback for missed or delayed Pusher events caused by
    // Google Cloud Pub/Sub processing latency.
    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval> | undefined;

        if (batchId) {
            allDoneRef.current = false;

            const poll = async () => {
                if (allDoneRef.current) return;
                const resp: BulkPaymentStatusResp | false = await getBulkPaymentStatusApi(
                    { userId: id, userType: role },
                    batchId
                );
                if (resp && resp.bulkPaymentStatus && Array.isArray(resp.bulkPaymentStatus)) {
                    setBulkPaymentData(prev => {
                        const updated = prev.map(item => {
                            const found = resp.bulkPaymentStatus.find(
                                v => v.corporateTxnId === item.corporateTxnId
                            );
                            return found?.status ? { ...item, paymentStatus: found.status } : item;
                        });
                        allDoneRef.current = updated.every(
                            item =>
                                item.paymentStatus === 'SUCCESS' || item.paymentStatus === 'FAILURE'
                        );
                        return updated;
                    });
                }
            };

            poll();
            intervalId = setInterval(poll, POLL_INTERVAL_MS);
        }

        return () => clearInterval(intervalId);
    }, [batchId, id, role, setBulkPaymentData]);

    // Pusher — primary real-time update path in staging / production.
    // Set up once; does not depend on batchId since it matches by corporateTxnId.
    useEffect(() => {
        if (!pusherRef.current) {
            pusherRef.current = new Pusher(VITE_PUSHER_APPKEY, {
                cluster: 'ap2',
                forceTLS: true,
            });
        }
        const pusher = pusherRef.current;
        const subscribedChannel = pusher.subscribe('update-bulk-payment-status');

        const eventHandler = (data: any) => {
            if (Number(data?.credentialId) === id) {
                const { corporateTxnId, status, walletBalance } = data.message;
                dispatch(setUserInfo({ user: { ...user!, balance: walletBalance } }));
                setBulkPaymentData(prevBulkPaymentData =>
                    prevBulkPaymentData.map(item =>
                        item?.corporateTxnId === corporateTxnId
                            ? { ...item, paymentStatus: status }
                            : item
                    )
                );
            }
        };

        subscribedChannel.bind('real-time-notification', eventHandler);

        return () => {
            subscribedChannel.unbind('real-time-notification', eventHandler);
            subscribedChannel.unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
};

export default useBulkPaymentStatusUpdate;
