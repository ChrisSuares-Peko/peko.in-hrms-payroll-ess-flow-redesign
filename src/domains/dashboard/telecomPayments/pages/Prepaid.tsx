import React, { useEffect, useState } from 'react';

import { CalendarOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Col, Divider, Flex, Image, Input, Radio, Row, Spin, Tabs, Typography } from 'antd';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';

import back from '@assets/svg/grayBack.svg';
import { setData } from '@src/domains/dashboard/billPayments/slices/beneficiary';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';
import { accessKeys } from '@utils/accessKeys';
import { formatNumberWithLocalString } from '@utils/priceFormat';
import { removeEmoji } from '@utils/regex';

import { AddBeneficiaryApi, getPrepaidPlans } from '../api/index';
import airtelLogo from '../assets/icons/airtel.png';
import bsnlLogo from '../assets/icons/bsnl.png';
import jioLogo from '../assets/icons/jio.png';
import viLogo from '../assets/icons/vi.png';
import BeneficiariesList from '../components/BeneficiariesList';
import PrepaidForm from '../components/forms/PrepaidForm';
import useGeneralApi from '../hooks/useGeneralApi';
import useMobileRechargeProviders from '../hooks/useMobileRechargeProviders';
import usePayment from '../hooks/usePayment';
import useValidateRecharge from '../hooks/useValidateRecharge';
import { MobilePlan, PrepaidFormData } from '../types';

const { Text } = Typography;

const providerLogos: Record<string, string> = {
    AIRTEL: airtelLogo,
    JIO: jioLogo,
    VI: viLogo,
    BSNL: bsnlLogo,
};

const categoryMapping: Record<string, string> = {
    'Data Add On': 'Data Packs',
    Jiophone: 'JioPhone',
    Smartphone: 'Popular Plans',
    'Topup Plan': 'Top-Up Plan',
};

const extractDataUsage = (description: string): string | null => {
    const match = description.match(/(\d+(?:\.\d+)?\s?(?:GB|MB)(?:\/day)?)/i);
    return match ? match[0] : null;
};

const extractCalls = (description: string): string | null => {
    if (/unlimited.*call/i.test(description)) return 'Unlimited calls';
    const callMatch = description.match(/(\d+)\s*(?:mins?|minutes?)/i);
    return callMatch ? `${callMatch[1]} min calls` : null;
};

const sortByAmount = (a: MobilePlan, b: MobilePlan) => a.Amount - b.Amount;

const planIdentity = (p: MobilePlan) => p.planId ?? `${p.Amount}|${p.Validity}|${p.Description}`;

const cheapestPlanInCategory = (plans: MobilePlan[], category?: string): MobilePlan | null =>
    plans.filter(p => p.PlanName === category).sort(sortByAmount)[0] ?? null;

// Cheapest plan in the first-displayed category — used as the default selection.
const firstSelectablePlan = (plans: MobilePlan[], categories: string[]): MobilePlan | null =>
    cheapestPlanInCategory(plans, [...categories].reverse()[0]);

const Prepaid: React.FC = () => {
    const accessKey = accessKeys.prepaid;
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const refresh = useAppSelector(state => state.reducer.beneficiary.refresh);
    const dispatch = useAppDispatch();

    const [showPlans, setShowPlans] = useState(false);
    const [formData, setFormData] = useState<PrepaidFormData | null>(null);
    const [plansData, setPlansData] = useState<MobilePlan[]>([]);
    const [planCategories, setPlanCategories] = useState<string[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<MobilePlan | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('0');
    const [isPayLoading, setIsPayLoading] = useState(false);

    const { validateRecharge } = useValidateRecharge();
    const { handlePrepaidPay } = usePayment();
    const { stateData } = useGeneralApi();
    const { prepaidProviders } = useMobileRechargeProviders();
    const { state: locationState } = useLocation();
    const { prepaidBeneficiary } = useAppSelector(state => state.reducer.benficiaryPrepaid);
    const [isFetchingPlans, setIsFetchingPlans] = useState(false);

    useEffect(() => {
        if (typeof Moengage?.track_event === 'function') {
            Moengage.track_event('prepaid_started');
        }
    }, []);

    useEffect(() => {
        let cancelled = false;

        const fromLocation = locationState && locationState.phoneNo ? locationState : null;
        const fromRedux =
            prepaidBeneficiary.phoneNo && prepaidBeneficiary.serviceProvider
                ? prepaidBeneficiary
                : null;
        const beneficiary = fromLocation || fromRedux;

        if (
            !showPlans &&
            beneficiary?.serviceProvider &&
            beneficiary?.providerCircle &&
            beneficiary?.phoneNo
        ) {
            setIsFetchingPlans(true);
            getPrepaidPlans({
                userType: role,
                userId: id,
                serviceProvider: beneficiary.serviceProvider,
                location: beneficiary.providerCircle,
                mobileNumber: beneficiary.phoneNo,
            }).then(data => {
                if (cancelled) return;
                setIsFetchingPlans(false);
                if (data !== false) {
                    const providerLabel =
                        prepaidProviders.find(p => p.value === beneficiary.serviceProvider)
                            ?.label || beneficiary.serviceProvider;
                    const circleLabel =
                        stateData?.find(s => s.value === beneficiary.providerCircle)?.label ||
                        beneficiary.providerCircle;
                    setFormData({
                        mobileNumber: beneficiary.phoneNo,
                        serviceProvider: beneficiary.serviceProvider,
                        circle: beneficiary.providerCircle,
                        providerLabel,
                        circleLabel,
                        saveToBeneficiaries: false,
                        beneficiaryName: '',
                    });
                    setPlansData(data.plans);
                    setPlanCategories(data.planCategory);
                    setSelectedPlan(firstSelectablePlan(data.plans, data.planCategory));
                    setSearchQuery('');
                    setActiveTab('0');
                    setShowPlans(true);
                }
            });
        }

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [prepaidBeneficiary, locationState]);

    const handleProceed = async (
        values: PrepaidFormData,
        plans: MobilePlan[],
        categories: string[]
    ) => {
        if (values.saveToBeneficiaries) {
            const prepaidFields: any = {
                phoneNo: values.mobileNumber,
                serviceProvider: values.serviceProvider,
                providerCircle: values.circle,
            };
            const data = await AddBeneficiaryApi({
                userId: id,
                userType: role,
                accessKey: accessKeys.prepaid,
                name: values.beneficiaryName || values.mobileNumber,
                isActive: '1',
                credentialId: String(id),
                ...prepaidFields,
            });
            if (!data || !data.status) return;
            dispatch(showToast({ description: 'Saved to beneficiaries', variant: 'success' }));
            dispatch(setData({ refresh: !refresh, isLoading: false }));
        }

        setFormData(values);
        setPlansData(plans);
        setPlanCategories(categories);
        setSelectedPlan(firstSelectablePlan(plans, categories));
        setSearchQuery('');
        setActiveTab('0');
        setShowPlans(true);
    };

    const handleTabChange = (key: string) => {
        setActiveTab(key);
        const category = [...planCategories].reverse()[Number(key)];
        setSelectedPlan(cheapestPlanInCategory(plansData, category));
    };

    const handlePay = async () => {
        if (!formData || !selectedPlan) return;
        setIsPayLoading(true);
        try {
            const validationResponse = await validateRecharge({
                serviceProvider: formData.serviceProvider,
                mobileNo: formData.mobileNumber,
                amount: String(selectedPlan.Amount),
                userType: role,
                userId: id,
            });
            if (!validationResponse || validationResponse.StatusCode !== '0') {
                dispatch(
                    showToast({
                        description: 'Something went wrong, please try again later',
                        variant: 'error',
                    })
                );
                return;
            }
            await handlePrepaidPay({
                mobileNumber: formData.mobileNumber,
                serviceProvider: formData.serviceProvider,
                circle: formData.circle,
                amount: String(selectedPlan.Amount),
            });
        } catch {
            dispatch(
                showToast({
                    description: 'Something went wrong, please try again later',
                    variant: 'error',
                })
            );
        } finally {
            setIsPayLoading(false);
        }
    };

    const renderPlanCard = (plan: MobilePlan, index: number) => {
        const dataUsage = extractDataUsage(plan.Description);
        const calls = extractCalls(plan.Description);
        const hasValidity = plan.Validity && plan.Validity.trim().toUpperCase() !== 'NA';
        const isSelected = selectedPlan === plan;

        return (
            <div
                key={`${planIdentity(plan)}-${index}`}
                role="button"
                tabIndex={0}
                className="bg-white rounded-[22px] px-7 py-6 relative cursor-pointer shadow-[0px_2px_16px_1px_rgba(0,0,0,0.06)]"
                onClick={() => setSelectedPlan(plan)}
                onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') setSelectedPlan(plan);
                }}
            >
                <Radio
                    checked={isSelected}
                    className="absolute right-6 top-6"
                    onChange={() => setSelectedPlan(plan)}
                />
                <Flex gap={32} align="center" className="mb-4 pr-8 flex-wrap">
                    <Text className="font-semibold text-lg">₹{plan.Amount}</Text>
                    {dataUsage && (
                        <Text className="text-base">
                            <span className="font-medium">{dataUsage}</span> data
                        </Text>
                    )}
                    {calls && <Text className="text-base">{calls}</Text>}
                    {hasValidity && (
                        <Flex align="center" gap={6}>
                            <CalendarOutlined className="text-sm" />
                            <Text className="text-base">
                                <span className="font-medium">{plan.Validity}</span> validity
                            </Text>
                        </Flex>
                    )}
                </Flex>
                <Divider className="my-3" />
                <Text className="text-sm text-[#5a5a5a] leading-7">{plan.Description}</Text>
            </div>
        );
    };

    const matchesSearch = (p: MobilePlan) => {
        const q = searchQuery.toLowerCase();
        return (
            p.Description.toLowerCase().includes(q) ||
            String(p.Amount).includes(q) ||
            (p.Validity?.toLowerCase().includes(q) ?? false)
        );
    };

    const searchRank = (p: MobilePlan) => {
        const q = searchQuery.toLowerCase();
        const amount = String(p.Amount);
        if (amount === q) return 0;
        if (amount.startsWith(q)) return 1;
        if (amount.includes(q)) return 2;
        return 3;
    };

    const seenPlans = new Set<string>();
    const searchResults = searchQuery
        ? plansData
              .filter(matchesSearch)
              .filter(p => {
                  const key = planIdentity(p);
                  if (seenPlans.has(key)) return false;
                  seenPlans.add(key);
                  return true;
              })
              .sort((a, b) => searchRank(a) - searchRank(b) || sortByAmount(a, b))
        : [];

    const tabs = [...planCategories].reverse().map((category, index) => {
        const plans = plansData.filter(plan => plan.PlanName === category).sort(sortByAmount);

        return {
            key: String(index),
            label: categoryMapping[category] || category,
            children: (
                <Flex vertical gap={12} className="xl:max-h-[65vh] xl:overflow-y-auto xl:pr-1">
                    {plans.length === 0 ? (
                        <Text className="text-textGray py-4">No plans found</Text>
                    ) : (
                        plans.map(renderPlanCard)
                    )}
                </Flex>
            ),
        };
    });

    if (!showPlans) {
        return (
            <>
                {isFetchingPlans &&
                    createPortal(
                        <div
                            style={{
                                position: 'fixed',
                                inset: 0,
                                zIndex: 9999,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'rgba(0,0,0,0.45)',
                            }}
                        >
                            <Spin size="large" />
                        </div>,
                        document.body
                    )}
                <Row>
                    <Col xl={13} className="w-full xl:sticky xl:top-0 h-fit">
                        <Flex vertical gap={30}>
                            <Text className="text-lg font-medium">Mobile Prepaid</Text>
                            <PrepaidForm onProceed={handleProceed} initialFormData={formData} />
                        </Flex>
                    </Col>
                    <Col
                        xl={{ span: 9, offset: 2 }}
                        className="w-full sm:bg-gray-50 rounded-3xl sm:p-6 mt-10 sm:mt-5 xl:mt-0"
                    >
                        <BeneficiariesList accessKeyName={accessKey} />
                    </Col>
                </Row>
            </>
        );
    }

    const providerLogoSrc = formData
        ? providerLogos[formData.serviceProvider.toUpperCase()]
        : undefined;

    return (
        <Row>
            <Col xl={14} className="w-full xl:sticky xl:top-0 h-fit">
                <Flex vertical gap={50}>
                    <Flex vertical gap={20} className="mt-4">
                        <Flex
                            align="center"
                            gap={8}
                            className="cursor-pointer w-fit"
                            onClick={() => setShowPlans(false)}
                        >
                            <Image
                                src={back}
                                alt="goback"
                                preview={false}
                                style={{ width: '1.5rem', height: '1.5rem' }}
                            />
                            <Typography.Text className="text-sm text-[#475569]">
                                Go Back
                            </Typography.Text>
                        </Flex>
                        {/* Provider summary card */}
                        <div className="bg-white rounded-[18px] shadow-[0px_2px_16px_1px_rgba(0,0,0,0.06)] px-4 sm:px-6 py-3 min-h-[82px] flex items-center">
                            <Flex align="center" justify="space-between" gap={8} className="w-full">
                                <Flex align="center" gap={12} className="min-w-0">
                                    {providerLogoSrc && (
                                        <img
                                            src={providerLogoSrc}
                                            alt={formData?.providerLabel}
                                            className="w-[50px] h-[50px] object-contain rounded-full shrink-0"
                                        />
                                    )}
                                    <Flex vertical gap={4} className="min-w-0">
                                        <Text className="font-medium text-base text-[#0a0a0a]">
                                            {formData?.providerLabel} Prepaid
                                        </Text>
                                        <Flex gap={8} align="center" wrap="wrap">
                                            <Text className="text-sm text-[#475569] whitespace-nowrap">
                                                +91 {formData?.mobileNumber}
                                            </Text>
                                            <Text className="font-semibold text-[#1e293b]">•</Text>
                                            <Text className="text-sm text-[#475569] whitespace-nowrap">
                                                {formData?.circleLabel}
                                            </Text>
                                        </Flex>
                                    </Flex>
                                </Flex>
                                <Button
                                    type="link"
                                    danger
                                    className="p-0 font-normal shrink-0 !rounded-lg text-sm"
                                    onClick={() => setShowPlans(false)}
                                >
                                    Edit
                                </Button>
                            </Flex>
                        </div>
                    </Flex>

                    {/* Available plans */}
                    <Flex vertical gap={20}>
                        <Text className="font-medium text-lg text-black">Available plans</Text>
                        <Input
                            placeholder="Search plan"
                            prefix={<SearchOutlined className="text-gray-400" />}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value.replace(removeEmoji, ''))}
                            size="large"
                            className="rounded-lg"
                        />
                        {searchQuery && (
                            <Flex
                                vertical
                                gap={12}
                                className="xl:max-h-[65vh] xl:overflow-y-auto xl:pr-1"
                            >
                                {searchResults.length === 0 ? (
                                    <Text className="text-textGray py-4">No plans found</Text>
                                ) : (
                                    searchResults.map(renderPlanCard)
                                )}
                            </Flex>
                        )}
                        {!searchQuery && tabs.length > 0 && (
                            <Tabs
                                activeKey={activeTab}
                                onChange={handleTabChange}
                                items={tabs}
                                className="w-full"
                            />
                        )}
                        {!searchQuery && tabs.length === 0 && (
                            <Text className="text-textGray py-4">
                                No plans available for this selection
                            </Text>
                        )}
                    </Flex>
                </Flex>
            </Col>

            {/* Order Summary */}
            <Col
                xl={{ span: 9, offset: 1 }}
                className="w-full mt-10 xl:mt-0 xl:sticky xl:top-4 xl:self-start"
            >
                <div className="border border-[#e4e7e9] rounded-[20px] shadow-[0px_4.5px_15.6px_-7.2px_rgba(0,0,0,0.08)] overflow-hidden">
                    <div className="px-5 py-[18px] border-b border-[#f0f0f0]">
                        <Text className="font-medium text-base text-[#191c1f]">Order Summary</Text>
                    </div>
                    <div className="px-5 py-5 flex flex-col gap-3">
                        <Flex justify="space-between" align="center">
                            <Text className="text-xs text-[#5f6c72]">Mobile number</Text>
                            <Text className="font-medium text-sm text-[rgba(0,0,0,0.87)]">
                                +91 {formData?.mobileNumber}
                            </Text>
                        </Flex>
                        <Flex justify="space-between" align="center">
                            <Text className="text-xs text-[#5f6c72]">Operator</Text>
                            <Text className="font-medium text-sm text-[#0a0a0a]">
                                {formData?.providerLabel}
                            </Text>
                        </Flex>
                        <Flex justify="space-between" align="center">
                            <Text className="text-xs text-[#5f6c72]">Selected plan</Text>
                            <Text className="font-medium text-xs text-[#191c1f]">
                                {selectedPlan
                                    ? `₹${formatNumberWithLocalString(selectedPlan.Amount)}`
                                    : '—'}
                            </Text>
                        </Flex>
                        <Flex justify="space-between" align="center">
                            <Text className="text-xs text-[#5f6c72]">Sub-total</Text>
                            <Text className="font-medium text-sm text-[#191c1f]">
                                {selectedPlan
                                    ? `₹${formatNumberWithLocalString(selectedPlan.Amount)}`
                                    : '—'}
                            </Text>
                        </Flex>
                        <Divider className="my-1" />
                        <Flex justify="space-between" align="center">
                            <Text className="text-sm text-[#191c1f]">Total</Text>
                            <Text className="font-semibold text-sm text-[#191c1f]">
                                {selectedPlan
                                    ? `₹${formatNumberWithLocalString(selectedPlan.Amount)}`
                                    : '—'}
                            </Text>
                        </Flex>
                    </div>
                    <div className="px-5 pb-5">
                        <Button
                            type="primary"
                            danger
                            block
                            size="large"
                            className="!rounded-lg !text-sm"
                            disabled={!selectedPlan}
                            loading={isPayLoading}
                            onClick={handlePay}
                        >
                            Proceed to Pay
                        </Button>
                    </div>
                </div>
            </Col>
        </Row>
    );
};

export default Prepaid;
