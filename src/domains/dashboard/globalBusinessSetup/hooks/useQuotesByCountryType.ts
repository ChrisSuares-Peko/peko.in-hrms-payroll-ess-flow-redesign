import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getPlanPricing } from '../api/globalBusinessSetup';
import { PricingType } from '../types/pricing';
import { calcStartingFromPrice } from '../utils/pricingCalc';

export type Quote = {
    id: string;
    freezone: string;
    freezoneLabel: string;
    freezoneIcon?: string;
    freezoneDescription?: string;
    pricings: PricingType[];
    displayPrice: number;
    displayPackageName: string;
    highlights?: string;
};

type FreezoneOption = {
    value: string;
    label: string;
    icon?: string;
    description?: string;
};

export const useQuotesByCountryType = () => {
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [loading, setLoading] = useState(false);
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();

    const fetchQuotes = async (country: string, type: string, freezones: FreezoneOption[]) => {
        setLoading(true);

        const activeFreezones: FreezoneOption[] =
            (freezones ?? []).length > 0 ? freezones : [{ value: '', label: '' }];

        let failed = false;

        const enriched = await Promise.all(
            activeFreezones.map(async fz => {
                let pricing: PricingType[] = [];
                try {
                    const pricingRes = await getPlanPricing({
                        userId: id,
                        userType: role,
                        country,
                        company_type: type,
                        freezone: fz.value,
                    });
                    if (pricingRes === false) {
                        failed = true;
                    } else {
                        pricing = (pricingRes as PricingType[])
                            .filter(p => p.status === 'active')
                            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                    }
                } catch {
                    failed = true;
                }
                return { fz, pricing };
            })
        );

        const combined: Quote[] = enriched.map(({ fz, pricing }) => {
            const firstPricing = pricing[0];
            return {
                id: fz.value || type,
                freezone: fz.value,
                freezoneLabel: fz.label,
                freezoneIcon: fz.icon,
                freezoneDescription: fz.description,
                pricings: pricing,
                displayPrice: firstPricing ? calcStartingFromPrice(firstPricing) ?? 0 : 0,
                displayPackageName: firstPricing?.name ?? '',
                highlights: firstPricing?.highlights,
            };
        });

        if (failed) {
            dispatch(
                showToast({
                    description: 'Could not load pricing for some options. Please try again.',
                    variant: 'error',
                })
            );
        }

        setQuotes(combined);
        setLoading(false);
    };

    const clearQuotes = () => setQuotes([]);

    return { quotes, loading, fetchQuotes, clearQuotes };
};
