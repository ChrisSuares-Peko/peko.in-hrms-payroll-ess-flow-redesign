import { useMemo } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { DefaultValueOverrides } from '../components/DynamicForm/utils/applyDefaultOverrides';
import { IForm } from '../types/forms';
import { BoundTarget, resolveBindings } from '../utils/pricingV2/bindings';
import { pricingToV2Draft } from '../utils/pricingV2/fromDoc';
import { selectionsFromQuoteConfig } from '../utils/pricingV2/quoteConfig';

const norm = (v: unknown) =>
    String(v ?? '')
        .trim()
        .toLowerCase();

/**
 * Resolves the pricing→form connection for the current setup:
 *  - `normalized`: the pricing doc as a V2 draft.
 *  - `targets`: which form fields/sections the pricing components bind to.
 *  - `defaultValueOverrides`: seed values (from the initial quote) to pre-fill
 *    the form at mount. Computed once when targets are ready (defaults apply at
 *    mount only; live edits flow the other way via QuoteBindingSync).
 * For V1 pricing (no `form_binding`s) `targets` is empty and everything is inert.
 */
export function useQuoteBindings(form?: IForm | null) {
    const { pricingData, quoteConfig } = useAppSelector(state => state.reducer.globalBusinessSetup);

    const normalized = useMemo(
        () => (pricingData ? pricingToV2Draft(pricingData) : undefined),
        [pricingData]
    );

    const targets: BoundTarget[] = useMemo(
        () => (normalized && form ? resolveBindings(normalized, form) : []),
        [normalized, form]
    );

    const defaultValueOverrides: DefaultValueOverrides | undefined = useMemo(() => {
        if (!normalized || !targets.length || !form) return undefined;

        const selections = selectionsFromQuoteConfig(normalized, quoteConfig ?? undefined);
        const field_values: Record<string, unknown> = {};
        const section_counts: Record<string, number> = {};

        targets.forEach(target => {
            if (target.source === 'section_count' && target.sectionId) {
                const count = selections.quantities[target.componentKey];

                if (count !== undefined && count > 0) section_counts[target.sectionId] = count;

                return;
            }

            if (!target.fieldId) return;

            let value: unknown;

            if (target.componentType === 'toggle') {
                value = selections.toggles[target.componentKey];
            } else if (target.componentType === 'amount') {
                value = selections.amounts[target.componentKey];
            } else if (target.componentType === 'choice') {
                const optionKey = selections.choices[target.componentKey];
                const option = target.choiceOptions?.find(o => o.key === optionKey);
                // Reverse-map the pricing option to the form field's option value.
                const formOpt = target.fieldOptions?.find(
                    o => norm(o.value) === norm(optionKey) || norm(o.label) === norm(option?.label)
                );

                if (formOpt?.value !== undefined) {
                    const field =
                        form.pages?.[target.pageIdx]?.sections?.[target.sectionIdx]?.fields?.[
                            target.fieldIdx ?? -1
                        ];

                    value =
                        field?.type === 'select' && field.allow_multiple
                            ? [formOpt.value]
                            : formOpt.value;
                }
            } else {
                value = selections.quantities[target.componentKey];
            }

            if (value !== undefined) field_values[target.fieldId] = value;
        });

        return { field_values, section_counts };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- defaults apply at mount; live edits sync back via QuoteBindingSync
    }, [normalized, targets]);

    return { normalized, targets, defaultValueOverrides };
}
