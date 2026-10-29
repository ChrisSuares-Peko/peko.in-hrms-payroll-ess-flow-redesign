/* eslint-disable no-nested-ternary */
import { useEffect, useMemo, useState } from 'react';

import { AimOutlined } from '@ant-design/icons';
import { Button, Flex, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';
import { paths } from '@src/routes/paths';

import QuoteListView from '../components/getStarted/QuoteListView';
import SelectionView from '../components/getStarted/SelectionView';
import StickyBottomBar from '../components/getStarted/StickyBottomBar';
import { useCountries } from '../hooks/useCountries';
import { Quote, useQuotesByCountryType } from '../hooks/useQuotesByCountryType';
import {
    resetApplication,
    setCountryData,
    setPricingData,
    setPricingList,
} from '../slices/globalBusinessSetupSlice';

const { Title } = Typography;

const formatLabel = (s: string) =>
    s
        .split('_')
        .map(w => (w.toUpperCase() === w ? w : w.charAt(0).toUpperCase() + w.slice(1)))
        .join(' ');

// Get Quote is a shorter flow than Get Started:
//   1: Country
//   2: Type of Company
//   3: Quote list (per-freezone results)
type Step = 1 | 2 | 3;

export default function GetQuote() {
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

    const { countriesAndDetails, freezoneOptions, countriesLoading } = useCountries(
        countryId,
        companyType,
        'is_active=true;has_company_types=true;has_provider=true;has_form=true;freezone_is_active=true'
    );

    const { quotes, loading: quotesLoading, fetchQuotes, clearQuotes } = useQuotesByCountryType();

    const selectedCountry = useMemo(
        () => countriesAndDetails.find(c => c._id === countryId),
        [countriesAndDetails, countryId]
    );
    const selectedType = useMemo(
        () => selectedCountry?.company_types?.find(c => c.key === companyType),
        [selectedCountry, companyType]
    );

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
        return items;
    }, [selectedCountry, companyType, selectedType]);

    const handleReset = () => {
        setCountryId('');
        setCompanyType('');
        clearQuotes();
        setStep(1);
    };

    const jumpToStep = (next: 1 | 2 | 3) => {
        if (next < 3 && step >= 3) {
            clearQuotes();
        }
        setStep(next);
    };

    const handleNext = async () => {
        if (step === 1 && countryId) {
            setStep(2);
            return;
        }
        if (step === 2 && companyType) {
            // Provider API retired — quotes derive from per-freezone pricing +
            // the freezone metadata (icon/description) on the country payload.
            const freezoneMeta = (selectedType?.freezones ?? [])
                .filter(f => f.is_active === true)
                .map(f => ({
                    value: f.key,
                    label: f.label,
                    icon: f.icon,
                    description: f.description,
                }));

            let entries = freezoneMeta.length > 0 ? freezoneMeta : freezoneOptions ?? [];

            if (entries.length === 0) {
                entries = [
                    {
                        value: '',
                        label:
                            selectedType?.label === 'Freezone'
                                ? 'Free Zone'
                                : selectedType?.label || formatLabel(companyType),
                        icon: selectedType?.icon,
                        description: selectedType?.description,
                    },
                ];
            }

            await fetchQuotes(countryId, companyType, entries);
            setStep(3);
        }
    };

    const handleProceed = (quote: Quote) => {
        dispatch(resetApplication());
        dispatch(
            setCountryData({
                country: countryId,
                type: companyType,
                freezone: quote.freezone,
            })
        );
        dispatch(setPricingList(quote.pricings));
        dispatch(setPricingData(quote.pricings[0] ?? null));

        navigate(
            `${paths.dashboard.globalBusinessSetup}/${paths.globalBusinessSetup.getQuote}/${paths.globalBusinessSetup.details}`,
            { state: { id: quote.id } }
        );
    };

    const primaryDisabled = step === 1 ? !countryId : step === 2 ? !companyType : true;
    const primaryLoading = step === 2 && quotesLoading;

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
                        Generate Quote
                    </Title>
                  
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

            {step <= 2 ? (
                <SelectionView
                    step={step as 1 | 2}
                    countriesAndDetails={countriesAndDetails}
                    countriesLoading={countriesLoading}
                    countryId={countryId}
                    companyType={companyType}
                    freezone=""
                    onCountryChange={id => {
                        if (id !== countryId) setCompanyType('');
                        setCountryId(id);
                    }}
                    onCompanyTypeChange={key => setCompanyType(key)}
                    onFreezoneChange={() => {
                        /* freezone step hidden for Get Quote */
                    }}
                    onJumpToStep={jumpToStep}
                    hideFreezoneStep
                />
            ) : (
                <QuoteListView
                    countryName={selectedCountry?.name ?? ''}
                    countryFlag={selectedCountry?.logo}
                    countryCode={selectedCountry?.country_code}
                    companyTypeLabel={
                        selectedType?.label === 'Freezone'
                            ? 'Free Zone'
                            : selectedType?.label || formatLabel(companyType)
                    }
                    quotes={quotes}
                    onProceed={handleProceed}
                    onChangeJurisdiction={() => setStep(1)}
                />
            )}

            <StickyBottomBar
                breadcrumb={breadcrumb}
                primaryLabel={step <= 2 ? (step === 2 ? 'Check' : 'Next') : undefined}
                primaryDisabled={step <= 2 ? primaryDisabled : undefined}
                primaryLoading={primaryLoading}
                onPrimary={step <= 2 ? handleNext : undefined}
                onReset={handleReset}
                hidePrimary={step === 3}
            />
        </div>
    );
}
