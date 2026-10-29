import { useCallback, useEffect, useState } from 'react';

import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { cancelPlan, fetchOneOrder } from '../../api';
import { ISubscriptionPlan } from '../../types/product';

const useManagePlan = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { role, id } = useAppSelector(s => s.reducer.auth);

    const [order, setOrder] = useState<ISubscriptionPlan | null>(null);
    const [isFetching, setIsFetching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!orderId) {
            navigate(-1);
            return;
        }

        const loadOrder = async () => {
            setIsFetching(true);
            const resp = await fetchOneOrder({ userId: id, userType: role, orderId });
            if (resp) {
                setOrder(resp.orderDetails);
            }
            setIsFetching(false);
        };

        loadOrder();
    }, [orderId, id, role, navigate]);

    const handleCancelPlan = useCallback(async () => {
        if (!order) return;
        setIsLoading(true);
        const resp = await cancelPlan({
            userId: id,
            userType: role,
            orderId: orderId as string,
        });
        if (resp) {
            setOrder(prev => (prev ? { ...prev, status: 'Cancelled' } : prev));
            dispatch(showToast({ variant: 'success', description: `plan cancelled successfully` }));
        }
        setIsLoading(false);
    }, [id, role, order, dispatch, orderId]);

    return { order, handleCancelPlan, isLoading, isFetching };
};

export default useManagePlan;
