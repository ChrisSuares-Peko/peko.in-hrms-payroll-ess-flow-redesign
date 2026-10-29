import { useState } from 'react';

import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

import { paths } from '@routes/paths';
import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { generateEWaybillApi } from '../../api/eInvoice';
import { EWaybillFormValues } from '../../types/eWaybill';

const useGenerateEWaybill = (selectedInvoiceId: string | undefined) => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const generate = async (values: EWaybillFormValues) => {
        if (!selectedInvoiceId) return;

        setIsSubmitting(true);
        const isRoad = values.transportMode === 'road';
        const result = await generateEWaybillApi({
            userId: id,
            userType: role,
            invoiceId: selectedInvoiceId,
            body: {
                distance: Number(values.distance),
                transMode: values.transportMode,
                transId: values.transporterGstin,
                transName: values.transporterName,
                ...(isRoad && {
                    vehNo: values.vehicleNumber,
                    vehType: values.vehicleType,
                }),
                ...(!isRoad && {
                    transDocNo: values.transDocNo,
                    transDocDt: values.transDocDt
                        ? dayjs(values.transDocDt, 'YYYY-MM-DD').format('DD/MM/YYYY')
                        : '',
                }),
            },
        });
        setIsSubmitting(false);

        if (result?.status) {
            dispatch(
                showToast({
                    description: result.message || 'E-Waybill generated successfully',
                    variant: 'success',
                })
            );
            navigate(
                `/${paths.invoice.index}/${paths.invoice.eInvoiceDetails.replace(':id', selectedInvoiceId)}`
            );
        } else {
            dispatch(
                showToast({
                    description: result?.message || 'Failed to generate E-Waybill',
                    variant: 'error',
                })
            );
        }
    };

    return { generate, isSubmitting };
};

export default useGenerateEWaybill;
