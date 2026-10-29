import { useEffect, useState } from 'react';

import { Content } from 'antd/es/layout/layout';
import { useNavigate } from 'react-router-dom';

import ConfirmationModal from '@src/components/molecular/modals/ConfirmationModal';
import { paths } from '@src/routes/paths';

import VpsHero from '../components/vps/VpsHero';
import VpsPlanTable from '../components/vps/VpsPlanTable';
import VpsStep2Config from '../components/vps/VpsStep2Config';
import VpsWizardHeader from '../components/vps/VpsWizardHeader';
import useHostingPlans, { type HostingPlan } from '../hooks/useHostingPlans';
import useServiceCart from '../hooks/useServiceCart';
import {
    SERVER_LOCATION_MAP,
    formatMb,
    getDefaultTenure,
    getPriceForTenure,
} from '../utils/vpsUtils';


const VpsServerPage = () => {
    const navigate = useNavigate();

    const handleLearnMore = () => {
        navigate(`${paths.dashboard.domainHosting}/${paths.domainHosting.vpsServerDetail}`);
    };

    const [serverLocation, setServerLocation] = useState<'india' | 'us'>('india');
    const [step, setStep] = useState<1 | 2>(1);
    const [selectedPlan, setSelectedPlan] = useState<HostingPlan | null>(null);
    const [tenureMap, setTenureMap] = useState<Record<string, number>>({});
    const [os, setOs] = useState('');
    const [controlPanel, setControlPanel] = useState('none');
    const [acronisGb, setAcronisGb] = useState<number>(10);
    const [acronisEnabled, setAcronisEnabled] = useState(false);
    const [whmcsEnabled, setWhmcsEnabled] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        if (typeof Moengage?.track_event === 'function') {
            Moengage.track_event('vps_plan_started', {});
        }
    }, []);

    const { plans, isLoading } = useHostingPlans('vps_server');
    const { plans: backupPlans, isLoading: backupPlanLoading, fetchPlans: fetchBackupPlans } = useHostingPlans('backup', { lazy: true });
    const { handleAddToCart, cartConflictModalProps } = useServiceCart();

    const filteredPlans = plans.filter(p =>
        serverLocation === 'us' ? p.productId.endsWith('us') : !p.productId.endsWith('us')
    );

    const minPrice =
        plans.length > 0
            ? Math.min(...plans.flatMap(p => Object.values(p.pricingDetails?.add ?? {})))
            : null;

    const onSelectPlan = (plan: HostingPlan) => {
        const supported = plan.vendorDetails?.supported_os ?? [];
        const defaultOs =
            supported.find(o => o.is_default && !o.is_discontinued) ??
            supported.find(o => !o.is_discontinued) ??
            supported[0];
        setOs(defaultOs?.os_name ?? '');
        setControlPanel('none');
        setSelectedPlan(plan);
        setStep(2);
        fetchBackupPlans({ serverLocation: SERVER_LOCATION_MAP[serverLocation] });
        if (typeof Moengage?.track_event === 'function') {
            const tenure = tenureMap[plan.planId] ?? getDefaultTenure(plan);
            Moengage.track_event('vps_plan_selected', {
                plan_name: plan.planName,
                country: SERVER_LOCATION_MAP[serverLocation],
                tenure,
                price: getPriceForTenure(plan, tenure),
            });
        }
    };

    const onBack = () => {
        setStep(1);
        setAcronisEnabled(false);
        setWhmcsEnabled(false);
    };

    const step2Tenure = selectedPlan
        ? (tenureMap[selectedPlan.planId] ?? getDefaultTenure(selectedPlan))
        : 0;
    const osFamily = os.toLowerCase().includes('windows') ? 'Windows' : 'Linux';

    const computedTotal = () => {
        if (!selectedPlan) return '0.00';
        const base = (getPriceForTenure(selectedPlan, step2Tenure) ?? 0) * step2Tenure;
        const acronis = acronisEnabled ? (acronisPricePerGb ?? 0) * acronisGb * step2Tenure : 0;
        const whmcs = whmcsEnabled ? (selectedPlan.addons?.whmcs ?? 0) * step2Tenure : 0;
        const cp =
            controlPanel !== 'none' ? (selectedPlan.addons?.[controlPanel] ?? 0) * step2Tenure : 0;
        return (base + acronis + whmcs + cp).toFixed(2);
    };

    const onProceedToCart = async () => {
        if (!selectedPlan) return;
        if (typeof Moengage?.track_event === 'function') {
            const addonNames: string[] = [];
            let addonPrice = 0;
            if (controlPanel !== 'none') {
                addonNames.push(controlPanel);
                addonPrice += (selectedPlan.addons?.[controlPanel] ?? 0) * step2Tenure;
            }
            if (acronisEnabled) {
                addonNames.push('acronis');
                addonPrice += (acronisPricePerGb ?? 0) * acronisGb * step2Tenure;
            }
            if (whmcsEnabled) {
                addonNames.push('whmcs');
                addonPrice += (selectedPlan.addons?.whmcs ?? 0) * step2Tenure;
            }
            if (addonNames.length > 0) {
                Moengage.track_event('vps_addons_chosen', {
                    addon_name: addonNames.join(', '),
                    addon_price: addonPrice,
                    total_price: parseFloat(computedTotal()),
                });
            }
        }
        setIsAdding(true);
        const billingCycle = tenureMap[selectedPlan.planId] ?? getDefaultTenure(selectedPlan);
        const addons: string[] = [];
        const addonQuantities: Record<string, number> = {};
        if (whmcsEnabled && selectedPlan.addons?.whmcs != null) {
            addons.push('whmcs');
            addonQuantities.whmcs = 1;
        }
        const vpsResult = await handleAddToCart({
            itemType: 'vps_server',
            productId: selectedPlan.productId,
            planId: selectedPlan.planId,
            productName: selectedPlan.planName,
            productQuantity: 1,
            billingCycle,
            serverLocation: SERVER_LOCATION_MAP[serverLocation],
            os,
            ...(addons.length > 0 ? { addons } : {}),
            ...(Object.keys(addonQuantities).length > 0 ? { addonQuantities } : {}),
            ...(controlPanel !== 'none' ? { controlPanel } : {}),
        });
        if (vpsResult && acronisEnabled && backupPlan && isBackupCompatible) {
            await handleAddToCart({
                itemType: 'backup',
                productId: backupPlan.productId,
                planId: backupPlan.planId,
                productName: backupPlan.planName,
                productQuantity: 1,
                storageInGb: acronisGb,
                billingCycle,
                vpsProductId: selectedPlan.productId,
            });
        }
        setIsAdding(false);
        if (vpsResult) navigate(`${paths.dashboard.domainHosting}/${paths.domainHosting.cart}`);
    };

    // Backend already filters to the correct location-specific plan — just use the first result
    const backupPlan = backupPlans[0] ?? null;

    // Backup pricing is per GB per month — add['1'] is the authoritative per-month key
    const acronisPricePerGb = backupPlan?.pricingDetails?.add?.['1'] ?? backupPlan?.price ?? null;

    const minStorageSize: number = backupPlan?.vendorDetails?.minimumStorageSize ?? 1;
    const maxStorageSize: number = backupPlan?.vendorDetails?.maximumStorageSize ?? 5000;
    const isBackupCompatible: boolean = !backupPlanLoading && !!backupPlan && !!selectedPlan &&
        (backupPlan.vendorDetails?.miscellaneous?.supportedProductKeys ?? '')
            .split(',').map((k: string) => k.trim()).includes(selectedPlan.productId);

    const step2Specs = [
        selectedPlan?.planName,
        selectedPlan?.vendorDetails?.cpu != null
            ? `${selectedPlan.vendorDetails.cpu} Cores`
            : null,
        selectedPlan?.vendorDetails?.ram != null
            ? `${formatMb(selectedPlan.vendorDetails.ram)} RAM`
            : null,
        selectedPlan?.vendorDetails?.space != null
            ? `${formatMb(selectedPlan.vendorDetails.space)} Space`
            : null,
    ]
        .filter(Boolean)
        .join(' | ');

    return (
        <Content className="bg-white" style={{ minHeight: '100vh' }}>
            <VpsHero minPrice={minPrice} onLearnMore={handleLearnMore} />

            <div className="px-4 sm:px-6 py-10">
                <VpsWizardHeader
                    step={step}
                    serverLocation={serverLocation}
                    setServerLocation={setServerLocation}
                    onBack={onBack}
                />

                {step === 1 && (
                    <VpsPlanTable
                        filteredPlans={filteredPlans}
                        isLoading={isLoading}
                        tenureMap={tenureMap}
                        setTenureMap={setTenureMap}
                        onSelectPlan={onSelectPlan}
                    />
                )}

                {step === 2 && selectedPlan && (
                    <VpsStep2Config
                        selectedPlan={selectedPlan}
                        step2Title={`${osFamily} NVMe VPS Plan`}
                        step2Specs={step2Specs}
                        step2Tenure={step2Tenure}
                        os={os}
                        controlPanel={controlPanel}
                        acronisEnabled={acronisEnabled}
                        acronisGb={acronisGb}
                        acronisPricePerGb={acronisPricePerGb}
                        backupPlanLoading={backupPlanLoading}
                        minStorageSize={minStorageSize}
                        maxStorageSize={maxStorageSize}
                        isBackupCompatible={isBackupCompatible}
                        whmcsEnabled={whmcsEnabled}
                        isAdding={isAdding}
                        setOs={v => {
                            setOs(v);
                            setControlPanel('none');
                        }}
                        setControlPanel={setControlPanel}
                        onToggleAcronis={() => setAcronisEnabled(prev => !prev)}
                        setAcronisGb={setAcronisGb}
                        setWhmcsEnabled={setWhmcsEnabled}
                        onBack={onBack}
                        onProceedToCart={onProceedToCart}
                        computedTotal={computedTotal}
                    />
                )}
            </div>
            <ConfirmationModal {...cartConflictModalProps} />
        </Content>
    );
};

export default VpsServerPage;
