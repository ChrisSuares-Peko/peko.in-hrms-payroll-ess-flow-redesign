import { useEffect, useState } from 'react';

import { DropDown } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { getPaymentGatewaysApi } from '../../api/paymentMethods';

// Gateway providers an admin can attach to a PAYMENT_GATEWAY row (Cashfree / CC Avenue / Razorpay).
const usePaymentGateways = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [gateways, setGateways] = useState<DropDown>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        getPaymentGatewaysApi({ userId: id, userType: role }).then(data => {
            if (!active) return;
            if (data) {
                setGateways(data.map(({ pgProvider, name }) => ({ value: pgProvider, label: name })));
            }
            setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [id, role]);

    return { gateways, loading };
};

export default usePaymentGateways;
