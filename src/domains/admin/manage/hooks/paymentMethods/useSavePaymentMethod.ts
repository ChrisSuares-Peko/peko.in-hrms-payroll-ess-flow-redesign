import { useCallback, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    createPaymentMethodsByService,
    updatePaymentMethodsByService,
} from '../../api/paymentMethods';
import {
    PaymentMethodFormValues,
    PaymentMethodLimits,
    PaymentMethodType,
} from '../../types/paymentMethods';
import { toLimitAmount } from '../../utils/paymentMethods';

export const toPaymentMethodPayload = (values: PaymentMethodFormValues) => {
    const paymentMethod = values.paymentMethod as PaymentMethodType;
    const limits: PaymentMethodLimits = {
        limitPerTransaction: toLimitAmount(values.limitPerTransaction),
        limitPerDay: toLimitAmount(values.limitPerDay),
        limitPerMonth: toLimitAmount(values.limitPerMonth),
    };
    return {
        partnerId: values.partnerId === 'default' ? null : Number(values.partnerId),
        paymentMethod,
        pgProvider: paymentMethod === 'PAYMENT_GATEWAY' ? values.pgProvider : null,
        services: values.services.map(Number),
        limits,
    };
};

type Props = {
    onSaved: () => void;
};

const useSavePaymentMethod = ({ onSaved }: Props) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isSaving, setIsSaving] = useState(false);
    const dispatch = useAppDispatch();

    const createPaymentMethod = useCallback(
        async (values: PaymentMethodFormValues) => {
            setIsSaving(true);
            const { limits, ...payload } = toPaymentMethodPayload(values);
            const data = await createPaymentMethodsByService({
                userId: id,
                userType: role,
                ...payload,
                ...limits,
            });
            setIsSaving(false);
            if (data) {
                onSaved();
                dispatch(showToast({ description: 'Payment method added', variant: 'success' }));
            }
        },
        [id, role, dispatch, onSaved]
    );

    const updatePaymentMethod = useCallback(
        async (paymentMethodId: number, values: PaymentMethodFormValues) => {
            setIsSaving(true);
            const data = await updatePaymentMethodsByService({
                userId: id,
                userType: role,
                rowIdToUpdate: paymentMethodId,
                ...toPaymentMethodPayload(values),
            });
            setIsSaving(false);
            if (data) {
                onSaved();
                dispatch(showToast({ description: 'Payment method updated', variant: 'success' }));
            }
        },
        [id, role, dispatch, onSaved]
    );

    return { createPaymentMethod, updatePaymentMethod, isSaving };
};

export default useSavePaymentMethod;
