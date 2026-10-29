import { useCallback, useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { setPaymentData } from '@domains/dashboard/payments/slices/payment';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { store } from '@src/store/store';
import { accessKeys } from '@utils/accessKeys';

import useSurchargeApi from './useSurchargeApi';
import { VendorServiceDetail, getVendorServiceDetailsApi } from '../apis';
import { Service } from '../types';
import { resolveGovtServiceFormSegment } from '../utils';
import { isGstCancellationService } from '../utils/gstCancellationForm';
import { isGstRegistrationService } from '../utils/gstForm';

interface Params {
    selectedService: Service | null;
}

// Mirrors giftCards' usePayment — surcharge is only fetched from proceedToPayment on submit, never reactively while viewing the page.
export default function useGovtServicePayment({ selectedService }: Params) {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { role, id: userId } = useAppSelector(state => state.reducer.auth);
    const { getGovtServiceSurcharge, isLoading: isSurchargeLoading } = useSurchargeApi();

    const [variants, setVariants] = useState<VendorServiceDetail[]>([]);
    const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
    const [isVariantsLoading, setIsVariantsLoading] = useState(true);

    const selectedVariant = variants.find(v => v.id === selectedVariantId) ?? null;

    // Fetch the vendor's variants for this service_id once; falls back to cached catalog pricing if there's no service_id.
    useEffect(() => {
        if (!selectedService?.serviceId) {
            setVariants([]);
            setSelectedVariantId(null);
            setIsVariantsLoading(false);
            return;
        }
        setIsVariantsLoading(true);
        getVendorServiceDetailsApi(userId, role, selectedService.serviceId).then(rows => {
            setVariants(rows);
            setSelectedVariantId(rows[0]?.id ?? null);
            setIsVariantsLoading(false);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedService?.serviceId]);

    // Payment Breakdown preview: price + government fee only (surcharge is only known once Continue is clicked).
    // Number(...)-coerced — vendor fields sometimes arrive as numeric strings, and plain `+` would string-concat instead of add.
    const cachedFee =
        selectedService && selectedService.govtFee !== 'Free' ? Number(selectedService.govtFee) : 0;
    const govFee = selectedVariant ? Number(selectedVariant.government_fee_amount) || 0 : cachedFee;
    const pekoFee = selectedVariant
        ? Number(selectedVariant.price) || 0
        : Number(selectedService?.price) || 0;
    const totalAmount = govFee + pekoFee;

    // Continue's payment step: fetches the real surcharge, dispatches setPaymentData, then navigates to the shared payment page.
    // No applicationId sent — paymentGateway resolves the application row server-side by {credentialId, serviceId}.
    const proceedToPayment = useCallback(async () => {
        if (!selectedService) return;

        // Read straight from the store, not useSelector — handleContinue dispatches setVendorGid then calls this synchronously,
        // before a re-render would pick up the new value via useSelector.
        const { vendorGid } = store.getState().reducer.governmentServices;

        const { surcharge: surchargeAmount, corporateCashback: cashback } =
            await getGovtServiceSurcharge(totalAmount);
        const total = totalAmount + surchargeAmount - cashback;
        // catalog_id for Create Order — the selected variant's id, falling back to the static accessKey.
        // Kept as its own vendorCatalogId field, not payload.accessKey — the shared payment page's surcharge lookups
        // expect payload.accessKey to be the fixed service-operator key, not a per-item variant id.
        const vendorCatalogId = selectedVariant
            ? String(selectedVariant.id)
            : selectedService.accessKey;

        // billSummary must be non-empty — PaymentSummary redirects home when it's empty.
        const billSummary = [
            { key: 'Service', value: selectedVariant?.service_name ?? selectedService.name },
            ...(selectedVariant?.variant_name
                ? [{ key: 'Plan', value: selectedVariant.variant_name }]
                : []),
        ];
        const paymentSummary = [
            { key: 'Price', value: `₹ ${pekoFee.toLocaleString('en-IN')}` },
            ...(govFee > 0
                ? [{ key: 'Government Fee', value: `₹ ${govFee.toLocaleString('en-IN')}` }]
                : []),
            ...(surchargeAmount > 0
                ? [
                      {
                          key: 'Platform fee (inclusive of GST)',
                          value: `₹ ${surchargeAmount.toLocaleString('en-IN')}`,
                      },
                  ]
                : []),
        ];

        // Trademark Registration/Objection/Expedited, GST Registration and GST Cancellation are
        // separate post-payment forms. GST services are matched by serviceId (same check
        // MyApplications.tsx's resolveFormSegment and useServiceDetailData.ts's draft-resume branch
        // use) — without it every fresh GST purchase landed in the Trademark wizard after payment.
        // Everything else goes through resolveTrademarkFormSegment: Expedited is its own catalog
        // row, but its serviceName still holds the generic base string — "Expedited" lives in the
        // vendor's variant_name, which mapApiItem stashes on Service.category.
        let formSegment: string;
        if (isGstRegistrationService(selectedService.serviceId)) {
            formSegment = paths.governmentServices.gstRegister;
        } else if (isGstCancellationService(selectedService.serviceId)) {
            formSegment = paths.governmentServices.cancellation;
        } else {
            formSegment = resolveGovtServiceFormSegment(selectedService.name, selectedService.category);
        }

            dispatch(
                setPaymentData({
                    title: 'Government Service Payment',
                    billSummary,
                    paymentSummary,
                    totalAmount: total,
                    payload: {
                        // Vendor's numeric service_id — paymentGateway looks up the application row by {credentialId, serviceId}.
                        serviceId: selectedService.serviceId,
                        accessKey: accessKeys.governmentServices,
                        vendorCatalogId,
                        amount: totalAmount,
                        currentUrl: window.location.href,
                        // customer_id from Create Lead — required by the vendor Create Order call.
                        ...(vendorGid ? { gid: vendorGid } : {}),
                    },
                    url: 'purchase/govt-services/applications/payment',
                    earningCashbackAmount: cashback,
                    successPath: `${paths.dashboard.governmentServices}/${paths.governmentServices.service}/${selectedService.id}/${formSegment}`,
                    navigatePath: `${paths.dashboard.governmentServices}/${paths.governmentServices.service}/${selectedService.id}`,
                })
            );

        navigate(paths.dashboard.payments);
    }, [
        selectedService,
        selectedVariant,
        govFee,
        pekoFee,
        totalAmount,
        getGovtServiceSurcharge,
        dispatch,
        navigate,
    ]);

    return {
        variants,
        selectedVariantId,
        setSelectedVariantId,
        selectedVariant,
        govFee,
        pekoFee,
        totalAmount,
        isPricingLoading: isVariantsLoading,
        proceedToPayment,
        isProceeding: isSurchargeLoading,
    };
}
