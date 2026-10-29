import { useCallback, useEffect, useMemo, useState } from 'react';

import { AimOutlined, GlobalOutlined } from '@ant-design/icons';
import { Button, Flex, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';
import { paths } from '@src/routes/paths';

import DetailView from '../components/getStarted/DetailView';
import SelectionView from '../components/getStarted/SelectionView';
import StickyBottomBar from '../components/getStarted/StickyBottomBar';
import { useCountries } from '../hooks/useCountries';
import { usePlanConfigState } from '../hooks/usePlanConfigState';
import { usePricing } from '../hooks/useProviders';
import { proceedToApplication } from '../utils/proceedToApplication';

const { Title, Text } = Typography;

const formatLabel = (s: string) =>
    s
        .split('_')
        .map(w => (w.toUpperCase() === w ? w : w.charAt(0).toUpperCase() + w.slice(1)))
        .join(' ');

type Step = 1 | 2 | 3 | 4 | 5;

export default function SetupForm() {
    const { xs } = useScreenSize();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const [step, setStep] = useState<Step>(1);

    useEffect(() => {
        const container = document.getElementById('myContainer');
        container?.scrollTo({ top: 0, behavior: 'smooth' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [step]);

    const [countryId, setCountryId] = useState('');
    const [companyType, setCompanyType] = useState('');
    const [freezone, setFreezone] = useState('');

    const { countriesAndDetails, countriesLoading } = useCountries(
        countryId,
        companyType,
        'is_active=true;has_company_types=true;has_provider=true;has_form=true;freezone_is_active=true'
    );

    const { fetchPricing, loading: pricingLoading, pricing, clearPricing } = usePricing();

    const {
        selectedIdx: selectedPricingIdx,
        setSelectedIdx: setSelectedPricingIdx,
        activePricing,
        quoteConfig,
        handleQuoteConfigChange,
        resetPlanState,
    } = usePlanConfigState(pricing);

    const selectedCountry = useMemo(
        () => countriesAndDetails.find(c => c._id === countryId),
        [countriesAndDetails, countryId]
    );
    const selectedType = useMemo(
        () => selectedCountry?.company_types?.find(c => c.key === companyType),
        [selectedCountry, companyType]
    );
    const selectedFreezone = useMemo(
        () => selectedType?.freezones?.find(f => f.key === freezone),
        [selectedType, freezone]
    );

    const activeFreezones = useMemo(
        () => (selectedType?.freezones ?? []).filter(f => f.is_active === true),
        [selectedType]
    );
    const requiresFreezone = activeFreezones.length > 0;

    const subStep: 'pick' | 'configure' = step === 5 ? 'configure' : 'pick';

    const breadcrumb = useMemo(() => {
        const items: { label: string; icon?: React.ReactNode }[] = [];
        if (selectedCountry) {
            items.push({
                label: selectedCountry.name,
                icon: selectedCountry.logo ? (
                    <img
                        src={selectedCountry.logo}
                        alt={selectedCountry.name}
                        style={{ width: 20, height: 14, objectFit: 'cover', borderRadius: 2 }}
                    />
                ) : undefined,
            });
        }
        if (companyType) {
            items.push({
                label:
                    selectedType?.label === 'Freezone'
                        ? 'Free Zone'
                        : selectedType?.label || formatLabel(companyType),
                icon: <AimOutlined style={{ color: '#FF4F4F', fontSize: 14 }} />,
            });
        }
        if (freezone) {
            items.push({
                label: selectedFreezone?.label || formatLabel(freezone),
                icon: <GlobalOutlined style={{ color: '#FF4F4F', fontSize: 14 }} />,
            });
        }
        return items;
    }, [selectedCountry, companyType, selectedType, freezone, selectedFreezone]);

    const handleReset = () => {
        setCountryId('');
        setCompanyType('');
        setFreezone('');
        resetPlanState();
        clearPricing();
        setStep(1);
    };

    const jumpToStep = useCallback(
        (next: 1 | 2 | 3) => {
            if (next <= 3 && step >= 4) {
                // Stepping back from detail flow — drop fetched pricing so
                // the user must re-check before re-entering Step 4.
                clearPricing();
                resetPlanState();
            }
            setStep(next);
        },
        [step, clearPricing, resetPlanState]
    );

    const handleNext = async () => {
        if (step === 1 && countryId) {
            setStep(2);
            return;
        }
        if (step === 2 && companyType) {
            setStep(requiresFreezone ? 3 : 4);
            if (!requiresFreezone) {
                await fetchPricing({ country: countryId, type: companyType, freezone: '' });
                resetPlanState();
            }
            return;
        }
        if (step === 3 && freezone) {
            await fetchPricing({ country: countryId, type: companyType, freezone });
            resetPlanState();
            setStep(4);
            return;
        }
        if (step === 4) {
            setStep(5);
        }
    };

    const handleProceed = () => {
        proceedToApplication(dispatch, navigate, {
            countryData: { country: countryId, type: companyType, freezone },
            activePricing,
            quoteConfig,
        });
    };

    const primaryDisabled = (() => {
        if (step === 1) return !countryId;
        if (step === 2) return !companyType;
        if (step === 3) return !freezone;
        if (step === 4) return pricing.length === 0;
        return !quoteConfig;
    })();

    const primaryLabel = step === 5 ? 'Proceed' : 'Next';
    const primaryLoading = step === 2 && !requiresFreezone ? pricingLoading : false;

    const isInSelectionPhase = step <= 3;

    return (
        <div
            style={{
                maxWidth: 1200,
                margin: '0 auto',
                padding: xs ? '0 16px 24px' : '0 24px 24px',
            }}
        >
            <Flex justify="space-between" align="center" wrap="wrap" gap={12} className="mb-6">
                <Flex vertical gap={4}>
                    <Title level={4} className="!m-0 !text-neutral-900 !font-semibold">
                        Let&apos;s Get Started
                    </Title>
                    <Text className="text-neutral-500">
                        Pick a jurisdiction to incorporate in. We&apos;ll walk you through company
                        type, location and pricing.
                    </Text>
                </Flex>
                <Button
                    danger
                    type="default"
                    onClick={() =>
                        navigate(
                            `${paths.dashboard.globalBusinessSetup}/${paths.globalBusinessSetup.getStarted}/${paths.globalBusinessSetup.pendingApplications}`
                        )
                    }
                >
                    Pending applications
                </Button>
            </Flex>

            {isInSelectionPhase ? (
                <SelectionView
                    step={step as 1 | 2 | 3}
                    countriesAndDetails={countriesAndDetails}
                    countriesLoading={countriesLoading}
                    countryId={countryId}
                    companyType={companyType}
                    freezone={freezone}
                    onCountryChange={id => {
                        if (id !== countryId) {
                            setCompanyType('');
                            setFreezone('');
                        }
                        setCountryId(id);
                    }}
                    onCompanyTypeChange={key => {
                        if (key !== companyType) setFreezone('');
                        setCompanyType(key);
                    }}
                    onFreezoneChange={setFreezone}
                    onJumpToStep={jumpToStep}
                />
            ) : (
                <DetailView
                    subStep={subStep}
                    countryName={selectedCountry?.name ?? ''}
                    countryFlag={selectedCountry?.logo}
                    countryCode={selectedCountry?.country_code}
                    companyTypeLabel={
                        selectedType?.label === 'Freezone'
                            ? 'Free Zone'
                            : selectedType?.label || formatLabel(companyType)
                    }
                    freezoneLabel={
                        freezone ? selectedFreezone?.label || formatLabel(freezone) : undefined
                    }
                    freezoneIcon={
                        selectedFreezone?.icon || selectedType?.icon || selectedCountry?.logo
                    }
                    freezoneDescription={selectedFreezone?.description || selectedType?.description}
                    pricings={pricing}
                    selectedPricingIdx={selectedPricingIdx}
                    onSelectedPricingChange={setSelectedPricingIdx}
                    quoteConfig={quoteConfig}
                    onQuoteConfigChange={handleQuoteConfigChange}
                    onJumpToStep={jumpToStep}
                    onPackageConfirmed={() => setStep(5)}
                    onChangePackage={() => setStep(4)}
                    loading={pricingLoading}
                />
            )}

            <StickyBottomBar
                breadcrumb={breadcrumb}
                primaryLabel={primaryLabel}
                primaryDisabled={primaryDisabled}
                primaryLoading={primaryLoading}
                onPrimary={step === 5 ? handleProceed : handleNext}
                onReset={handleReset}
            />
        </div>
    );
}
