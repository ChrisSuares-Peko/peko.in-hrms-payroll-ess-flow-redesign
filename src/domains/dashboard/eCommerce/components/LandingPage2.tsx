import { Fragment, useMemo, useState } from 'react';

import { CheckCircleFilled, CloseCircleOutlined } from '@ant-design/icons';
import { Button, Flex, Skeleton, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';

import { accessKeys } from '@utils/accessKeys';

import { useGetEcommerceSubscription } from '../hooks/useGetEcommerceSubscription';
import useIsPurchased from '../hooks/useIsPurchased';
import usePayment from '../hooks/usePayment';
import { PackageDetails, PlanType } from '../types';

type PlanMeta = {
    tagline: string;
    ctaLabel: string;
    ctaVariant: 'soft' | 'primary';
    bestValue?: boolean;
};

const planMetaByName: Record<string, PlanMeta> = {
    Starter: {
        tagline: 'For solo sellers and new businesses',
        ctaLabel: 'Start with Starter',
        ctaVariant: 'primary',
    },
    Growth: {
        tagline: 'For growing SMEs ready to scale',
        ctaLabel: 'Choose Growth',
        ctaVariant: 'primary',
        bestValue: true,
    },
    Advanced: {
        tagline: 'Full power for established businesses',
        ctaLabel: 'Go Advanced',
        ctaVariant: 'primary',
    },
};

const fallbackMeta = (name: string, isMiddle: boolean): PlanMeta => ({
    tagline: '',
    ctaLabel: `Choose ${name}`,
    ctaVariant: isMiddle ? 'primary' : 'soft',
    bestValue: isMiddle,
});

const getPlanPricing = (pkg: PackageDetails, period: PlanType) => {
    const rawPrice =
        period === PlanType.Monthly ? pkg.packagePrices.monthly : pkg.packagePrices.annually;
    const fullPrice = parseFloat(rawPrice);
    const flatDiscount = Number(
        (period === PlanType.Monthly ? pkg.discount?.monthly : pkg.discount?.annually) ?? 0
    );
    const hasDiscount =
        Number.isFinite(fullPrice) &&
        fullPrice > 0 &&
        Number.isFinite(flatDiscount) &&
        flatDiscount > 0;
    const discount = hasDiscount ? Math.min(flatDiscount, fullPrice) : 0;
    const payable = Number.isFinite(fullPrice) ? fullPrice - discount : fullPrice;
    const percentOff = hasDiscount ? Math.round((discount / fullPrice) * 100) : 0;
    return { rawPrice, fullPrice, payable, discount, hasDiscount, percentOff };
};

type FeatureValue = string | boolean;

type FeatureRow = {
    label: string;
    values: FeatureValue[];
};

const parseValue = (raw: string): FeatureValue => {
    const v = raw.trim().toLowerCase();
    if (v === 'included' || v === 'true' || v === 'yes' || v === '✓' || v === 'check' || v === '1')
        return true;
    if (
        v === 'not included' ||
        v === 'false' ||
        v === 'no' ||
        v === '✗' ||
        v === 'x' ||
        v === '0' ||
        v === ''
    )
        return false;
    return raw.trim();
};

const parseDescription = (desc: string): Map<string, FeatureValue> => {
    const map = new Map<string, FeatureValue>();
    desc.split('\n').forEach(line => {
        const colon = line.indexOf(':');
        if (colon > 0) {
            const label = line.slice(0, colon).trim();
            const value = line.slice(colon + 1).trim();
            if (label) map.set(label, parseValue(value));
        }
    });
    return map;
};

const buildFeatureRows = (packages: PackageDetails[]): FeatureRow[] => {
    const planMaps = packages.map(p => parseDescription(p.description));
    const labels: string[] = [];
    const seen = new Set<string>();
    planMaps.forEach(m => {
        m.forEach((_, label) => {
            if (!seen.has(label)) {
                seen.add(label);
                labels.push(label);
            }
        });
    });
    return labels.map(label => ({
        label,
        values: planMaps.map(m => m.get(label) ?? false),
    }));
};

const ValueCell = ({ value }: { value: FeatureValue }) => {
    if (value === true) {
        return <CheckCircleFilled className="text-green-600 text-xl" />;
    }
    if (value === false) {
        return <CloseCircleOutlined className="text-gray-400 text-xl" />;
    }
    return <Typography.Text className="text-sm text-zinc-800 text-center">{value}</Typography.Text>;
};

type PlanCtaState = {
    disabled: boolean;
    label?: string;
};

type PlanHeaderProps = {
    pkg: PackageDetails;
    meta: PlanMeta;
    period: PlanType;
    onChoose: () => void;
    loading: boolean;
    ctaState: PlanCtaState;
    reserveDiscountRow: boolean;
};

const PlanHeader = ({
    pkg,
    meta,
    period,
    onChoose,
    loading,
    ctaState,
    reserveDiscountRow,
}: PlanHeaderProps) => {
    const isPrimaryCta = meta.ctaVariant === 'primary' && !ctaState.disabled;
    const { rawPrice, fullPrice, payable, hasDiscount, percentOff } = getPlanPricing(pkg, period);
    const periodSuffix = period === PlanType.Monthly ? '/month' : '/year';
    return (
        <div
            className={`relative flex flex-col items-center gap-5 px-7 py-7 h-full ${
                meta.bestValue ? 'bg-gradient-to-b from-bgSkin to-transparent' : ''
            }`}
        >
            <div className="px-4 py-1.5 bg-bgLightPink rounded-full">
                <Typography.Text className="text-base font-medium text-lightRed">
                    {pkg.packageName}
                </Typography.Text>
            </div>
            <Flex vertical align="center" gap={6}>
                <Flex align="end" gap={4}>
                    <Typography.Text className="text-2xl font-bold text-zinc-800 leading-none mb-1">
                        ₹
                    </Typography.Text>
                    <Typography.Text className="text-4xl font-bold text-zinc-800 leading-none">
                        {Number.isFinite(payable) ? payable : rawPrice}
                    </Typography.Text>
                    <Typography.Text className="text-sm text-gray-400 mb-1.5">
                        {periodSuffix}
                    </Typography.Text>
                </Flex>
                {(hasDiscount || reserveDiscountRow) && (
                    <Flex
                        align="center"
                        gap={8}
                        className={hasDiscount ? '' : 'invisible'}
                        aria-hidden={!hasDiscount}
                    >
                        <Typography.Text className="text-sm text-gray-400 line-through">
                            ₹{fullPrice}
                        </Typography.Text>
                        <span className="px-2 py-0.5 bg-lightGreen text-textGreen text-xs font-medium rounded">
                            {percentOff}% off
                        </span>
                    </Flex>
                )}
            </Flex>
            <Typography.Text className="text-sm text-neutral-500 text-center">
                {meta.tagline}
            </Typography.Text>
            <Button
                type={isPrimaryCta ? 'primary' : 'default'}
                danger={isPrimaryCta}
                onClick={onChoose}
                loading={loading}
                disabled={ctaState.disabled}
                className={`w-full !h-12 !rounded-xl !font-bold ${
                    !isPrimaryCta && !ctaState.disabled
                        ? '!bg-bgLightPink !border-borderPrimaryLight !text-fontSubBlack'
                        : ''
                }`}
            >
                {ctaState.label ?? meta.ctaLabel}
            </Button>
        </div>
    );
};

const LandingPage2 = () => {
    const [period, setPeriod] = useState<PlanType>(PlanType.Annually);
    const [submittingPlanId, setSubmittingPlanId] = useState<number | null>(null);
    const { packages, isLoading } = useGetEcommerceSubscription({
        accessKey: accessKeys.ecommerceStore,
    });
    const { data: currentSubscription } = useIsPurchased();
    const { handleSubmission, isLoading: paymentLoading } = usePayment();

    const upgradeCredit = currentSubscription?.isPurchased ? currentSubscription.upgradeCredit : 0;

    const currentPlanIndex = useMemo(() => {
        if (!currentSubscription?.isPurchased || !packages) return -1;
        return packages.findIndex(p => p.packageName === currentSubscription.packageName);
    }, [currentSubscription, packages]);

    const planCtaStates = useMemo<PlanCtaState[]>(() => {
        if (!packages) return [];
        if (currentPlanIndex === -1) return packages.map(() => ({ disabled: false }));
        const currentBilling = (currentSubscription.billingType || '').toUpperCase();
        const periodBilling = period === PlanType.Monthly ? 'MONTHLY' : 'ANNUALLY';
        const billingRank = (b: string) => (b === 'ANNUALLY' ? 1 : 0);
        return packages.map((_, i) => {
            if (i < currentPlanIndex) {
                return { disabled: true, label: 'Not available' };
            }
            if (i === currentPlanIndex) {
                if (periodBilling === currentBilling) {
                    return { disabled: true, label: 'Current plan' };
                }
                if (billingRank(periodBilling) < billingRank(currentBilling)) {
                    return { disabled: true, label: 'Not available' };
                }
                return { disabled: false, label: 'Switch to Annual' };
            }
            return { disabled: false };
        });
    }, [packages, currentPlanIndex, currentSubscription, period]);

    const planMetas = useMemo(
        () =>
            (packages ?? []).map((p, i, arr) => {
                const isMiddle = arr.length === 3 && i === 1;
                return planMetaByName[p.packageName] ?? fallbackMeta(p.packageName, isMiddle);
            }),
        [packages]
    );

    const featureRows = useMemo(() => (packages ? buildFeatureRows(packages) : []), [packages]);

    const discountByPeriod = useMemo<Record<PlanType, number>>(() => {
        const avgFor = (per: PlanType) => {
            const percents = (packages ?? [])
                .map(p => getPlanPricing(p, per).percentOff)
                .filter(v => v > 0);
            if (percents.length === 0) return 0;
            return Math.round(percents.reduce((a, b) => a + b, 0) / percents.length);
        };
        return {
            [PlanType.Monthly]: avgFor(PlanType.Monthly),
            [PlanType.Annually]: avgFor(PlanType.Annually),
        } as Record<PlanType, number>;
    }, [packages]);

    const handleChoose = async (pkg: PackageDetails) => {
        setSubmittingPlanId(pkg.id);
        try {
            await handleSubmission(pkg.packageName, period, pkg.id);
        } finally {
            setSubmittingPlanId(null);
        }
    };

    if (isLoading) {
        return (
            <Content className="mx-auto max-w-[1280px] px-4 py-8">
                <Skeleton active paragraph={{ rows: 12 }} />
            </Content>
        );
    }

    if (!packages || packages.length === 0) {
        return (
            <Content className="mx-auto max-w-[1280px] px-4 py-8">
                <Flex justify="center" align="center" className="min-h-[300px]">
                    <Typography.Text className="text-base text-gray-500">
                        No plans available right now. Please check back later.
                    </Typography.Text>
                </Flex>
            </Content>
        );
    }

    const planCount = packages.length;
    const colsTemplate = `200px ${'1fr '.repeat(planCount).trim()}`;

    return (
        <Content className="mx-auto max-w-[1280px] px-4 py-8">
            <Flex vertical gap={32}>
                <Flex vertical align="center" gap={8} className="text-center">
                    <Typography.Title className="!text-3xl md:!text-4xl xl:!text-5xl !font-bold !mb-0 !text-black">
                        Choose your plan and start selling online today
                    </Typography.Title>
                    <Typography.Text className="text-base md:text-lg text-black">
                        Upgrade anytime as your business grows. No lock-in contracts.
                    </Typography.Text>
                </Flex>

                {upgradeCredit > 0 && (
                    <Flex
                        align="center"
                        justify="center"
                        gap={8}
                        className="bg-bgLightPink border border-borderPrimaryLight rounded-full px-5 py-2 mx-auto"
                    >
                        <Typography.Text className="text-sm text-fontSubBlack">
                            You have an active <strong>{currentSubscription.packageName}</strong>{' '}
                            plan. Upgrading will credit <strong>₹{upgradeCredit}</strong> from your
                            current period against the new plan.
                        </Typography.Text>
                    </Flex>
                )}

                <Flex justify="center">
                    <div className="inline-flex items-center bg-white rounded-full border border-zinc-300 p-1">
                        <button
                            type="button"
                            onClick={() => setPeriod(PlanType.Monthly)}
                            className={`px-5 py-2 rounded-full text-base font-medium transition flex items-center gap-2 ${
                                period === PlanType.Monthly
                                    ? 'bg-white shadow text-zinc-800 border border-zinc-100'
                                    : 'text-zinc-600 border border-transparent'
                            }`}
                        >
                            Monthly
                        </button>
                        <button
                            type="button"
                            onClick={() => setPeriod(PlanType.Annually)}
                            className={`px-5 py-2 rounded-full text-base font-medium transition flex items-center gap-2 ${
                                period === PlanType.Annually
                                    ? 'bg-white shadow text-zinc-800 border border-zinc-100'
                                    : 'text-zinc-600 border border-transparent'
                            }`}
                        >
                            Annual
                        </button>
                    </div>
                </Flex>

                <div className="relative">
                    <div
                        className="absolute inset-x-0 top-0 grid pointer-events-none z-10"
                        style={{ gridTemplateColumns: colsTemplate }}
                    >
                        <div />
                        {planMetas.map((meta, i) => (
                            <div key={i} className="flex justify-center -translate-y-1/2">
                                {meta.bestValue && (
                                    <span className="px-3 py-1 bg-white border border-brandColor rounded-full text-xs font-medium text-lightRed">
                                        Best Value
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="grid" style={{ gridTemplateColumns: colsTemplate }}>
                            <div className="border-r border-b border-slate-200" />
                            {packages.map((pkg, i) => (
                                <div
                                    key={pkg.id}
                                    className={`${
                                        i < planCount - 1 ? 'border-r' : ''
                                    } border-b border-slate-200`}
                                >
                                    <PlanHeader
                                        pkg={pkg}
                                        meta={planMetas[i]}
                                        period={period}
                                        onChoose={() => handleChoose(pkg)}
                                        loading={paymentLoading && submittingPlanId === pkg.id}
                                        ctaState={planCtaStates[i] ?? { disabled: false }}
                                        reserveDiscountRow={discountByPeriod[period] > 0}
                                    />
                                </div>
                            ))}

                            {featureRows.map((feature, fi) => {
                                const isLast = fi === featureRows.length - 1;
                                return (
                                    <Fragment key={feature.label}>
                                        <div
                                            className={`border-r border-slate-200 px-6 py-5 flex items-center ${
                                                !isLast ? 'border-b' : ''
                                            }`}
                                        >
                                            <Typography.Text className="text-sm font-medium text-zinc-800">
                                                {feature.label}
                                            </Typography.Text>
                                        </div>
                                        {feature.values.map((value, vi) => (
                                            <div
                                                key={vi}
                                                className={`px-4 py-5 flex items-center justify-center ${
                                                    vi < planCount - 1
                                                        ? 'border-r border-slate-200'
                                                        : ''
                                                } ${!isLast ? 'border-b border-slate-200' : ''}`}
                                            >
                                                <ValueCell value={value} />
                                            </div>
                                        ))}
                                    </Fragment>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </Flex>
        </Content>
    );
};

export default LandingPage2;
