import { useMemo, useState } from 'react';

import { Content } from 'antd/es/layout/layout';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import cloudHostingImg from '../assets/img/cloud-hosting.png';
import { BenefitsSection } from '../components/sections/BenefitsSection';
import { FAQsSection } from '../components/sections/FAQsSection';
import { FeaturesSection } from '../components/sections/FeaturesSection';
import { HeroSection } from '../components/sections/HeroSection';
import { ProductInfoSection } from '../components/sections/ProductInfoSection';
import { SpecificationsSection } from '../components/sections/SpecificationsSection';
import { TechSpecsModal } from '../components/sections/TechSpecsModal';
import useHostingPlans, { HostingPlan } from '../hooks/useHostingPlans';
import {
    linuxHostingBenefits,
    linuxHostingFaqs,
    linuxHostingFeatures,
    linuxHostingSpecs,
    windowsHostingBenefits,
    windowsHostingFaqs,
    windowsHostingFeatures,
    windowsHostingSpecs,
} from '../utils/data';

type OsType = 'linux' | 'windows';

const getPlanOs = (productId: string): OsType =>
    productId.toLowerCase().includes('windows') ? 'windows' : 'linux';

const getPlanLocation = (plan: HostingPlan) => {
    if (plan.vendorDetails.hosting_location === 'in') return 'in';
    if (plan.vendorDetails.hosting_location === 'us') return 'us';
    return plan.productId.toLowerCase().endsWith('in') ? 'in' : 'us';
};

const SharedHostingDetailPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const rawOs = searchParams.get('os');
    const initialOs: OsType = rawOs === 'windows' ? 'windows' : 'linux';

    const [os, setOs] = useState<OsType>(initialOs);
    const [selectedFeature, setSelectedFeature] = useState<number>(0);
    const [techSpecsModalOpen, setTechSpecsModalOpen] = useState(false);

    const { plans } = useHostingPlans('shared_hosting');

    const cheapestPrice = useMemo(() => {
        const osPlans = plans.filter(
            p => getPlanOs(p.productId) === os && getPlanLocation(p) === 'in'
        );
        if (osPlans.length === 0) return null;
        const cheapest = osPlans.reduce((min, plan) => {
            const minPrice = Object.values(min.pricingDetails?.add ?? {}).sort(
                (a, b) => a - b
            )[0];
            const planPrice = Object.values(plan.pricingDetails?.add ?? {}).sort(
                (a, b) => a - b
            )[0];
            return (planPrice ?? 999) < (minPrice ?? 999) ? plan : min;
        });
        return Object.values(cheapest.pricingDetails?.add ?? {}).sort((a, b) => a - b)[0] ?? null;
    }, [plans, os]);

    const heroBannerTitle = os === 'linux' ? 'Linux Shared Hosting' : 'Shared Windows Hosting';
    const osTitle = os === 'linux' ? 'Linux Shared Hosting' : 'Windows Hosting';
    const featureTitleOs = os === 'linux' ? 'Linux Web Hosting' : 'Windows Web Hosting';
    const hostingBenefits = os === 'linux' ? linuxHostingBenefits : windowsHostingBenefits;
    const hostingFeatures = os === 'linux' ? linuxHostingFeatures : windowsHostingFeatures;
    const hostingSpecs = os === 'linux' ? linuxHostingSpecs : windowsHostingSpecs;
    const hostingFaqs = os === 'linux' ? linuxHostingFaqs : windowsHostingFaqs;

    const handleBuyPlans = () => {
        navigate(`${paths.dashboard.domainHosting}/${paths.domainHosting.sharedHosting}?os=${os}`);
    };

    return (
        <Content className="bg-white min-h-screen">
            <HeroSection
                heroBannerTitle={heroBannerTitle}
                cheapestPrice={cheapestPrice}
                os={os}
                serverLocation="in"
                onOsChange={setOs}
                onLocationChange={() => undefined}
                showLocation={false}
                onBuyPlans={handleBuyPlans}
                heroImage={cloudHostingImg}
            />

            <BenefitsSection osTitle={osTitle} hostingBenefits={hostingBenefits} />

            <SpecificationsSection
                osTitle={osTitle}
                hostingSpecs={hostingSpecs}
                onViewAllSpecs={() => setTechSpecsModalOpen(true)}
            />

            <FeaturesSection
                featureTitleOs={featureTitleOs}
                hostingFeatures={hostingFeatures}
                selectedFeature={selectedFeature}
                onSelectFeature={setSelectedFeature}
                os={os}
            />

            <FAQsSection hostingFaqs={hostingFaqs} />

            <ProductInfoSection
                osTitle={osTitle}
                os={os}
                onBuyNow={handleBuyPlans}
            />

            <TechSpecsModal
                open={techSpecsModalOpen}
                onClose={() => setTechSpecsModalOpen(false)}
                os={os}
            />
        </Content>
    );
};

export default SharedHostingDetailPage;
