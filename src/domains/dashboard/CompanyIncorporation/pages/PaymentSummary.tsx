import { useEffect, useState } from 'react';

import { InfoCircleFilled, LoadingOutlined } from '@ant-design/icons';
import { Button, Divider, Flex, Image, Skeleton, Spin, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import cashfreeLogo from '@assets/images/cashfreeLogo.png';
import { paths } from '@routes/paths';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { getSurcharge } from '@src/services/surcharge';
import { accessKeys } from '@utils/accessKeys';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import pekoLogo from '../../payments/assets/svg/peko-logo.svg';
import useGetAllPaymentMode from '../../payments/hooks/useGetAllPaymentMode';
import usePaymentApi from '../../payments/hooks/usePaymentApi';
import useWalletApi from '../../payments/hooks/useWalletApi';
import { setPaymentData } from '../../payments/slices/payment';
import { PaymentMode } from '../../payments/types/index';
import { getApplicationDetail, getApplications, getLandingConfig } from '../api';
import { setSubmittedApplication, updateApplicationData } from '../slices/incorporationSlice';
import { ApplicationStatus, EntityType } from '../types';
// import { POST_INCORPORATION_SERVICES } from '../utils/data';

const { Title, Paragraph, Text } = Typography;

const PaymentSummary = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const { user } = useAppSelector(state => state.reducer.user);
    const {
        submittedApplication,
        // selectedServices: selectedServiceIds,
        currentApplication,
    } = useAppSelector(state => state.reducer.incorporation);

    const totalAmount = submittedApplication?.totalAmount ?? 0;
    const mcaFilingFee = submittedApplication?.mcaFilingFee ?? 0;
    const applicationId = submittedApplication?.applicationId ?? '';
    const entityType = currentApplication?.entityType;
    const authorisedCapital = currentApplication?.capital?.authorizedCapital ?? 0;
    const formattedCapital = authorisedCapital.toLocaleString('en-IN');

    // On reload, Redux is empty. Re-hydrate `submittedApplication` +
    // `currentApplication` from the BE so the page can render normally instead
    // of bouncing the user back to the form. Only redirects (to Landing) when
    // the user genuinely has no PENDING application.
    const [isHydrating, setIsHydrating] = useState(!applicationId);

    useEffect(() => {
        if (applicationId) {
            setIsHydrating(false);
            return () => {};
        }
        let cancelled = false;
        const rehydrate = async () => {
            const list = await getApplications({ userId: Number(id), userType: role });
            if (cancelled) return;
            const pending = (list && Array.isArray(list.applications) ? list.applications : [])
                .filter(a => a.status === ApplicationStatus.PENDING)
                .sort(
                    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                )[0];
            if (!pending) {
                navigate(paths.companyIncorporation.index, { replace: true });
                return;
            }
            const detail = await getApplicationDetail({
                userId: Number(id),
                userType: role,
                applicationId: pending.applicationId,
            });
            if (cancelled) return;
            const source = (detail || pending) as typeof pending & { mcaFilingFee?: number };
            dispatch(
                setSubmittedApplication({
                    applicationId: source.applicationId,
                    totalAmount: source.totalAmount ?? 0,
                    mcaFilingFee: source.mcaFilingFee ?? 0,
                    status: source.status,
                    createdAt: source.createdAt,
                })
            );
            dispatch(
                updateApplicationData({
                    entityType: source.entityType,
                    capital: source.capital,
                })
            );
            setIsHydrating(false);
        };
        rehydrate();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedServiceIds);
    const [checkoutJsInstance, setCheckoutJsInstance] = useState<any>(null);
    const [selectedMethod, setSelectedMethod] = useState<PaymentMode>(PaymentMode.empty);
    const [surcharge, setSurcharge] = useState(0);
    const [cashbackAmount, setCashbackAmount] = useState(0);
    const [isSurchargeLoading, setIsSurchargeLoading] = useState(false);
    const [surchargeReady, setSurchargeReady] = useState(false);

    // Fetch latest incorporation fee from admin config so admin price changes
    // propagate to pending applications instead of using the snapshot stored
    // on the application row at apply-time.
    const [liveBaseFee, setLiveBaseFee] = useState<number | null>(null);
    const [isConfigLoading, setIsConfigLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const fetchConfig = async () => {
            const data = await getLandingConfig({ userId: id, userType: role });
            if (cancelled) return;
            if (data && typeof data.incorporationFee === 'number') {
                setLiveBaseFee(data.incorporationFee);
            }
            setIsConfigLoading(false);
        };
        fetchConfig();
        return () => {
            cancelled = true;
        };
    }, [id, role]);

    // Use live admin fee when available; fall back to the snapshot if config fetch fails.
    // Separate base fee from services included at submission time
    // const originalServicesData = POST_INCORPORATION_SERVICES.filter(s =>
    //     selectedServiceIds.includes(s.id)
    // );
    // const originalServicesFee = originalServicesData.reduce((sum, s) => sum + s.price, 0);
    const baseIncorporationFee = liveBaseFee ?? Math.max(totalAmount - mcaFilingFee, 0);

    // const toggleService = (svcId: string) =>
    //     setLocalSelectedIds(prev =>
    //         prev.includes(svcId) ? prev.filter(x => x !== svcId) : [...prev, svcId]
    //     );

    // const localSelectedServicesData = POST_INCORPORATION_SERVICES.filter(s =>
    //     localSelectedIds.includes(s.id)
    // );
    // const newServicesFee = localSelectedServicesData.reduce((sum, s) => sum + s.price, 0);
    const newSubtotal = baseIncorporationFee + mcaFilingFee;
    const grandTotal = newSubtotal + surcharge;

    const {
        handleWalletPaymentRequest,
        handlePaytmPaymentRequest,
        isLoading,
        isSpinnerLoading,
        loadCheckoutScript,
    } = usePaymentApi({
        checkoutJsInstance,
        setCheckoutJsInstance,
        successBasePath: paths.dashboard.payments,
    });

    const { walletData } = useWalletApi();
    const { isPgOptionsLoading, availablePgOptions, isPgDown } = useGetAllPaymentMode();

    // Initial effect: dispatch base data so payment modes load, then fetch surcharge.
    // Waits for the live config to resolve so surcharge is computed against the
    // current (post-admin-edit) price, not the snapshotted one.
    useEffect(() => {
        if (!applicationId || !newSubtotal || isConfigLoading) return;

        const billSummary = [
            { key: 'Service', value: 'Company Incorporation' },
            { key: 'Application ID', value: applicationId },
        ];

        dispatch(
            setPaymentData({
                billSummary,
                paymentSummary: [
                    {
                        key: 'Incorporation Fee',
                        value: `₹ ${formatNumberWithLocalString(baseIncorporationFee)}`,
                    },
                    ...(entityType !== EntityType.LLP
                        ? [
                              {
                                  key: `Government Fees (Authorised Capital: ₹${formattedCapital})`,
                                  value: `₹ ${formatNumberWithLocalString(mcaFilingFee)}`,
                              },
                          ]
                        : []),
                ],
                totalAmount: newSubtotal,
                title: 'Company Incorporation',
                payload: {
                    accessKey: accessKeys.companyIncorporation,
                    applicationId,
                    amount: newSubtotal,
                    payCashback: false,
                },
                url: 'payment-gateway/company-incorporation/payment',
                navigatePath: `${paths.companyIncorporation.index}/${paths.companyIncorporation.tracking}`,
            })
        );

        const fetchSurcharge = async () => {
            setIsSurchargeLoading(true);
            const data = await getSurcharge({
                userId: id,
                userType: role,
                amount: newSubtotal,
                accessKey: accessKeys.companyIncorporation,
            });
            const fetchedSurcharge = data ? parseFloat(data.surcharge) || 0 : 0;
            const fetchedCashback = data ? parseFloat(data.corporateCashback) || 0 : 0;
            setSurcharge(fetchedSurcharge);
            setCashbackAmount(fetchedCashback);
            setIsSurchargeLoading(false);
            setSurchargeReady(true);
        };

        fetchSurcharge();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [applicationId, newSubtotal, isConfigLoading]);

    // Re-dispatch payment data whenever services selection or surcharge changes
    useEffect(() => {
        if (!applicationId || !surchargeReady) return;

        const billSummary = [
            { key: 'Service', value: 'Company Incorporation' },
            { key: 'Application ID', value: applicationId },
        ];

        dispatch(
            setPaymentData({
                billSummary,
                paymentSummary: [
                    {
                        key: 'Incorporation Fee',
                        value: `₹ ${formatNumberWithLocalString(baseIncorporationFee)}`,
                    },
                    ...(entityType !== EntityType.LLP
                        ? [
                              {
                                  key: `Government Fees (Authorised Capital: ₹${formattedCapital})`,
                                  value: `₹ ${formatNumberWithLocalString(mcaFilingFee)}`,
                              },
                          ]
                        : []),
                    // ...localSelectedServicesData.map(s => ({
                    //     key: s.name,
                    //     value: `₹ ${formatNumberWithLocalString(s.price)}`,
                    // })),
                    ...(surcharge > 0
                        ? [
                              {
                                  key: 'Platform Fee',
                                  value: `₹ ${formatNumberWithLocalString(surcharge)}`,
                              },
                          ]
                        : []),
                ],
                totalAmount: grandTotal,
                title: 'Company Incorporation',
                payload: {
                    accessKey: accessKeys.companyIncorporation,
                    applicationId,
                    amount: newSubtotal,
                    payCashback: false,
                },
                url: 'payment-gateway/company-incorporation/payment',
                navigatePath: `${paths.companyIncorporation.index}/${paths.companyIncorporation.tracking}`,
                earningCashbackAmount: cashbackAmount,
            })
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [surchargeReady, surcharge]);

    useEffect(() => {
        loadCheckoutScript();
    }, [loadCheckoutScript]);

    const showWalletOption =
        user?.roleName !== 'corporate sub user' && availablePgOptions.wallet.available;

    const isWalletDisabled =
        Number(walletData?.balance ?? 0) <= 0 || Number(walletData?.balance ?? 0) < grandTotal;

    const handlePay = async () => {
        if (selectedMethod === PaymentMode.wallet) {
            handleWalletPaymentRequest();
        } else if (selectedMethod === PaymentMode.PAYTM) {
            await handlePaytmPaymentRequest({
                isChecked: false,
                balance: Number(walletData?.balance ?? 0),
                gateway: availablePgOptions.gateway.provider,
            });
        }
    };

    const isPayDisabled =
        !applicationId ||
        selectedMethod === PaymentMode.empty ||
        isLoading ||
        isSurchargeLoading ||
        isConfigLoading;

    if (isHydrating) {
        return (
            <div className="bg-white min-h-screen p-3 sm:p-6">
                <div className="max-w-4xl mx-auto">
                    <Skeleton active paragraph={{ rows: 10 }} title />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen p-3 sm:p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-6 sm:mb-12">
                    <Title
                        level={2}
                        className="!text-[20px] sm:!text-[28px] !font-semibold !text-neutral-950 !mb-2"
                    >
                        Incorporate Your Company
                    </Title>
                    <Paragraph className="!mb-0 text-[13px] sm:text-[16px] text-[rgba(56,56,56,0.75)]">
                        Complete digital company registration with the Ministry of Corporate Affairs
                        (MCA)
                    </Paragraph>
                </div>

                {/* Main Card */}
                <div className="bg-white border border-[#e6e3dd] rounded-[24px] sm:rounded-[36px] p-4 sm:p-14 space-y-6 sm:space-y-10">
                    <div>
                        <Title
                            level={3}
                            className="!text-[20px] sm:!text-[28px] !font-medium !text-neutral-950 !mb-2"
                        >
                            Payment
                        </Title>
                        <Paragraph className="!mb-0 text-[13px] sm:text-[16px] text-slate-500">
                            Complete your payment to submit the incorporation application
                        </Paragraph>
                    </div>

                    {/* Breakdown Card */}
                    <div className="border border-[rgba(196,196,196,0.8)] rounded-[16px] sm:rounded-[24px] p-4 sm:p-8 space-y-6 sm:space-y-8">
                        {/* Post-Incorporation Services — commented out for future use
                        <div className="space-y-4">
                            <Paragraph className="!mb-0 !text-[20px] !font-bold !text-textDarkNavy">
                                Add Post-Incorporation Services{' '}
                                <span className="text-slate-500 font-normal">(Optional)</span>
                            </Paragraph>
                            <div className="flex flex-col gap-4">
                                {POST_INCORPORATION_SERVICES.map(svc => {
                                    const isSelected = localSelectedIds.includes(svc.id);
                                    return (
                                        <div
                                            key={svc.id}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => toggleService(svc.id)}
                                            onKeyDown={e =>
                                                e.key === 'Enter' && toggleService(svc.id)
                                            }
                                            className={`flex items-center justify-between px-6 py-4 rounded-[16px] cursor-pointer transition-colors ${
                                                isSelected
                                                    ? 'bg-[#fff7f6] border border-lightRed'
                                                    : 'bg-white border-[0.5px] border-[#ccc]'
                                            }`}
                                        >
                                            <Flex gap={16} align="center">
                                                <Checkbox
                                                    checked={isSelected}
                                                    onChange={() => toggleService(svc.id)}
                                                    onClick={e => e.stopPropagation()}
                                                />
                                                <div className="flex flex-col gap-0.5">
                                                    <Text className="!text-[16px] !font-semibold !text-slate-800 !leading-[24px]">
                                                        {svc.name}
                                                    </Text>
                                                    <Text className="!text-[14px] !text-slate-500 !leading-[20px] !tracking-[0.14px]">
                                                        {svc.description}
                                                    </Text>
                                                </div>
                                            </Flex>
                                            <Text className="!text-[20px] !font-semibold !text-slate-600 whitespace-nowrap">
                                                ₹{formatNumberWithLocalString(svc.price)}
                                            </Text>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <Divider style={{ borderColor: 'rgba(0,0,0,0.1)', margin: 0 }} />
                        */}

                        {/* Payment Breakdown */}
                        <div className="space-y-4">
                            <Paragraph className="!mb-0 !text-[15px] sm:!text-[20px] !font-bold !text-textDarkNavy">
                                Payment Breakdown
                            </Paragraph>
                            <div className="flex flex-col gap-[17px]">
                                <div className="flex items-start justify-between gap-4 text-[12px] sm:text-[16px]">
                                    <Text className="!text-slate-800 flex-1">
                                        Company Incorporation
                                    </Text>
                                    <Text className="!text-textDarkNavy whitespace-nowrap flex-shrink-0">
                                        ₹{formatNumberWithLocalString(baseIncorporationFee)}
                                    </Text>
                                </div>
                                {entityType !== EntityType.LLP && (
                                    <div className="flex items-start justify-between gap-4 text-[12px] sm:text-[16px]">
                                        <Text className="!text-slate-800 flex-1">
                                            Government Fees (Authorised Capital: ₹{formattedCapital}
                                            )
                                        </Text>
                                        <Text className="!text-textDarkNavy whitespace-nowrap flex-shrink-0">
                                            ₹{formatNumberWithLocalString(mcaFilingFee)}
                                        </Text>
                                    </div>
                                )}
                                {/* localSelectedServicesData.map — commented out for future use
                                {localSelectedServicesData.map(svc => (
                                    <Flex
                                        key={svc.id}
                                        justify="space-between"
                                        className="text-[16px]"
                                    >
                                        <Text className="!text-slate-800">{svc.name}</Text>
                                        <Text className="!text-textDarkNavy">
                                            ₹{formatNumberWithLocalString(svc.price)}
                                        </Text>
                                    </Flex>
                                ))}
                                */}
                                {surcharge > 0 && (
                                    <div className="flex items-start justify-between gap-4 text-[12px] sm:text-[16px]">
                                        <Text className="!text-slate-800 flex-1">Platform Fee</Text>
                                        {isSurchargeLoading ? (
                                            <Skeleton.Input
                                                active
                                                size="small"
                                                style={{ width: 80 }}
                                            />
                                        ) : (
                                            <Text className="!text-textDarkNavy whitespace-nowrap flex-shrink-0">
                                                ₹{formatNumberWithLocalString(surcharge)}
                                            </Text>
                                        )}
                                    </div>
                                )}
                                {/* Subtotal row — commented out for future use
                                {localSelectedServicesData.length > 0 && (
                                    <Flex
                                        justify="space-between"
                                        className="text-[16px] font-semibold"
                                    >
                                        <Text className="!text-slate-800">
                                            Subtotal (Peko Charges)
                                        </Text>
                                        <Text className="!text-textDarkNavy">
                                            ₹{formatNumberWithLocalString(newSubtotal)}
                                        </Text>
                                    </Flex>
                                )}
                                */}
                            </div>
                        </div>

                        <Divider style={{ borderColor: 'rgba(0,0,0,0.1)', margin: 0 }} />

                        {/* Total */}
                        <div className="flex items-center justify-between gap-4">
                            <Text className="!text-[15px] sm:!text-[20px] !font-bold !text-textDarkNavy flex-1">
                                Total Amount
                            </Text>
                            {isSurchargeLoading ? (
                                <Skeleton.Input active size="small" style={{ width: 100 }} />
                            ) : (
                                <Text className="!text-[15px] sm:!text-[20px] !font-bold !text-textDarkNavy whitespace-nowrap flex-shrink-0">
                                    ₹{formatNumberWithLocalString(grandTotal)}
                                </Text>
                            )}
                        </div>

                    </div>

                    {/* Payment Method Card */}
                    {isPgOptionsLoading ? (
                        <Skeleton active paragraph={{ rows: 4 }} />
                    ) : (
                        <div className="bg-bgGrayF9 border-[0.5px] border-[rgba(204,204,204,0.8)] rounded-[16px] sm:rounded-[24px] p-4 sm:p-[30px]">
                            <div className="flex flex-col gap-[15px] w-full">
                                <Paragraph className="!mb-0 text-[16px] sm:text-[20px] font-bold text-textDarkNavy">
                                    Payment Method
                                </Paragraph>

                                <div className="flex flex-col gap-[41px] w-full">
                                    {/* Wallet */}
                                    {showWalletOption && (
                                        <div
                                            role="button"
                                            tabIndex={isWalletDisabled ? -1 : 0}
                                            onClick={() =>
                                                !isWalletDisabled &&
                                                setSelectedMethod(PaymentMode.wallet)
                                            }
                                            onKeyDown={e =>
                                                e.key === 'Enter' &&
                                                !isWalletDisabled &&
                                                setSelectedMethod(PaymentMode.wallet)
                                            }
                                            className={`bg-white border rounded-[10px] flex items-center justify-between px-4 sm:pl-[29px] sm:pr-[24px] py-[13px] min-h-[83px] transition-colors ${
                                                selectedMethod === PaymentMode.wallet
                                                    ? 'border-lightRed'
                                                    : 'border-[#e4e7ec]'
                                            } ${isWalletDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                        >
                                            <Flex gap={8} align="center">
                                                <Text className="text-[14px] sm:text-[18px] font-semibold text-slate-800">
                                                    Wallet
                                                </Text>
                                                {walletData?.balance !== undefined && (
                                                    <Text className="text-[12px] sm:text-[14px] text-slate-500">
                                                        (₹
                                                        {formatNumberWithLocalString(
                                                            walletData.balance
                                                        )}
                                                        )
                                                    </Text>
                                                )}
                                            </Flex>
                                            <div className="bg-white rounded-[5px] h-[37px] w-[35px] flex items-center justify-center shrink-0">
                                                <Image
                                                    src={pekoLogo}
                                                    alt="Peko Wallet"
                                                    preview={false}
                                                    height={20}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Cashfree */}
                                    {!isPgDown && availablePgOptions.gateway.available && (
                                        <div
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => setSelectedMethod(PaymentMode.PAYTM)}
                                            onKeyDown={e =>
                                                e.key === 'Enter' &&
                                                setSelectedMethod(PaymentMode.PAYTM)
                                            }
                                            className={`bg-white border rounded-[10px] flex items-center justify-between px-4 sm:px-[24px] py-[13px] min-h-[83px] cursor-pointer transition-colors ${
                                                selectedMethod === PaymentMode.PAYTM
                                                    ? 'border-lightRed'
                                                    : 'border-[#e4e7ec]'
                                            }`}
                                        >
                                            <Text className="text-[13px] sm:text-[16px] font-medium text-slate-800">
                                                Debit/Credit/ATM Cards
                                            </Text>
                                            <Image
                                                src={cashfreeLogo}
                                                alt="Cashfree"
                                                preview={false}
                                                height={14}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Terms */}
                    <Flex
                        gap={12}
                        className="bg-[rgba(37,99,235,0.04)] border border-[rgba(0,0,0,0.04)] rounded-[16px] p-4"
                    >
                        <InfoCircleFilled
                            className="flex-shrink-0 text-[32px]"
                            style={{ color: '#2563eb' }}
                        />
                        <Paragraph className="!mb-0 text-[16px] text-[rgba(37,99,235,0.8)]">
                            I agree to the Terms &amp; Conditions and authorize Peko to process this
                            payment and submit my incorporation application to MCA.
                        </Paragraph>
                    </Flex>

                    {/* Action Buttons */}
                    <Flex gap={32}>
                        <Button
                            danger
                            type="primary"
                            size="large"
                            onClick={handlePay}
                            disabled={isPayDisabled}
                            loading={isLoading}
                            className="flex-1 !text-[16px] !font-medium !rounded-[8px]"
                        >
                            {isSurchargeLoading || isConfigLoading
                                ? 'Loading...'
                                : `Pay ₹${formatNumberWithLocalString(grandTotal)}`}
                        </Button>
                    </Flex>
                </div>
            </div>

            {isSpinnerLoading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-60">
                    <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                </div>
            )}
        </div>
    );
};

export default PaymentSummary;
