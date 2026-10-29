import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

import { CheckOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Button, Divider, Flex, Image, Skeleton, Typography } from 'antd';
import { SiGoogledocs, SiGoogleforms, SiGooglesheets } from 'react-icons/si';

import calender from '../../assets/svg/calender.svg';
import endPoint from '../../assets/svg/endPoint.svg';
import gemini from '../../assets/svg/gemini.svg';
import gmail from '../../assets/svg/gmail.svg';
import googleMeet from '../../assets/svg/googleMeet.svg';
import search from '../../assets/svg/search.svg';
import security from '../../assets/svg/security.svg';
import siAppsheet from '../../assets/svg/siAppsheet.svg';
import siGoogleChat from '../../assets/svg/siGoogleChat.svg';
import siGoogleforms from '../../assets/svg/siGoogleforms.svg';
import siGooglekeep from '../../assets/svg/siGooglekeep.svg';
import siGoogleMeet from '../../assets/svg/siGoogleMeet.svg';
import siGoogleslides from '../../assets/svg/siGoogleslides.svg';
import storage from '../../assets/svg/storage.svg';
import vault from '../../assets/svg/vault.svg';
import type { HostingPlan } from '../../hooks/useHostingPlans';

const { Text } = Typography;

const getTenureOptions = (pricing?: Record<string, number>) =>
    Object.keys(pricing ?? {})
        .map(Number)
        .filter(Number.isFinite)
        .sort((a, b) => a - b);

const SECTION_LABELS: Record<string, string> = {
    storage:     'Storage',
    ai:          'Get started with AI',
    communicate: 'Communicate',
    collaborate: 'Collaborate',
    control:     'Control',
};

const svgIcon = (src: string, alt: string) => <Image src={src} alt={alt} width={22} height={22} preview={false} />;
const siIcon = (Icon: React.ComponentType<{ size?: number; color?: string }>, color: string) => <Icon size={22} color={color} />;

const APP_ICON_MAP: Record<string, JSX.Element> = {
    gmail:       svgIcon(gmail, 'gmail'),
    meet:        svgIcon(googleMeet, 'meet'),
    calender:    svgIcon(calender, 'calender'),
    calendar:    svgIcon(calender, 'calendar'),
    drive:       svgIcon(storage, 'storage'),
    gemini:      svgIcon(gemini, 'gemini'),
    storage:     svgIcon(storage, 'storage'),
    ai:          svgIcon(gemini, 'gemini'),
    security:    svgIcon(security, 'security'),
    chat:        svgIcon(siGoogleChat, 'siGoogleChat'),
    googleforms: svgIcon(siGoogleforms, 'siGoogleforms'),
    docs:        siIcon(SiGoogledocs, '#4285F4'),
    sheets:      siIcon(SiGooglesheets, '#0F9D58'),
    slides:      svgIcon(siGoogleslides, 'siGoogleslides'),
    googleMeet:  svgIcon(siGoogleMeet, 'siGoogleMeet'),
    appsheet:    svgIcon(siAppsheet, 'siAppsheet'),
    automate:    svgIcon(siAppsheet, 'automate'),
    sites:       siIcon(SiGoogleforms, '#7248B9'),
    forms:       svgIcon(siGoogleforms, 'siGoogleforms'),
    keep:        svgIcon(siGooglekeep, 'siGooglekeep'),
    currents:    svgIcon(siGoogleMeet, 'siGoogleMeet'),
    google:      svgIcon(siAppsheet, 'google'),
    search:      svgIcon(search, 'search'),
    backup:      svgIcon(storage, 'backup'),
    vault:       svgIcon(vault, 'vault'),
    endpoint:    svgIcon(endPoint, 'endpoint'),
};

const AppIcon = ({ appKey }: { appKey: string }) => {
    const icon = APP_ICON_MAP[appKey];
    if (!icon)
        return (
            <span className="inline-flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full bg-gray-300 text-[10px] font-bold text-white">
                {appKey[0].toUpperCase()}
            </span>
        );
    return <span className="flex-shrink-0">{icon}</span>;
};

interface Props {
    plansRef: RefObject<HTMLDivElement>;
    plans: HostingPlan[];
    isLoading: boolean;
    onPurchase: (productId: string, planId: string, planName: string, billingCycle: number) => Promise<void>;
}

const GoogleWorkspacePlans = ({ plansRef, plans, isLoading, onPurchase }: Props) => {
    const [tenureMap] = useState<Record<string, number>>({});
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const updateArrows = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 0);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    }, []);

    useEffect(() => {
        updateArrows();
        window.addEventListener('resize', updateArrows);
        return () => window.removeEventListener('resize', updateArrows);
    }, [updateArrows, plans, isLoading]);

    const scrollByPage = (dir: number) => {
        scrollRef.current?.scrollBy({ left: dir * scrollRef.current.clientWidth, behavior: 'smooth' });
    };

    return (
        <div ref={plansRef} className="py-[50px]">
            {isLoading ? (
                <div className="flex gap-5 overflow-hidden">
                    {[1, 2, 3, 4].map(i => (
                        <div className="w-[300px] flex-shrink-0" key={i}>
                            <Skeleton active />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="relative">
                    {canScrollLeft && (
                        <Button
                            shape="circle"
                            icon={<LeftOutlined />}
                            onClick={() => scrollByPage(-1)}
                            aria-label="Previous plans"
                            className="absolute left-1 top-[340px] z-10 hidden bg-white shadow-md sm:flex"
                        />
                    )}
                    {canScrollRight && (
                        <Button
                            shape="circle"
                            icon={<RightOutlined />}
                            onClick={() => scrollByPage(1)}
                            aria-label="Next plans"
                            className="absolute right-1 top-[340px] z-10 hidden bg-white shadow-md sm:flex"
                        />
                    )}
                    <div
                        ref={scrollRef}
                        onScroll={updateArrows}
                        className="flex gap-5 overflow-x-auto pb-2 pr-4 -mr-4 lg:-mr-6 lg:pr-6"
                    >
                        {plans.map(plan => {
                        const tenureOptions = getTenureOptions(plan.pricingDetails?.add);
                        const selectedTenure = tenureMap[plan.planId] ?? tenureOptions[0] ?? 1;
                        const selectedPrice =
                            plan.pricingDetails?.add?.[String(selectedTenure)] ?? plan.price ?? 0;
                        const renewPrice = plan.pricingDetails?.renew?.[String(selectedTenure)];
                        const misc = plan.vendorDetails?.miscellaneous as any;
                        const planTitle = misc?.feature_header?.header_0 ?? plan.planName;
                        const planSubtitle = misc?.feature_header?.header_1 ?? '';
                        const additionalFeatures = misc?.additional_features as Record<string, Record<string, string>> | undefined;
                        const discount = plan.vendorDetails?.discount as { value?: number; type?: string } | undefined;

                        let descFeaturePairs: { headerText: string; appKey: string; desc: string }[] | null = null;
                        let descSections: Record<string, Record<string, string>> | null = null;
                        try {
                            const raw = (plan as any).description;
                            if (raw) {
                                const parsed: Record<string, unknown> = typeof raw === 'string' ? JSON.parse(raw) : raw;
                                const pairs = Object.entries(parsed)
                                    .filter(([k]) => k.endsWith('_header'))
                                    .map(([hk, headerText]) => {
                                        const baseKey = hk.replace('_header', '');
                                        return { headerText: headerText as string, appKey: baseKey, desc: (parsed[baseKey] as string) ?? '' };
                                    })
                                    .filter(p => !!p.headerText && !!p.desc);
                                if (pairs.length) descFeaturePairs = pairs;

                                const sections = Object.fromEntries(
                                    Object.entries(parsed).filter(([, v]) => v !== null && typeof v === 'object') as [string, Record<string, string>][]
                                );
                                if (Object.keys(sections).length) descSections = sections;
                            }
                        } catch (_) { /* not a JSON description */ }

                        const descRows: JSX.Element[] = descFeaturePairs
                            ? descFeaturePairs.map(({ headerText, appKey, desc }) => (
                                <Flex key={appKey} vertical gap={8}>
                                    <Text className="text-[13px] font-bold text-[#545270]">{headerText}</Text>
                                    <Flex align="flex-start" gap={8}>
                                        <AppIcon appKey={appKey} />
                                        <Text className="text-xs leading-5 text-[#6F6C8F]">{desc}</Text>
                                    </Flex>
                                </Flex>
                            ))
                            : [];

                        const coveredKeys = new Set(descFeaturePairs?.map(p => p.appKey) ?? []);
                        const sectionSource = descSections ?? additionalFeatures;

                        let renderedSectionCount = descRows.length;
                        const additionalRows: JSX.Element[] = sectionSource
                            ? Object.entries(sectionSource)
                                .filter(([sectionKey]) => !coveredKeys.has(sectionKey))
                                .flatMap(([sectionKey, items]) => {
                                    const visibleItems = Object.entries(items).filter(([k, v]) => !k.startsWith('_') && !!v);
                                    if (!visibleItems.length) return [];
                                    const isFirst = renderedSectionCount === 0;
                                    renderedSectionCount += 1;
                                    return [(
                                        <div
                                            key={sectionKey}
                                            className={`flex flex-col gap-[10px]${isFirst ? '' : ' border-t border-[#f1f2f9] pt-5'}`}
                                        >
                                            <Text className="text-sm font-semibold text-[#545270]">
                                                {SECTION_LABELS[sectionKey] ?? sectionKey}
                                            </Text>
                                            {visibleItems.map(([appKey, desc]) => (
                                                <Flex key={appKey} align="flex-start" gap={8}>
                                                    <AppIcon appKey={appKey} />
                                                    <Text className="text-xs leading-5 text-[#6F6C8F]">{desc}</Text>
                                                </Flex>
                                            ))}
                                        </div>
                                    )];
                                })
                            : [];

                        const featureRows: JSX.Element[] =
                            descRows.length > 0 || additionalRows.length > 0
                                ? [...descRows, ...additionalRows]
                                : plan.features.map((f, i) => (
                                    <Flex key={i} align="flex-start" gap={6}>
                                        <CheckOutlined className="mt-0.5 text-green-500" />
                                        <Text className="text-sm text-gray-600">{f.label}: {f.value}</Text>
                                    </Flex>
                                ));

                        return (
                            <div className="w-[300px] flex-shrink-0" key={plan.id}>
                                <Flex
                                    vertical
                                    className="h-full overflow-hidden rounded-[28px] bg-white shadow-[0px_2px_13px_0px_rgba(25,33,61,0.10)]"
                                >
                                    <div>
                                        <Flex vertical gap={8} className="px-[30px] pt-[28px] pb-[16px]">
                                            <Text className="text-[26px] font-semibold leading-[1.15] text-[#212121]">{planTitle}</Text>
                                            <Text className="block text-[13px] font-normal leading-[20px] text-[#6f6c8f]">{planSubtitle}</Text>
                                        </Flex>
                                        <Divider className="my-0" />
                                    </div>

                                    <Flex vertical gap={20} className="border border-[#f1f2f9] px-[24px] pt-[31px] pb-[28px]">
                                        <Flex align="center" justify="space-between" style={{ width: '100%' }}>
                                            <Flex align="baseline" gap={4} className="flex-shrink-0">
                                                <Text className="text-[38px] font-semibold leading-none text-black whitespace-nowrap">
                                                    ₹{selectedPrice}
                                                </Text>
                                                <Text className="text-[16px] font-normal text-[#212121] whitespace-nowrap">/mo</Text>
                                            </Flex>
                                            {discount?.value && (
                                                <div
                                                    className="flex items-center py-[9px] pl-[22px] pr-[14px] text-[14px] font-medium text-white whitespace-nowrap bg-savingsTagGreen leading-none -mr-6"
                                                    style={{
                                                        clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 14px 50%)',
                                                    }}
                                                >
                                                    Save {discount.value}%
                                                </div>
                                            )}
                                        </Flex>

                                        {renewPrice != null && (
                                            <Text className="text-[14px] text-[#909090]">
                                                <span className="font-medium text-[#575757]">Renews at {renewPrice}</span>/acc/mo
                                            </Text>
                                        )}

                                        <Button
                                            block
                                            className="h-[44px] rounded-[10px] text-[15px] font-semibold bg-lightRed border-lightRed text-white"
                                            onClick={() => onPurchase(plan.productId, plan.planId, plan.planName, selectedTenure)}
                                        >
                                            Buy now
                                        </Button>
                                    </Flex>

                                    <Flex vertical className="flex-1 px-[30px] pt-[28px] pb-[32px]" gap={20}>
                                        {featureRows}
                                    </Flex>
                                </Flex>
                            </div>
                        );
                    })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GoogleWorkspacePlans;
