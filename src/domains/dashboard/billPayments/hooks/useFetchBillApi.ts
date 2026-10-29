/* eslint-disable @typescript-eslint/no-unused-vars */
import { useCallback, useRef, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { SurchargeResponse } from '@customtypes/general';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { getSurcharge } from '@src/services/surcharge';
import { accessKeys } from '@utils/accessKeys';
import { formatNumberWithLocalString } from '@utils/priceFormat';
import { sanitizeBillerName } from '@utils/wordFormat';

import { setPaymentData } from '../../payments/slices/payment';
import { billValidation, fetchBill, getServiceProvider } from '../api/index';
import { setPostpaid } from '../slices/billPaymentSlice';
import { Beneficiary, OptionsType, billAmountType } from '../types/index';
import {
    ChannelAmountBound,
    resolveChannelAmountBound,
    tightenWithChannelBound,
} from '../utils/channelAmountLimit';
import { creditBalanceOf } from '../utils/creditBalance';
import { billPayments, isMobileLikeParam, telecomServices } from '../utils/data';
import { navigateToServiceType } from '../utils/tableColumn';

export type BbpsPlan = {
    planId: string;
    planName: string;
    amount: number;
    planType: string;
};

type PlanSelectionContext = {
    requestId: string;
    paramsValues: any;
    serviceProvider: string;
    billerName: string | undefined;
    billerAdhoc?: string;
    accessKeyName: string;
    apiUrl: string;
    serviceTitle: string;
    billerResponse: Record<string, any>;
    channelBound: ChannelAmountBound;
};

export const BILL_VIEWED_EVENT_MAP: Record<string, string> = {
    bbps_utility_electricity: 'electricity_bill_viewed',
    bbps_utility_lpg: 'lpg_cylinder_bill_viewed',
    bbps_utility_pipedgas: 'piped_gas_bill_viewed',
    bbps_utility_broadband: 'broadband_bill_viewed',
    bbps_utility_water: 'water_bill_viewed',
    bbps_utility_dth: 'dth_recharge_bill_viewed',
    bbps_utility_fastag: 'fastag_recharge_bill_viewed',
    bbps_utility_landline: 'landline_bill_viewed',
    bbps_other_prepaidMeter: 'prepaid_meter_bill_viewed',
    bbps_telecom_postpaid: 'postpaid_recharge',
};

function normalizeBillerRuleValue(value?: string): string {
    return (value || '').replace(/[\s-]+/g, '_').toUpperCase().trim();
}

/**
 * Extract the billerResponse object from a bill fetch or validation API response.
 *
 * - Validation API: billerResponse is nested at billData.billerResponse  → return it directly.
 * - Fetch API:      billerResponse fields are flat at the top level       → strip meta-fields and return the rest.
 */
function filterEmptyValues(obj: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(
        Object.entries(obj).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    );
}

function extractBillerResponse(billData: any): Record<string, unknown> {
    const nested = billData?.billerResponse;
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
        const filtered = filterEmptyValues(nested as Record<string, unknown>);
        if (Object.keys(filtered).length > 0) return filtered;
    }
    const { requestId: _r, additionalInfo: _a, exactness: _e, ccf1Amount: _c,
            responseCode: _rc, responseReason: _rr, complianceCode: _cc, complianceReason: _cr,
            billerResponse: _br, ...rest } = billData ?? {};
    return Object.keys(rest).length > 0 ? filterEmptyValues(rest) : {};
}

export default function usePaymentApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const currentUserMobile = useAppSelector(state => state.reducer.user.user?.mobileNo) || '';
    const [isLoading, setIsLoading] = useState(false);
    const [billerPlans, setBillerPlans] = useState<BbpsPlan[]>([]);
    const [isPlanDrawerOpen, setIsPlanDrawerOpen] = useState(false);
    const planSelectionContextRef = useRef<PlanSelectionContext | null>(null);
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const handlePayment = useCallback(
        async (
            values: any,
            accessKeyName: string,
            billerName?: string,
            _mobileNo?: string,
            selectedBiller?: OptionsType,
            navigateBackPath?: string
        ) => {
            setIsLoading(true);
            const { serviceProvider, amount: enteredAmount, ...rest } = values;
            const channelBound = resolveChannelAmountBound(accessKeyName, selectedBiller);
            const defaultEntryAmount = channelBound.minAmount ?? 0;
            dispatch(setPostpaid(values));
            const validParamNames = selectedBiller?.customerParams?.length
                ? new Set((selectedBiller.customerParams as any[]).map(p => p.paramName))
                : null;
            const entries = Object.entries(rest).filter(([key]) =>
                validParamNames ? validParamNames.has(key) : true
            );
            let paramsValues = {};
            if (entries.length === 1) {
                const [paramName, paramValue] = entries[0];
                paramsValues = {
                    input: {
                        paramName,
                        paramValue: paramValue as string,
                    },
                };
            } else {
                paramsValues = {
                    input: entries
                        .filter(([_, paramValue]) => paramValue !== '')
                        .map(([paramName, paramValue]) => ({
                            paramName,
                            paramValue: paramValue as string,
                        })),
                };
            }
            const allServices = [...billPayments, ...telecomServices];
            const serviceData = allServices.find(obj => obj.accessKey === accessKeyName);

            if (!serviceData) {
                setIsLoading(false);
                return;
            }
            const { apiUrl } = serviceData!;

            if (typeof Moengage?.track_event === 'function') {
                const billViewedEvent = BILL_VIEWED_EVENT_MAP[accessKeyName];
                if (billViewedEvent) {
                    const payload: Record<string, any> = {};
                    if (billerName) payload.service_provider = billerName;
                    if (accessKeyName === 'bbps_telecom_postpaid') {
                        // postpaid_recharge wants the mobile number under "number" specifically,
                        // not the generic customer_id/mobile_number keys used below.
                        const numberEntry = Object.entries(values).find(
                            ([key, val]) => key !== 'serviceProvider' && key !== 'amount' && val
                        );
                        if (numberEntry) payload.number = numberEntry[1];
                    } else {
                        if (values.CustomerId) payload.customer_id = values.CustomerId;
                        if (values['Consumer Number']) payload.customer_number = values['Consumer Number'];
                        if (values['Distributor ID']) payload.distribution_id = values['Distributor ID'];
                        if (values['Mobile Number']) payload.mobile_number = values['Mobile Number'];
                        if (values['Unique Consumer ID']) payload.unique_consumer_id = values['Unique Consumer ID'];
                        if (values['Vehicle Number']) payload.vehicle_number = values['Vehicle Number'];
                        if (values['Meter Number']) payload.meter_number = values['Meter Number'];
                        // The customer-facing form fields are dynamic per biller (DetailPageForm renders
                        // them from the biller's own metadata, e.g. "Consumer No.", "CA Number", "Subscriber
                        // ID"...), so the exact-name checks above only catch a few known labels. When a
                        // biller uses some other label for its single identifying field (common for
                        // electricity/DTH), fall back to whatever value the user actually entered.
                        const hasIdentifier = [
                            'customer_id',
                            'customer_number',
                            'distribution_id',
                            'mobile_number',
                            'unique_consumer_id',
                            'vehicle_number',
                            'meter_number',
                        ].some(key => payload[key]);
                        if (!hasIdentifier) {
                            const fallbackEntry = Object.entries(values).find(
                                ([key, val]) => key !== 'serviceProvider' && key !== 'amount' && val
                            );
                            if (fallbackEntry) payload.customer_id = fallbackEntry[1];
                        }
                    }
                    Moengage.track_event(billViewedEvent, payload);
                }
            }
            sessionStorage.setItem(
                'service_details',
                JSON.stringify({
                    serviceDetails: {
                        ...(billerName && { service_provider: billerName }),
                    },
                })
            );

            const fetchRequirement =
                selectedBiller?.billerFetchRequiremet || selectedBiller?.billerFetchRequirement || '';
            const billValidationSupport = selectedBiller?.billerSupportBillValidation || '';
            const normalizedFetchRequirement = normalizeBillerRuleValue(fetchRequirement);
            const normalizedBillValidationSupport =
                normalizeBillerRuleValue(billValidationSupport);
            const isFetchMandatory = normalizedFetchRequirement === 'MANDATORY';
            const isFetchNotSupported = normalizedFetchRequirement === 'NOT_SUPPORTED';
            const isBillValidationMandatory = normalizedBillValidationSupport === 'MANDATORY';
            const isBillValidationNotSupported =
                normalizedBillValidationSupport === 'NOT_SUPPORTED';
            // QuickPay only when BOTH fetch and validation are explicitly "Not Supported".
            // If either is MANDATORY → pre-payment step required (fetch or validation).
            // If either is OPTIONAL → fall through to fetchBill for best-effort bill data.
            const isQuickPayFlow = isFetchNotSupported && isBillValidationNotSupported;

            if (isQuickPayFlow) {
                const amount = Number(enteredAmount || 0);
                if (!amount || amount <= 0) {
                    setIsLoading(false);
                    return;
                }

                const surchargeData: SurchargeResponse | false = await getSurcharge({
                    userId: id,
                    userType: role,
                    amount,
                    accessKey: accessKeyName,
                    billerId: serviceProvider,
                });

                const ccf1Rupees = surchargeData ? parseFloat(surchargeData.ccf1Amount ?? '0') / 100 : 0;
                const platformFee = surchargeData ? Number(surchargeData.surcharge) + ccf1Rupees : 0;
                const total = amount + platformFee;

                const billSummary = [
                    { key: 'Service name', value: serviceData.title },
                    ...(billerName
                        ? [{ key: 'Service provider', value: billerName }]
                        : []),
                    {
                        key: 'Amount',
                        value: formatNumberWithLocalString(amount),
                    },
                ];

                const paymentSummary = [
                    {
                        key: 'Platform fee (inclusive of GST)',
                        value: `₹ ${formatNumberWithLocalString(platformFee)}`,
                    },
                ];

                const requestBody = {
                    accessKey: accessKeyName,
                    requestId: `QP-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
                    quickPay: 'Y',
                    amount,
                    billerId: serviceProvider,
                    billerName,
                    billerAdhoc: selectedBiller?.billerAdhoc,
                    customerParams: paramsValues,
                    billerResponse: {},
                    ccf1Amount: surchargeData ? surchargeData.ccf1Amount || null : null,
                };

                const path = navigateBackPath || navigateToServiceType(accessKeyName);
                dispatch(
                    setPaymentData({
                        billSummary,
                        paymentSummary,
                        totalAmount: total,
                        title: 'Recharge Summary',
                        payload: requestBody,
                        url: `payment/${apiUrl}/payment`,
                        earningCashbackAmount:
                            Number(surchargeData && surchargeData?.corporateCashback) || 0,
                        ...tightenWithChannelBound(undefined, undefined, channelBound),
                        navigatePath: path,
                    })
                );
                setIsLoading(false);
                navigate(paths.dashboard.payments);
                return;
            }

            const fetchBillPayload = {
                apiPath: apiUrl,
                userId: id,
                userType: role,
                billerId: serviceProvider,
                customerParams: paramsValues,
            };
            let billData: any | false = false;
            if (isFetchMandatory) {
                billData = await fetchBill(fetchBillPayload);
            } else if (isBillValidationMandatory || isFetchNotSupported) {
                // isFetchNotSupported: fetch is unavailable; use validation even if only OPTIONAL
                billData = await billValidation(fetchBillPayload);
            } else {
                billData = await fetchBill(fetchBillPayload);
            }
            if (!billData) {
                setIsLoading(false);
                return;
            }

            // --- DTH / plan-based biller: validation returns plans ---
            if (billData.billerPlanResponseParam) {
                const planResponse = billData.billerPlanResponseParam;
                const plansRaw = Array.isArray(planResponse.billerPlanInfo)
                    ? planResponse.billerPlanInfo
                    : [planResponse.billerPlanInfo];

                const plans: BbpsPlan[] = plansRaw
                    .filter(Boolean)
                    .map((p: any) => {
                        const infoArray = Array.isArray(p.planInfo) ? p.planInfo : [p.planInfo];
                        const getInfo = (name: string) =>
                            infoArray.find((i: any) => i.infoName === name)?.infoValue || '';
                        return {
                            planId: getInfo('Plan_Id'),
                            planName: getInfo('Plan_Name'),
                            amount: Number(getInfo('Plan_Amount_In_Rupees')),
                            planType: p.planType || '',
                        };
                    });

                planSelectionContextRef.current = {
                    requestId: billData.requestId,
                    paramsValues,
                    serviceProvider,
                    billerName,
                    billerAdhoc: selectedBiller?.billerAdhoc,
                    accessKeyName,
                    apiUrl,
                    serviceTitle: serviceData.title,
                    billerResponse: extractBillerResponse(billData),
                    channelBound,
                };

                setBillerPlans(plans);
                setIsPlanDrawerOpen(true);
                setIsLoading(false);
                return;
            }

            // --- Validation returned info but no bill amount: user must enter amount ---
            // Triggers when: validation is mandatory (e.g. prepaid meter), OR fetch is not
            // supported and validation is optional but returned no billAmount (e.g. Airtel postpaid).
            if ((isBillValidationMandatory || isFetchNotSupported) && billData.additionalInfo && !billData.billAmount) {
                const info = billData.additionalInfo?.info;
                let infoArray: any[] = [];
                if (info) {
                    infoArray = Array.isArray(info) ? info : [info];
                }
                const allInfoItems = infoArray.filter(
                    (i: any) => i.infoName && i.infoValue != null && i.infoValue !== ''
                );

                const surchargeData: SurchargeResponse | false = await getSurcharge({
                    userId: id,
                    userType: role,
                    amount: defaultEntryAmount || 100,
                    accessKey: accessKeyName,
                    billerId: serviceProvider,
                });

                const billSummaryItems = [
                    { key: 'Service name', value: serviceData.title },
                    ...(billerName ? [{ key: 'Service provider', value: billerName }] : []),
                    ...allInfoItems.map((item: any) => ({ key: item.infoName, value: item.infoValue })),
                    { key: 'Amount', value: defaultEntryAmount, isInput: true },
                ];

                const paymentSummary = [
                    {
                        key: 'Platform fee (inclusive of GST)',
                        value: `₹ ${formatNumberWithLocalString((surchargeData && surchargeData.surcharge) || 0)}`,
                    },
                ];

                const requestBody = {
                    accessKey: accessKeyName,
                    requestId: billData.requestId,
                    quickPay: 'N',
                    amount: defaultEntryAmount,
                    billerId: serviceProvider,
                    billerName,
                    billerAdhoc: selectedBiller?.billerAdhoc,
                    customerParams: paramsValues,
                    billerResponse: extractBillerResponse(billData),
                };

                const path = navigateBackPath || navigateToServiceType(accessKeyName);
                dispatch(
                    setPaymentData({
                        billSummary: billSummaryItems,
                        paymentSummary,
                        totalAmount: defaultEntryAmount
                            ? defaultEntryAmount + (Number(surchargeData && surchargeData.surcharge) || 0)
                            : 0,
                        title: 'Recharge Summary',
                        payload: requestBody,
                        url: `payment/${apiUrl}/payment`,
                        earningCashbackAmount:
                            Number(surchargeData && surchargeData?.corporateCashback) || 0,
                        ...tightenWithChannelBound(1, undefined, channelBound),
                        navigatePath: path,
                    })
                );
                setIsLoading(false);
                navigate(paths.dashboard.payments);
                return;
            }

            // --- Validation succeeded but no bill amount (e.g. DTH basic validation) ---
            if (!billData.billAmount) {
                const surchargeData: SurchargeResponse | false = await getSurcharge({
                    userId: id,
                    userType: role,
                    amount: defaultEntryAmount || 100,
                    accessKey: accessKeyName,
                    billerId: serviceProvider,
                });

                const billSummaryItems = [
                    { key: 'Service name', value: serviceData.title },
                    ...(billerName ? [{ key: 'Service provider', value: billerName }] : []),
                    { key: 'Amount', value: defaultEntryAmount, isInput: true },
                ];

                const paymentSummary = [
                    {
                        key: 'Platform fee (inclusive of GST)',
                        value: `₹ ${formatNumberWithLocalString((surchargeData && surchargeData.surcharge) || 0)}`,
                    },
                ];

                const requestBody = {
                    accessKey: accessKeyName,
                    requestId: billData.requestId,
                    quickPay: 'N',
                    amount: defaultEntryAmount,
                    billerId: serviceProvider,
                    billerName,
                    billerAdhoc: selectedBiller?.billerAdhoc,
                    customerParams: paramsValues,
                    billerResponse: extractBillerResponse(billData),
                };

                const path = navigateBackPath || navigateToServiceType(accessKeyName);
                dispatch(
                    setPaymentData({
                        billSummary: billSummaryItems,
                        paymentSummary,
                        totalAmount: defaultEntryAmount
                            ? defaultEntryAmount + (Number(surchargeData && surchargeData.surcharge) || 0)
                            : 0,
                        title: 'Recharge Summary',
                        payload: requestBody,
                        url: `payment/${apiUrl}/payment`,
                        earningCashbackAmount:
                            Number(surchargeData && surchargeData?.corporateCashback) || 0,
                        ...tightenWithChannelBound(1, undefined, channelBound),
                        navigatePath: path,
                    })
                );
                setIsLoading(false);
                navigate(paths.dashboard.payments);
                return;
            }

            // --- Standard flow: fetch or validation returned bill amount ---
            if (billData) {
                const { requestId, additionalInfo, exactness, ...billerResponse } = billData;
                const { billAmount: amount, customerName, dueDate, billDate } = billerResponse;

                const billAmountNum = Number(amount);
                const creditBalance = creditBalanceOf(billAmountNum);
                let surchargeData: SurchargeResponse | false = false;
                if (billAmountNum > 0) {
                    surchargeData = await getSurcharge({
                        userId: id,
                        userType: role,
                        amount: billAmountNum,
                        accessKey: accessKeyName,
                        billerId: serviceProvider,
                    });
                }
                const ccf1Rupees = surchargeData ? parseFloat(surchargeData.ccf1Amount ?? '0') / 100 : 0;
                const platformFee = surchargeData ? Number(surchargeData.surcharge) + ccf1Rupees : 0;
                const total = creditBalance ? 0 : billAmountNum + platformFee;

                const rawInfo = additionalInfo?.info;
                let additionalInfoArray: any[] = [];
                if (rawInfo) {
                    additionalInfoArray = Array.isArray(rawInfo) ? rawInfo : [rawInfo];
                }
                const additionalBalanceItems = additionalInfoArray.filter((i: any) =>
                    i.infoName?.toLowerCase().includes('balance')
                );
                const maxAmountItem = additionalInfoArray.find((i: any) => {
                    const name = i.infoName?.toLowerCase() || '';
                    return (name.includes('maximum') || name.includes('limit')) && !name.includes('minimum');
                });
                const minAmountItem = additionalInfoArray.find((i: any) => {
                    const name = i.infoName?.toLowerCase() || '';
                    return name.includes('minimum');
                });
                const additionalMaxAmount = maxAmountItem
                    ? Number(String(maxAmountItem.infoValue).replace(/,/g, ''))
                    : undefined;
                const additionalMinAmount = minAmountItem
                    ? Number(String(minAmountItem.infoValue).replace(/,/g, ''))
                    : undefined;

                let maximumAmount: number | undefined;
                let minimumAmount: number | undefined;
                switch (exactness || '') {
                    case billAmountType.any:
                        maximumAmount = undefined;
                        minimumAmount = undefined;
                        break;
                    case billAmountType.above:
                        maximumAmount = undefined;
                        minimumAmount = Number(amount);
                        break;
                    case billAmountType.below:
                        maximumAmount = Number(amount);
                        minimumAmount = undefined;
                        break;
                    default:
                        maximumAmount = undefined;
                        minimumAmount = undefined;
                }
                if (additionalMaxAmount != null && !Number.isNaN(additionalMaxAmount)) {
                    maximumAmount = additionalMaxAmount;
                }
                if (additionalMinAmount != null && !Number.isNaN(additionalMinAmount)) {
                    minimumAmount = additionalMinAmount;
                }
                const isAmountEditable = !!exactness && exactness !== billAmountType.exact;
                const bounds = tightenWithChannelBound(
                    minimumAmount,
                    maximumAmount,
                    channelBound
                );

                const billSummary1 = [
                    {
                        key: 'Service name',
                        value: serviceData?.title!,
                    },
                    {
                        key: 'Consumer name',
                        value: sanitizeBillerName(customerName),
                    },
                    ...(values.CustomerId
                        ? [{ key: 'Customer ID', value: values.CustomerId }]
                        : []),
                    ...(values['Consumer Number']
                        ? [{ key: 'Consumer number', value: values['Consumer Number'] }]
                        : []),
                    ...(values['Distributor ID']
                        ? [{ key: 'Distributor ID', value: values['Distributor ID'] }]
                        : []),
                    ...(values['Mobile Number']
                        ? [{ key: 'Mobile number', value: values['Mobile Number'] || 'N/A' }]
                        : []),

                    ...(values['Unique Consumer ID']
                        ? [
                              {
                                  key: 'Unique Consumer ID',
                                  value: values['Unique Consumer ID'] || 'N/A',
                              },
                          ]
                        : []),
                    ...(values.serviceProvider
                        ? [{ key: 'Service provider', value: values.serviceProvider }]
                        : []),
                    {
                        key: 'Bill date',
                        value: billDate,
                    },
                    {
                        key: 'Due date',
                        value: dueDate,
                    },
                    ...additionalBalanceItems.map((item: any) => ({
                        key: item.infoName,
                        value: `₹ ${formatNumberWithLocalString(item.infoValue)}`,
                    })),
                    ...(maxAmountItem
                        ? [{ key: 'Maximum Recharge Amount', value: `₹ ${formatNumberWithLocalString(maxAmountItem.infoValue)}` }]
                        : []),
                    ...(minAmountItem
                        ? [{ key: 'Minimum Amount Due', value: `₹ ${formatNumberWithLocalString(minAmountItem.infoValue)}` }]
                        : []),
                    {
                        key: 'Amount',
                        value: formatNumberWithLocalString(creditBalance ?? amount ?? 0) ?? 0,
                        isInput: isAmountEditable && !creditBalance,
                    },
                ];
                const billSummary = billSummary1.filter(
                    item => item.value !== undefined && item.value !== null
                );

                const paymentSummary = [
                    {
                        key: 'Platform fee (inclusive of GST)',
                        value: `₹ ${formatNumberWithLocalString(platformFee)}`,
                    },
                ];

                const requestBody = {
                    accessKey: accessKeyName,
                    requestId: requestId || '',
                    quickPay: 'N',
                    amount: Number(billData?.billAmount) || 0,
                    billerId: serviceProvider,
                    billerName,
                    billerAdhoc: selectedBiller?.billerAdhoc,
                    additionalInfo,
                    customerParams: paramsValues,
                    billerResponse: { ...billerResponse },
                    ccf1Amount: surchargeData ? surchargeData.ccf1Amount || null : null,
                };

                const path = navigateBackPath || navigateToServiceType(accessKeyName);
                dispatch(
                    setPaymentData({
                        billSummary,
                        paymentSummary,
                        totalAmount: total,
                        title: 'Recharge Summary',
                        payload: requestBody,
                        url: `payment/${apiUrl}/payment`,
                        earningCashbackAmount:
                            Number(surchargeData && surchargeData?.corporateCashback) || 0,
                        ...bounds,
                        creditBalance,
                        navigatePath: path,
                    })
                );
                setIsLoading(false);
                navigate(paths.dashboard.payments);
            }
        },
        [dispatch, id, navigate, role]
    );

    const handlePlanSelect = useCallback(
        async (plan: BbpsPlan) => {
            const ctx = planSelectionContextRef.current;
            if (!ctx) return;

            setIsLoading(true);
            setIsPlanDrawerOpen(false);

            const surchargeData: SurchargeResponse | false = await getSurcharge({
                userId: id,
                userType: role,
                amount: plan.amount,
                accessKey: ctx.accessKeyName,
                billerId: ctx.serviceProvider,
            });

            const ccf1Rupees = surchargeData ? parseFloat(surchargeData.ccf1Amount ?? '0') / 100 : 0;
            const platformFee = surchargeData ? Number(surchargeData.surcharge) + ccf1Rupees : 0;
            const total = plan.amount + platformFee;

            const billSummary = [
                { key: 'Service name', value: ctx.serviceTitle },
                ...(ctx.billerName ? [{ key: 'Service provider', value: ctx.billerName }] : []),
                { key: 'Plan', value: plan.planName },
                { key: 'Amount', value: formatNumberWithLocalString(plan.amount) },
            ];

            const paymentSummary = [
                {
                    key: 'Platform fee (inclusive of GST)',
                    value: `₹ ${formatNumberWithLocalString(platformFee)}`,
                },
            ];

            const requestBody = {
                accessKey: ctx.accessKeyName,
                requestId: ctx.requestId,
                quickPay: 'N',
                amount: plan.amount,
                billerId: ctx.serviceProvider,
                billerName: ctx.billerName,
                customerParams: ctx.paramsValues,
                billerResponse: ctx.billerResponse,
                planDetails: { Id: plan.planId, type: plan.planType },
                ccf1Amount: surchargeData ? surchargeData.ccf1Amount || null : null,
            };

            const path = navigateToServiceType(ctx.accessKeyName);
            dispatch(
                setPaymentData({
                    billSummary,
                    paymentSummary,
                    totalAmount: total,
                    title: 'Recharge Summary',
                    payload: requestBody,
                    url: `payment/${ctx.apiUrl}/payment`,
                    earningCashbackAmount:
                        Number(surchargeData && surchargeData?.corporateCashback) || 0,
                    ...tightenWithChannelBound(undefined, undefined, ctx.channelBound),
                    navigatePath: path,
                })
            );
            // Plan-based billers (DTH, FASTag, ...) skip handlePayment's flow entirely once the
            // plan drawer opens, so service_details — needed for the generic checkout/payment
            // result events — has to be (re-)seeded here too.
            sessionStorage.setItem(
                'service_details',
                JSON.stringify({
                    serviceDetails: {
                        ...(ctx.billerName && { service_provider: ctx.billerName }),
                    },
                })
            );
            setIsLoading(false);
            navigate(paths.dashboard.payments);
        },
        [dispatch, id, navigate, role]
    );

    const handleBeneficiaryPayment = useCallback(
        async (beneficiary: Beneficiary) => {
            const { accessKey: accessKeyName, billerId, serviceProvider: billerName, customerParams } = beneficiary;

            // Traffic Challan beneficiaries hold a vehicle number, not a BBPS biller: there is no bill
            // to fetch here, so hand off to the challan page, which loads that vehicle's challans.
            if (accessKeyName === accessKeys.challan) {
                const vehicleNumber =
                    customerParams.find(item => item.name === 'vehicleNumber')?.value || '';
                navigate(
                    `${paths.dashboard.billPayments}/${paths.billPayments.challan}?vehicle=${encodeURIComponent(vehicleNumber)}`
                );
                return;
            }

            const values: { [key: string]: string } = { serviceProvider: billerId! };
            customerParams.forEach(item => {
                if (item.name && item.value) values[item.name] = item.value;
            });

            // For LPG: pin any mobile-like param to the current Peko user's registered mobile number,
            // overriding whatever was stored when the beneficiary was saved. Ensures only the account
            // holder's own connection can be booked, even from a saved beneficiary.
            if (accessKeyName === accessKeys.lpg) {
                customerParams.forEach(item => {
                    if (item.name && isMobileLikeParam(item.name)) {
                        values[item.name] = currentUserMobile;
                    }
                });
            }

            // Resolve biller MDM data to correctly determine fetch/validation/quickPay flow
            const allServices = [...billPayments, ...telecomServices];
            const serviceData = allServices.find(obj => obj.accessKey === accessKeyName);
            let selectedBiller: OptionsType | undefined;

            if (serviceData && billerId) {
                const result = await getServiceProvider({
                    userId: id,
                    userType: role,
                    categoryName: serviceData.BBPSCategoryName,
                    searchText: billerId,
                });
                if (result && result.billersArray) {
                    const biller = result.billersArray.find((b: any) => b.billerId === billerId);
                    if (biller) {
                        selectedBiller = {
                            value: biller.billerId,
                            label: biller.billerName,
                            customerParams: Array.isArray(biller.billerInputParams)
                                ? biller.billerInputParams.map((p: any) => p.paramInfo)
                                : [],
                            billerFetchRequirement: biller.billerFetchRequirement,
                            billerFetchRequiremet: biller.billerFetchRequiremet,
                            billerSupportBillValidation: biller.billerSupportBillValidation,
                            billerAdhoc: biller.billerAdhoc,
                            interchangeFeeCCF1: biller.interchangeFeeCCF1,
                        };
                    }
                }
            }

            await handlePayment(values, accessKeyName, billerName, undefined, selectedBiller);
        },
        [id, role, handlePayment, currentUserMobile, navigate]
    );

    return { handlePayment, handleBeneficiaryPayment, handlePlanSelect, isLoading, billerPlans, isPlanDrawerOpen, setIsPlanDrawerOpen };
}
