import { useCallback, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { getSurcharge } from '@src/services/surcharge';
import { showToast } from '@src/slices/apiSlice';
import { accessKeys } from '@utils/accessKeys';

import { setPaymentData } from '../../payments/slices/payment';
import { saveDraft } from '../slices/vehicleReportSlice';
import { VehicleReportPaymentArgs } from '../types/index';
import { buildVehicleReportPayment } from '../utils/buildVehicleReportPayment';
import { reportMeta, vehicleReportsRoot } from '../utils/reportMeta';

// Single hand-off point from every report form to the shared /payments screen.
const useReportPayment = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const pay = useCallback(
        async (args: VehicleReportPaymentArgs) => {
            // A manually entered valuation has no registration number, so only the
            // presence of a vehicle can be checked here.
            if (!args.vehicle) {
                dispatch(
                    showToast({
                        variant: 'warning',
                        description: 'Select a vehicle before continuing to payment.',
                    })
                );
                return;
            }
            setIsLoading(true);

            // Display only — the backend recomputes the surcharge from the same
            // serviceOperator config when it charges, so a stale or failed lookup here
            // can never change what the user is actually billed.
            const surcharge = await getSurcharge({
                userId: id,
                userType: role,
                amount: args.reportPrice,
                accessKey: accessKeys.vehicleReports,
            });
            const convenienceFee = surcharge
                ? Number(surcharge.surcharge) +
                  (surcharge.ccf1Amount ? Number(surcharge.ccf1Amount) / 100 : 0)
                : 0;

            // Keep what the user typed so "Cancel and Go Back" from /payments
            // returns them to a populated form.
            dispatch(saveDraft({ reportType: args.reportType, values: args.formValues }));

            dispatch(
                setPaymentData({
                    ...buildVehicleReportPayment(args, convenienceFee),
                    title: 'Report Summary',
                    url: 'officeAndBusiness/garage/car-report/payment',
                    navigatePath: `${vehicleReportsRoot}/${reportMeta[args.reportType].formPath}`,
                    // Car Reports has its own post-payment screen, which can deep-link
                    // to the order just created. Without this the wallet and gateway
                    // legs both land on the generic /payments/payment-success page.
                    successPath: `${vehicleReportsRoot}/${paths.turbo.reportSuccess}`,
                })
            );
            navigate(paths.dashboard.payments);
            setIsLoading(false);
        },
        [dispatch, navigate, id, role]
    );

    return { pay, isLoading };
};

export default useReportPayment;
