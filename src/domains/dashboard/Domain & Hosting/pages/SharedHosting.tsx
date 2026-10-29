import { useEffect, useMemo, useRef, useState } from 'react';

import { Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useNavigate, useSearchParams } from 'react-router-dom';

import ConfirmationModal from '@src/components/molecular/modals/ConfirmationModal';
import { paths } from '@src/routes/paths';

import cloudHostingImg from '../assets/img/cloud-hosting.png';
import linuxImg from '../assets/img/linux.png';
import windowsImg from '../assets/img/windows.png';
import indiaFlag from '../assets/svg/india.svg';
import usaFlag from '../assets/svg/usa.svg';
import { HeroSection } from '../components/sections/HeroSection';
import { PlansSection } from '../components/sections/PlansSection';
import useHostingPlans, { HostingPlan } from '../hooks/useHostingPlans';
import useServiceCart from '../hooks/useServiceCart';

const { Text } = Typography;

type OsType = 'linux' | 'windows';
type LocationType = 'in' | 'us';

const getPlanOs = (productId: string): OsType =>
    productId.toLowerCase().includes('windows') ? 'windows' : 'linux';

const getPlanLocation = (plan: HostingPlan): LocationType => {
    if (plan.vendorDetails.hosting_location === 'in') return 'in';
    if (plan.vendorDetails.hosting_location === 'us') return 'us';
    return plan.productId.toLowerCase().endsWith('in') ? 'in' : 'us';
};

const planDescriptions: Record<string, string> = {
    Personal: 'Websites for everyone, at a great price',
    Business: 'Websites for everyone, at a great price',
    Pro: 'Perfect for Medium-sized Organisations',
};

const osOptions: { value: OsType; label: string; shortLabel: string; img: string }[] = [
    { value: 'linux', label: 'Linux Shared Hosting', shortLabel: 'Linux', img: linuxImg },
    { value: 'windows', label: 'Windows Shared Hosting', shortLabel: 'Windows', img: windowsImg },
];

const locationOptions: { value: LocationType; label: string; flag: string }[] = [
    { value: 'in', label: 'India', flag: indiaFlag },
    { value: 'us', label: 'USA', flag: usaFlag },
];

const SharedHostingPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const plansRef = useRef<HTMLDivElement>(null);
    const [serverLocation, setServerLocation] = useState<LocationType>('in');
    const [os, setOs] = useState<OsType>(searchParams.get('os') === 'windows' ? 'windows' : 'linux');
    useEffect(() => {
        if (typeof Moengage?.track_event === 'function') {
            Moengage.track_event('shared_hosting_viewed', {});
        }
    }, []);

    const { plans, isLoading } = useHostingPlans('shared_hosting');
    const { handleAddToCart, cartConflictModalProps } = useServiceCart();

    const filteredPlans = useMemo(
        () =>
            plans.filter(
                p => getPlanOs(p.productId) === os && getPlanLocation(p) === serverLocation
            ),
        [plans, os, serverLocation]
    );

    const cheapestPrice = useMemo(() => {
        if (filteredPlans.length === 0) return null;
        const cheapest = filteredPlans.reduce((min, plan) => {
            const minPrice = Object.values(min.pricingDetails?.add ?? {}).sort(
                (a, b) => a - b
            )[0];
            const planPrice = Object.values(plan.pricingDetails?.add ?? {}).sort(
                (a, b) => a - b
            )[0];
            return (planPrice ?? 999) < (minPrice ?? 999) ? plan : min;
        });
        return Object.values(cheapest.pricingDetails?.add ?? {}).sort((a, b) => a - b)[0] ?? null;
    }, [filteredPlans]);

    const heroBannerTitle = os === 'linux' ? 'Linux Shared Hosting' : 'Shared Windows Hosting';

    const onPurchase = async (
        productId: string,
        planId: string,
        planName: string,
        billingCycle: number
    ) => {
        if (typeof Moengage?.track_event === 'function') {
            Moengage.track_event('hosting_selected', {
                plan: planName,
                OS: os,
                country: serverLocation,
                tenure: billingCycle,
            });
        }
        const result = await handleAddToCart({
            itemType: 'shared_hosting',
            productId,
            planId,
            productName: planName,
            serverLocation,
            billingCycle,
        });
        if (result) navigate(`${paths.dashboard.domainHosting}/${paths.domainHosting.cart}`);
    };

    const handleLearnMore = () => {
        navigate(
            `${paths.dashboard.domainHosting}/${paths.domainHosting.sharedHostingDetail}?os=${os}`
        );
    };

    return (
        <Content className="bg-white min-h-screen">
            <HeroSection
                heroBannerTitle={heroBannerTitle}
                cheapestPrice={cheapestPrice}
                os={os}
                serverLocation={serverLocation}
                onOsChange={setOs}
                onLocationChange={setServerLocation}
                onLearnMore={handleLearnMore}
                showOsToggle={false}
                showLocation={false}
                heroImage={cloudHostingImg}
            />

            <div className="px-4 sm:px-6 pt-4 sm:pt-6 max-w-7xl mx-auto flex flex-col items-center gap-3">
                <div className="flex bg-gray-100 rounded-full p-1.5 gap-1">
                    {osOptions.map(option => (
                        <div
                            key={option.value}
                            role="button"
                            tabIndex={0}
                            onClick={() => setOs(option.value)}
                            onKeyDown={e => e.key === 'Enter' && setOs(option.value)}
                            className={`flex items-center gap-2 sm:gap-2.5 rounded-full cursor-pointer transition-all select-none whitespace-nowrap ${
                                os === option.value
                                    ? 'bg-white shadow-sm px-4 sm:px-7 py-2 sm:py-3'
                                    : 'px-3 sm:px-5 py-1.5 sm:py-2.5 hover:bg-gray-200'
                            }`}
                        >
                            <img
                                src={option.img}
                                alt={option.label}
                                className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
                            />
                            <Text
                                className={`font-medium text-xs sm:text-sm whitespace-nowrap ${
                                    os === option.value ? 'text-titleText' : 'text-gray-500'
                                }`}
                            >
                                <span className="hidden sm:inline">{option.label}</span>
                                <span className="sm:hidden">{option.shortLabel}</span>
                            </Text>
                        </div>
                    ))}
                </div>

                <div className="flex bg-gray-100 rounded-full p-1.5 gap-1">
                    {locationOptions.map(option => (
                        <div
                            key={option.value}
                            role="button"
                            tabIndex={0}
                            onClick={() => setServerLocation(option.value)}
                            onKeyDown={e => e.key === 'Enter' && setServerLocation(option.value)}
                            className={`flex items-center gap-2 sm:gap-2.5 rounded-full cursor-pointer transition-all select-none whitespace-nowrap ${
                                serverLocation === option.value
                                    ? 'bg-white shadow-sm px-4 sm:px-7 py-2 sm:py-3'
                                    : 'px-3 sm:px-5 py-1.5 sm:py-2.5 hover:bg-gray-200'
                            }`}
                        >
                            <img
                                src={option.flag}
                                alt={option.label}
                                className="w-5 h-5 object-contain rounded-sm"
                            />
                            <Text
                                className={`font-medium text-xs sm:text-sm whitespace-nowrap ${
                                    serverLocation === option.value
                                        ? 'text-titleText'
                                        : 'text-gray-500'
                                }`}
                            >
                                {option.label}
                            </Text>
                        </div>
                    ))}
                </div>
            </div>

            <PlansSection
                filteredPlans={filteredPlans}
                isLoading={isLoading}
                planDescriptions={planDescriptions}
                onPurchase={onPurchase}
                plansRef={plansRef}
            />

            <ConfirmationModal {...cartConflictModalProps} />
        </Content>
    );
};

export default SharedHostingPage;
