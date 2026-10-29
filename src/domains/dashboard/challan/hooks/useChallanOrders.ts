import { useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getChallanOrders } from '../api/index';
import { ChallanOrder } from '../types/index';

// Past challan payment orders for the logged-in corporate (Order History screen).
// Shared by both the Bill Payments and Turbo entry points.
export default function useChallanOrders() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [orders, setOrders] = useState<ChallanOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let active = true;
        (async () => {
            setIsLoading(true);
            const resp = await getChallanOrders({ userId: id, userType: role });
            if (active) {
                setOrders(Array.isArray(resp) ? resp : []);
                setIsLoading(false);
            }
        })();
        return () => {
            active = false;
        };
    }, [id, role]);

    return { orders, isLoading };
}
