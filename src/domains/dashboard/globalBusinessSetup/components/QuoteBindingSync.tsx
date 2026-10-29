import { useEffect, useRef } from 'react';

import { useFormikContext } from 'formik';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { setMetrics, setQuoteConfig } from '../slices/globalBusinessSetupSlice';
import { IForm } from '../types/forms';
import { QuoteConfig } from '../types/pricing';
import { PricingV2Draft } from '../types/pricingV2';
import { BoundTarget, extractBoundSelections } from '../utils/pricingV2/bindings';
import {
    calcValuesFromSelections,
    selectionsFromQuoteConfig,
} from '../utils/pricingV2/quoteConfig';

type Props = {
    form: IForm;
    normalized?: PricingV2Draft;
    targets: BoundTarget[];
};

/**
 * Renderless bridge (form → quote). Watches the live Formik values, extracts the
 * pricing-bound field/section values, and pushes them back into the Redux quote
 * config (and legacy `metrics`, kept in lockstep) so the live total reflects what
 * the user enters in the form. Inert when there are no bindings (V1 pricing).
 */
export default function QuoteBindingSync({ form, normalized, targets }: Props) {
    const { values } = useFormikContext<any>();
    const dispatch = useAppDispatch();
    const { quoteConfig } = useAppSelector(state => state.reducer.globalBusinessSetup);

    const quoteConfigRef = useRef(quoteConfig);
    const lastSignatureRef = useRef('');

    quoteConfigRef.current = quoteConfig;

    useEffect(() => {
        if (!normalized || !targets.length) return;

        const bound = extractBoundSelections(targets, form, values);
        const signature = JSON.stringify(bound);

        if (signature === lastSignatureRef.current) return;
        lastSignatureRef.current = signature;

        const selections = selectionsFromQuoteConfig(
            normalized,
            quoteConfigRef.current ?? undefined
        );
        const merged = {
            ...selections,
            quantities: { ...selections.quantities, ...bound.quantities },
            amounts: { ...selections.amounts, ...bound.amounts },
            toggles: { ...selections.toggles, ...bound.toggles },
            choices: { ...selections.choices, ...bound.choices },
        };

        const next = calcValuesFromSelections(normalized, merged);

        dispatch(setQuoteConfig(next as QuoteConfig));
        dispatch(
            setMetrics({
                visa: next.visa,
                activity: next.activity,
                shareholder: next.shareholder,
            })
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps -- values-driven; quoteConfig read via ref to avoid loops
    }, [values, targets, normalized]);

    return null;
}
