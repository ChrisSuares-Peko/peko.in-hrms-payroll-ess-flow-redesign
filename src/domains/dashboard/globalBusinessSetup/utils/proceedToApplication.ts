import { NavigateFunction } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import {
    resetApplication,
    setCountryData,
    setMetrics,
    setPricingData,
    setQuoteConfig,
} from '../slices/globalBusinessSetupSlice';
import { PricingType, QuoteConfig } from '../types/pricing';

type CountryData = {
    country: string;
    type: string;
    freezone: string;
};

type ProceedArgs = {
    countryData: CountryData;
    activePricing: PricingType | null;
    quoteConfig: QuoteConfig | null;
};

export const proceedToApplication = (
    dispatch: (action: unknown) => void,
    navigate: NavigateFunction,
    { countryData, activePricing, quoteConfig }: ProceedArgs
) => {
    dispatch(resetApplication());
    dispatch(setCountryData(countryData));

    if (activePricing && quoteConfig) {
        dispatch(setPricingData(activePricing));
        dispatch(setQuoteConfig(quoteConfig));
        dispatch(
            setMetrics({
                visa: quoteConfig.visa,
                activity: quoteConfig.activity,
                shareholder: quoteConfig.shareholder,
            })
        );
    }

    navigate(`${paths.dashboard.globalBusinessSetup}/${paths.globalBusinessSetup.getStarted}/${paths.globalBusinessSetup.new}`);
};
