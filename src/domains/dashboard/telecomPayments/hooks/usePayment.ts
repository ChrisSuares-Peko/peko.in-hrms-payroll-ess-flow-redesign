import { useCallback, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { BBPSCategoryName, SurchargeResponse } from '@customtypes/general';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { getSurcharge } from '@src/services/surcharge';
import { accessKeys } from '@utils/accessKeys';
import { formatNumberWithLocalString } from '@utils/priceFormat';
import { sanitizeBillerName } from '@utils/wordFormat';

import { setPostpaid } from '../../billPayments/slices/billPaymentSlice';
import {
    resolveChannelAmountBound,
    tightenWithChannelBound,
} from '../../billPayments/utils/channelAmountLimit';
import { creditBalanceOf } from '../../billPayments/utils/creditBalance';
import { setPaymentData } from '../../payments/slices/payment';
import {
    billValidation,
    fetchBill,
    fetchBillTest,
    getServiceProvider,
    JRIVendorBalance,
} from '../api/index';
import { setPrepaidBeneficiary } from '../slice/beneficiarySlice';
import { setPrepaid } from '../slice/prepaidFormSlice';
import {
    Beneficiary,
    billAmountType,
    FetchBillResponse,
    JriBalanceResponse,
    OptionsType,
} from '../types/index';
import { circleList } from '../utils/data';

export default function usePayment() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const handlePrepaidPay = useCallback(
        async (values: any) => {
            const { amount, mobileNumber, serviceProvider, circle } = values;
            dispatch(setPrepaid(values));
            if (typeof Moengage?.track_event === 'function') {
                Moengage.track_event('prepaid_recharge', { amount });
            }
            const vendorBalance: JriBalanceResponse | false = await JRIVendorBalance({
                userId: id,
                userType: role,
                amount: Number(amount),
                serviceProvider,
            });

            if (vendorBalance) {
                const surchargeData: SurchargeResponse | false = await getSurcharge({
                    userId: id,
                    userType: role,
                    amount: Number(amount),
                    accessKey: accessKeys.prepaid,
                });
                let total = 0;
                if (surchargeData) {
                    total = Number(amount) + Number(surchargeData.surcharge);
                } else {
                    total = Number(amount);
                }

                const providerCircle =
                    circleList.find(
                        obj =>
                            obj.value?.replace(/\s+/g, '').toLowerCase() ===
                            circle.replace(/\s+/g, '').toLowerCase()
                    )?.label ||
                    circleList.find(
                        obj =>
                            obj.label?.replace(/\s+/g, '').toLowerCase() ===
                            circle.replace(/\s+/g, '').toLowerCase()
                    )?.label;
                const formattedProviderCircle =
                    providerCircle?.toLowerCase() === 'all' ? 'All' : providerCircle;
                const formattedServiceProvider =
                    serviceProvider.toLowerCase() === 'bsnl'
                        ? serviceProvider.toUpperCase()
                        : serviceProvider.charAt(0).toUpperCase() +
                          serviceProvider.slice(1).toLowerCase();

                const billSummary = [
                    {
                        key: 'Service name',
                        value: 'Mobile Prepaid',
                    },
                    {
                        key: 'Mobile number',
                        value: mobileNumber,
                    },
                    {
                        key: 'Service provider',
                        value: formattedServiceProvider,
                    },
                    {
                        key: 'Circle',
                        value: formattedProviderCircle,
                    },
                    {
                        key: 'Amount',
                        value: formatNumberWithLocalString(amount ?? 0),
                    },
                ];
                const paymentSummary = [
                    {
                        key: 'Platform fee (inclusive of GST)',
                        value: `₹ ${formatNumberWithLocalString((surchargeData && surchargeData.surcharge) || 0)}`,
                    },
                ];
                const requestBody = {
                    account: mobileNumber,
                    amount,
                    location: providerCircle,
                    serviceProvider,
                    accessKey: accessKeys.prepaid,
                    currentUrl: window.location.href,
                };
                dispatch(
                    setPaymentData({
                        billSummary,
                        paymentSummary,
                        totalAmount: parseFloat(total.toFixed(2)),
                        title: 'Recharge Summary',
                        payload: requestBody,
                        url: 'payment/prepaid/payment',
                        earningCashbackAmount:
                            Number(surchargeData && surchargeData?.corporateCashback) || 0,
                        navigatePath: `${paths.dashboard.mobileRecharge}/${paths.telecomPayments.prepaid}`,
                    })
                );
                sessionStorage.setItem(
                    'service_details',
                    JSON.stringify({
                        serviceDetails: {
                            service_provider: formattedServiceProvider,
                            amount,
                            circle: formattedProviderCircle,
                            number: mobileNumber,
                        },
                    })
                );
                navigate(paths.dashboard.payments);
            }
        },
        [dispatch, id, navigate, role]
    );

    const handlePostpaidPay = useCallback(
        async (values: any, billerName?: string, selectedBiller?: OptionsType) => {
            setIsLoading(true);
            const channelBound = resolveChannelAmountBound(accessKeys.postpaid, selectedBiller);
            const defaultEntryAmount = channelBound.minAmount ?? 0;

            const { serviceProvider, amount: enteredAmount, ...rest } = values;
            dispatch(setPostpaid(values));

            if (typeof Moengage?.track_event === 'function') {
                Moengage.track_event('postpaid_recharge', {
                    service_provider: billerName || serviceProvider,
                    number: Object.values(rest)[0] as string,
                });
            }

            const validEntries = Object.entries(rest).filter(([, v]) => v !== '');
            let customerParams = {};
            if (validEntries.length === 1) {
                const [paramName, paramValue] = validEntries[0];
                customerParams = { input: { paramName, paramValue: paramValue as string } };
            } else {
                customerParams = {
                    input: validEntries.map(([paramName, paramValue]) => ({
                        paramName,
                        paramValue: paramValue as string,
                    })),
                };
            }

            const normalize = (v?: string) => (v || '').replace(/[\s-]+/g, '_').toUpperCase();
            const isFetchNotSupported =
                normalize(
                    selectedBiller?.billerFetchRequiremet || selectedBiller?.billerFetchRequirement
                ) === 'NOT_SUPPORTED';
            const isValidationNotSupported =
                normalize(selectedBiller?.billerSupportBillValidation) === 'NOT_SUPPORTED';
            const isBillValidationMandatory =
                normalize(selectedBiller?.billerSupportBillValidation) === 'MANDATORY';
            const isQuickPayFlow = isFetchNotSupported && isValidationNotSupported;
            const quickPay = isQuickPayFlow ? 'Y' : 'N';

            // --- QuickPay: both fetch and validation are Not Supported ---
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
                    accessKey: accessKeys.postpaid,
                    billerId: serviceProvider,
                });
                const ccf1Rupees = surchargeData
                    ? parseFloat(surchargeData.ccf1Amount ?? '0') / 100
                    : 0;
                const platformFee = surchargeData
                    ? Number(surchargeData.surcharge) + ccf1Rupees
                    : 0;
                const total = amount + platformFee;

                dispatch(
                    setPaymentData({
                        billSummary: [
                            { key: 'Service name', value: 'Mobile Postpaid' },
                            ...(billerName ? [{ key: 'Service provider', value: billerName }] : []),
                            { key: 'Amount', value: formatNumberWithLocalString(amount) },
                        ],
                        paymentSummary: [
                            {
                                key: 'Platform fee (inclusive of GST)',
                                value: `₹ ${formatNumberWithLocalString(platformFee)}`,
                            },
                        ],
                        totalAmount: total,
                        title: 'Recharge Summary',
                        payload: {
                            billerId: serviceProvider,
                            billerName,
                            requestId: `QP-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
                            quickPay: 'Y',
                            amount,
                            accessKey: accessKeys.postpaid,
                            customerParams,
                            billerResponse: {},
                            ccf1Amount: surchargeData ? surchargeData.ccf1Amount || null : null,
                        },
                        url: 'payment/postpaid/payment',
                        earningCashbackAmount:
                            Number(surchargeData && surchargeData?.corporateCashback) || 0,
                        navigatePath: `${paths.dashboard.mobileRecharge}/${paths.telecomPayments.postpaid}`,
                    })
                );
                sessionStorage.setItem(
                    'service_details',
                    JSON.stringify({
                        serviceDetails: {
                            service_provider: billerName || serviceProvider,
                            number: Object.values(rest)[0] as string,
                        },
                    })
                );
                setIsLoading(false);
                navigate(paths.dashboard.payments);
                return;
            }

            // --- Normal Pay: fetch or validate first, then pay with same requestId ---
            const fetchBillPayload = {
                userId: id,
                userType: role,
                billerId: serviceProvider,
                customerParams,
            };
            // Use validation when: validation is mandatory, OR fetch is not supported (validation is at least optional)
            const billData: FetchBillResponse | false =
                isBillValidationMandatory || isFetchNotSupported
                    ? await billValidation(fetchBillPayload)
                    : await fetchBill(fetchBillPayload);

            if (billData) {
                const { requestId, additionalInfo, ...billerResponse } = billData;
                const { billAmount: amount, customerName } = billerResponse;

                // Validation confirmed customer but returned no bill amount — user must enter amount
                if (!amount) {
                    const info = (additionalInfo as any)?.info;
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
                        accessKey: accessKeys.postpaid,
                        billerId: serviceProvider,
                    });

                    dispatch(
                        setPaymentData({
                            billSummary: [
                                { key: 'Service name', value: 'Mobile Postpaid' },
                                ...(billerName
                                    ? [{ key: 'Service provider', value: billerName }]
                                    : []),
                                ...allInfoItems.map((item: any) => ({
                                    key: item.infoName,
                                    value: item.infoValue,
                                })),
                                { key: 'Amount', value: defaultEntryAmount, isInput: true },
                            ],
                            paymentSummary: [
                                {
                                    key: 'Platform fee (inclusive of GST)',
                                    value: `₹ ${formatNumberWithLocalString((surchargeData && surchargeData.surcharge) || 0)}`,
                                },
                            ],
                            totalAmount: defaultEntryAmount
                                ? defaultEntryAmount +
                                  (Number(surchargeData && surchargeData.surcharge) || 0)
                                : 0,
                            title: 'Recharge Summary',
                            payload: {
                                billerId: serviceProvider,
                                billerName,
                                requestId: requestId || '',
                                quickPay: 'N',
                                amount: defaultEntryAmount,
                                accessKey: accessKeys.postpaid,
                                customerParams,
                                billerResponse: {},
                                ccf1Amount: surchargeData ? surchargeData.ccf1Amount || null : null,
                            },
                            url: 'payment/postpaid/payment',
                            earningCashbackAmount:
                                Number(surchargeData && surchargeData?.corporateCashback) || 0,
                            ...tightenWithChannelBound(1, undefined, channelBound),
                            navigatePath: `${paths.dashboard.mobileRecharge}/${paths.telecomPayments.postpaid}`,
                        })
                    );
                    sessionStorage.setItem(
                        'service_details',
                        JSON.stringify({
                            serviceDetails: {
                                service_provider: billerName || serviceProvider,
                                number: Object.values(rest)[0] as string,
                            },
                        })
                    );
                    setIsLoading(false);
                    navigate(paths.dashboard.payments);
                    return;
                }

                const billAmountNum = Number(amount);
                const creditBalance = creditBalanceOf(billAmountNum);
                let surchargeData: SurchargeResponse | false = false;
                if (billAmountNum > 0) {
                    surchargeData = await getSurcharge({
                        userId: id,
                        userType: role,
                        amount: billAmountNum,
                        accessKey: accessKeys.postpaid,
                    });
                }
                let total = billAmountNum;
                if (creditBalance) {
                    total = 0;
                } else if (surchargeData) {
                    total = billAmountNum + Number(surchargeData.surcharge);
                }

                const billSummary = [
                    { key: 'Service name', value: 'Mobile Postpaid' },
                    { key: 'Customer name', value: sanitizeBillerName(customerName) },
                    { key: 'Due date', value: billerResponse?.dueDate },
                    {
                        key: 'Amount',
                        value: formatNumberWithLocalString(creditBalance ?? billAmountNum),
                    },
                ];
                const paymentSummary = [
                    {
                        key: 'Platform fee (inclusive of GST)',
                        value: `₹ ${formatNumberWithLocalString((surchargeData && surchargeData.surcharge) || 0)}`,
                    },
                ];

                const requestBody = {
                    billerId: serviceProvider,
                    billerName,
                    requestId: requestId || '',
                    quickPay,
                    amount: Number(billData?.billAmount) || 0,
                    accessKey: accessKeys.postpaid,
                    additionalInfo,
                    customerParams,
                    billerResponse: { ...billerResponse },
                    ccf1Amount: surchargeData ? surchargeData.ccf1Amount || null : null,
                };
                let maximumAmount: number | undefined;
                let minimumAmount: number | undefined;
                switch (billData.exactness || '') {
                    case billAmountType.above:
                        minimumAmount = Number(amount);
                        break;
                    case billAmountType.below:
                        maximumAmount = Number(amount);
                        break;
                    default:
                        break;
                }

                dispatch(
                    setPaymentData({
                        billSummary,
                        paymentSummary,
                        totalAmount: total,
                        title: 'Recharge Summary',
                        payload: requestBody,
                        url: 'payment/postpaid/payment',
                        earningCashbackAmount:
                            Number(surchargeData && surchargeData?.corporateCashback) || 0,
                        ...tightenWithChannelBound(minimumAmount, maximumAmount, channelBound),
                        creditBalance,
                        navigatePath: `${paths.dashboard.mobileRecharge}/${paths.telecomPayments.postpaid}`,
                    })
                );
                sessionStorage.setItem(
                    'service_details',
                    JSON.stringify({
                        serviceDetails: {
                            service_provider: billerName || serviceProvider,
                            number: Object.values(rest)[0] as string,
                        },
                    })
                );
                setIsLoading(false);
                navigate(paths.dashboard.payments);
            }
            setIsLoading(false);
        },
        [dispatch, id, navigate, role]
    );
    const handleTestPay = useCallback(
        async (values: any, billerName?: string) => {
            setIsLoading(true);

            const { serviceProvider, ...rest } = values;

            const entries = Object.entries(rest);
            let customerParams = {};
            if (entries.length === 1) {
                const [paramName, paramValue] = entries[0];
                customerParams = {
                    input: {
                        paramName,
                        paramValue: paramValue as string,
                    },
                };
            } else {
                customerParams = {
                    input: entries.map(([paramName, paramValue]) => ({
                        paramName,
                        paramValue: paramValue as string,
                    })),
                };
            }

            // const customerParams = Object.entries(rest).map(
            //     ([name, value]): { name: string; value: string } => ({
            //         name,
            //         value: value as string,
            //     })
            // );

            const fetchBillPayload = {
                userId: id,
                userType: role,
                billerId: serviceProvider,
                customerParams,
            };
            const billData: FetchBillResponse | false = await fetchBillTest(fetchBillPayload);

            if (billData) {
                const { requestId, additionalInfo, ...billerResponse } = billData;
                const { billAmount: amount, customerName } = billerResponse;

                const surchargeData: SurchargeResponse | false = await getSurcharge({
                    userId: id,
                    userType: role,
                    amount: Number(amount),
                    accessKey: accessKeys.test,
                });
                let total = 0;
                if (surchargeData) {
                    total = Number(amount) + Number(surchargeData.surcharge);
                } else {
                    total = Number(amount);
                }

                const billSummary = [
                    {
                        key: 'Service name',
                        value: 'OTME',
                    },
                    {
                        key: 'Customer name',
                        value: sanitizeBillerName(customerName),
                    },
                    {
                        key: 'Due date',
                        value: billerResponse?.dueDate,
                    },
                    {
                        key: 'Amount',
                        value: formatNumberWithLocalString(Number(amount) ?? 0),
                    },
                ];
                const paymentSummary = [
                    {
                        key: 'Platform fee (inclusive of GST)',
                        value: `₹ ${formatNumberWithLocalString((surchargeData && surchargeData.surcharge) || 0)}`,
                    },
                ];

                const requestBody = {
                    billerId: serviceProvider,
                    billerName,
                    requestId: requestId || '',
                    amount: Number(billData?.billAmount) || 0,
                    accessKey: accessKeys.test,
                    additionalInfo,
                    currentUrl: window.location.href,
                    customerParams,
                    billerResponse: { ...billerResponse }, // Creates a new object without additionalInfo
                };
                let maximumAmount: number | undefined;
                let minimumAmount: number | undefined;
                switch (billData.exactness || '') {
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

                dispatch(
                    setPaymentData({
                        billSummary,
                        paymentSummary,
                        totalAmount: total,
                        title: 'Recharge Summary',
                        payload: requestBody,
                        url: 'payment/test/payment',
                        earningCashbackAmount:
                            Number(surchargeData && surchargeData?.corporateCashback) || 0,
                        minimumAmount,
                        maximumAmount,
                        navigatePath: `${paths.dashboard.mobileRecharge}/${paths.telecomPayments.test}`,
                    })
                );
                setIsLoading(false);

                navigate(paths.dashboard.payments);
            }
        },
        [dispatch, id, navigate, role]
    );
    const handleBeneficiaryPay = async (beneficiary: Beneficiary, pathname: string) => {
        setIsLoading(true);
        const { customerParams, billerId, accessKey } = beneficiary;

        const prepaidPath = `${paths.dashboard.mobileRecharge}/${paths.telecomPayments.prepaid}`;

        if (accessKey === accessKeys.prepaid) {
            if (pathname === prepaidPath) {
                dispatch(setPrepaidBeneficiary(beneficiary));
            } else {
                navigate(prepaidPath, { state: beneficiary });
            }
        } else {
            const values: { [key: string]: string } = { serviceProvider: billerId! };
            customerParams.forEach((item: any) => {
                values[item.name] = item.value;
            });

            let selectedBiller: OptionsType | undefined;
            if (billerId) {
                const billerCategory =
                    accessKey === accessKeys.postpaid
                        ? BBPSCategoryName.postpaid
                        : BBPSCategoryName.test;
                const result = await getServiceProvider({
                    userId: id,
                    userType: role,
                    categoryName: billerCategory,
                    searchText: billerId,
                });
                if (result && result.billersArray) {
                    const biller = result.billersArray.find((b: any) => b.billerId === billerId);
                    if (biller) {
                        selectedBiller = {
                            value: biller.billerId,
                            label: biller.billerName,
                            customerParams: [],
                            billerFetchRequiremet: biller.billerFetchRequiremet ?? '',
                            billerFetchRequirement: biller.billerFetchRequirement ?? '',
                            billerSupportBillValidation: biller.billerSupportBillValidation ?? '',
                            billerAdhoc: biller.billerAdhoc ?? '',
                        };
                    }
                }
            }

            await handlePostpaidPay(values, beneficiary.serviceProvider, selectedBiller);
        }
        setIsLoading(false);
    };

    return { handlePrepaidPay, handlePostpaidPay, handleBeneficiaryPay, isLoading, handleTestPay };
}
