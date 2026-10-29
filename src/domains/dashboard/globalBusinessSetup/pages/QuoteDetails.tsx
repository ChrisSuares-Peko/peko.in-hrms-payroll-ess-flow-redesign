import React, { useMemo, useState } from 'react';

import { AimOutlined, GlobalOutlined } from '@ant-design/icons';
import { Button, Empty, Flex } from 'antd';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';
import { paths } from '@src/routes/paths';

import DetailView from '../components/getStarted/DetailView';
import StickyBottomBar from '../components/getStarted/StickyBottomBar';
import PricingStatusAlert from '../components/PricingStatusAlert';
import { useCountries } from '../hooks/useCountries';
import { usePlanConfigState } from '../hooks/usePlanConfigState';
import { proceedToApplication } from '../utils/proceedToApplication';

const formatLabel = (s: string) =>
    s
        .split('_')
        .map(w => (w.toUpperCase() === w ? w : w.charAt(0).toUpperCase() + w.slice(1)))
        .join(' ');

const quotePath = `${paths.dashboard.globalBusinessSetup}/${paths.globalBusinessSetup.getQuote}`;

export default function QuoteDetails() {
    const { xs } = useScreenSize();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const { countryData, pricingList } = useAppSelector(state => state.reducer.globalBusinessSetup);

    const pricings = useMemo(() => pricingList ?? [], [pricingList]);

    const { countriesAndDetails } = useCountries(
        countryData?.country ?? '',
        countryData?.type ?? '',
        'is_active=true;has_company_types=true;has_provider=true;has_form=true;freezone_is_active=true'
    );

    const { selectedIdx, setSelectedIdx, activePricing, quoteConfig, handleQuoteConfigChange } =
        usePlanConfigState(pricings);

    const [subStep, setSubStep] = useState<'pick' | 'configure'>(
        pricings.length > 1 ? 'pick' : 'configure'
    );

    const selectedCountry = useMemo(
        () => countriesAndDetails.find(c => c._id === countryData?.country),
        [countriesAndDetails, countryData?.country]
    );
    const selectedType = useMemo(
        () => selectedCountry?.company_types?.find(c => c.key === countryData?.type),
        [selectedCountry, countryData?.type]
    );
    const selectedFreezone = useMemo(
        () => selectedType?.freezones?.find(f => f.key === countryData?.freezone),
        [selectedType, countryData?.freezone]
    );

    const companyTypeLabel =
        selectedType?.label === 'Freezone'
            ? 'Free Zone'
            : selectedType?.label || formatLabel(countryData?.type ?? '');

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
        if (countryData?.type) {
            items.push({
                label: companyTypeLabel,
                icon: <AimOutlined style={{ color: '#FF4F4F', fontSize: 14 }} />,
            });
        }
        if (countryData?.freezone) {
            items.push({
                label: selectedFreezone?.label || formatLabel(countryData.freezone),
                icon: <GlobalOutlined style={{ color: '#FF4F4F', fontSize: 14 }} />,
            });
        }
        return items;
    }, [selectedCountry, countryData, companyTypeLabel, selectedFreezone]);

    if (!countryData || !pricingList) {
        return (
            <Flex vertical align="center" justify="center" gap={16} className="w-full py-24">
                <Empty description="This quote is no longer available. Please start again." />
                <Button type="primary" danger onClick={() => navigate(quotePath)}>
                    Go Back
                </Button>
            </Flex>
        );
    }

    const handleProceed = () =>
        proceedToApplication(dispatch, navigate, {
            countryData,
            activePricing,
            quoteConfig,
        });

    return (
        <div
            style={{
                maxWidth: 1200,
                margin: '0 auto',
                padding: xs ? '0 16px 24px' : '0 24px 24px',
            }}
        >
            <PricingStatusAlert pricing={activePricing} />

            <DetailView
                subStep={subStep}
                countryName={selectedCountry?.name ?? ''}
                countryFlag={selectedCountry?.logo}
                countryCode={selectedCountry?.country_code}
                companyTypeLabel={companyTypeLabel}
                freezoneLabel={
                    countryData.freezone
                        ? selectedFreezone?.label || formatLabel(countryData.freezone)
                        : undefined
                }
                freezoneIcon={selectedFreezone?.icon || selectedType?.icon || selectedCountry?.logo}
                freezoneDescription={selectedFreezone?.description || selectedType?.description}
                pricings={pricings}
                selectedPricingIdx={selectedIdx}
                onSelectedPricingChange={setSelectedIdx}
                quoteConfig={quoteConfig}
                onQuoteConfigChange={handleQuoteConfigChange}
                onJumpToStep={() => navigate(quotePath)}
                onPackageConfirmed={() => setSubStep('configure')}
                onChangePackage={() => setSubStep('pick')}
            />

            <StickyBottomBar
                breadcrumb={breadcrumb}
                primaryLabel="Proceed"
                primaryDisabled={subStep === 'pick' || !quoteConfig}
                onPrimary={handleProceed}
                onReset={() => navigate(quotePath)}
            />
        </div>
    );
}
