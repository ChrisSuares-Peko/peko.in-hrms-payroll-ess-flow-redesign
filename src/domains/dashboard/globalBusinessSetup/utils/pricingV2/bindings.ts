import { IForm } from '../../types/forms';
import { ComponentTypeV2, PreviewSelectionsV2, PricingV2Draft } from '../../types/pricingV2';
import { isConditionMet } from '../pathResolver';

export type BoundTarget = {
    componentKey: string;
    componentType: ComponentTypeV2;
    source: 'field_value' | 'section_count';
    fieldId?: string;
    sectionId?: string;
    pageIdx: number;
    sectionIdx: number;
    fieldIdx?: number;
    choiceOptions?: { key: string; label: string }[];
    fieldOptions?: { label?: string; value?: string }[];
};

const norm = (v: unknown) =>
    String(v ?? '')
        .trim()
        .toLowerCase();

// Given a raw form value (the option's `value`, possibly an array for
// multi-selects), resolve which pricing choice-option key it maps to. Matches
// loosely: the raw value, or its form-option label, against the pricing option's
// key or label — case-insensitive.
export function resolveChoiceKey(
    raw: unknown,
    choiceOptions?: { key: string; label: string }[],
    fieldOptions?: { label?: string; value?: string }[]
): string | undefined {
    const val = Array.isArray(raw) ? raw[0] : raw;

    if (val === undefined || val === null || val === '') return undefined;

    const formOpt = (fieldOptions ?? []).find(o => o.value === val || o.label === val);
    const candidates = [val, formOpt?.value, formOpt?.label].filter(Boolean).map(norm);
    const match = (choiceOptions ?? []).find(
        o => candidates.includes(norm(o.key)) || candidates.includes(norm(o.label))
    );

    return match?.key;
}

// Resolve each pricing component's form_binding to a concrete location in the
// form schema (matching by ref_id, then _id). Operates on the IForm schema.
export function resolveBindings(pricing: PricingV2Draft, form: IForm): BoundTarget[] {
    const targets: BoundTarget[] = [];

    if (!form?.pages) return targets;

    pricing.components.forEach(component => {
        const binding = component.form_binding;

        if (!binding || component.type === 'fee') return;

        (form.pages ?? []).forEach((page, pageIdx) => {
            (page.sections ?? []).forEach((section, sectionIdx) => {
                if (binding.source === 'section_count') {
                    const matches =
                        (binding.section_ref_id && section.ref_id === binding.section_ref_id) ||
                        (binding.section && String(section._id) === String(binding.section));

                    if (matches) {
                        targets.push({
                            componentKey: component.key,
                            componentType: component.type,
                            source: 'section_count',
                            sectionId: String(section._id),
                            pageIdx,
                            sectionIdx,
                        });
                    }

                    return;
                }

                (section.fields ?? []).forEach((field, fieldIdx) => {
                    const matches =
                        (binding.field_ref_id && field.ref_id === binding.field_ref_id) ||
                        (binding.field && String(field._id) === String(binding.field));

                    if (matches) {
                        targets.push({
                            componentKey: component.key,
                            componentType: component.type,
                            source: 'field_value',
                            fieldId: String(field._id),
                            pageIdx,
                            sectionIdx,
                            fieldIdx,
                            ...(component.type === 'choice'
                                ? {
                                      choiceOptions: (component.options ?? []).map(o => ({
                                          key: o.key,
                                          label: o.label,
                                      })),
                                      fieldOptions: (field.options ?? []).map(o => ({
                                          label: o.label,
                                          value: o.value,
                                      })),
                                  }
                                : {}),
                        });
                    }
                });
            });
        });
    });

    return targets;
}

const isEmpty = (value: unknown) =>
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && !value.length);

// Read bound values out of the LIVE Formik values tree
// (`values.pages[pageId][sectionId][.idx].name`) — Peko's value shape, which
// differs from the vendor's submitted `instances[].fields[]` array. Section-count
// bindings count numeric instance keys; field bindings read the field by name
// (first instance for repeater sections).
export function extractBoundSelections(
    targets: BoundTarget[],
    form: IForm,
    values: any
): Partial<Pick<PreviewSelectionsV2, 'quantities' | 'amounts' | 'toggles' | 'choices'>> {
    const quantities: Record<string, number> = {};
    const amounts: Record<string, number> = {};
    const toggles: Record<string, boolean> = {};
    const choices: Record<string, string | null> = {};

    const pagesVals = values?.pages ?? {};

    // Reset a hidden/invisible target to its "nothing selected" state — never
    // omit it. Omitting lets the caller's merge (`{...previous, ...bound}`) keep
    // a stale prior binding and silently keep charging for a now-hidden item.
    const reset = (target: BoundTarget) => {
        if (target.componentType === 'choice') choices[target.componentKey] = null;
        else if (target.componentType === 'toggle') toggles[target.componentKey] = false;
        else if (target.componentType === 'amount') amounts[target.componentKey] = 0;
        else quantities[target.componentKey] = 0;
    };

    targets.forEach(target => {
        const page = form.pages?.[target.pageIdx];
        const section = page?.sections?.[target.sectionIdx];

        if (!page || !section) return;

        // A bound component must independently respect conditionals: the form's
        // value tree isn't cleared when a field/section hides, so a bound target
        // whose section is hidden must reset (not keep charging).
        if (!isConditionMet(section.conditional, form, values, page._id, section._id)) {
            reset(target);

            return;
        }

        const sectionVals = pagesVals?.[page._id]?.[section._id];
        let raw: unknown;

        if (target.source === 'section_count') {
            raw =
                sectionVals && typeof sectionVals === 'object'
                    ? Object.keys(sectionVals).filter(k => !Number.isNaN(Number(k))).length
                    : 0;
        } else {
            const field =
                target.fieldIdx !== undefined ? section.fields?.[target.fieldIdx] : undefined;
            const name = field?.name;

            if (!name) return;

            // Repeater sections bind to the first instance (unchanged).
            const instanceIdx = section.repeater?.enabled ? 0 : undefined;

            // Same for the bound field itself — a hidden conditional field resets.
            if (
                !isConditionMet(field.conditional, form, values, page._id, section._id, instanceIdx)
            ) {
                reset(target);

                return;
            }

            raw =
                instanceIdx !== undefined
                    ? sectionVals?.[instanceIdx]?.[name]
                    : sectionVals?.[name];
        }

        if (isEmpty(raw)) return;

        if (target.componentType === 'choice') {
            // Always set the key (null when the value matches no priced option)
            // so the caller's merge overrides a stale prior selection instead of
            // keeping it (e.g. the answer changed from "Yes" to "No").
            choices[target.componentKey] =
                resolveChoiceKey(raw, target.choiceOptions, target.fieldOptions) ?? null;

            return;
        }

        if (target.componentType === 'toggle') {
            toggles[target.componentKey] = raw === true || raw === 'true' || raw === 1;

            return;
        }

        const numeric = Number(raw);

        if (Number.isNaN(numeric)) return;

        if (target.componentType === 'amount') {
            amounts[target.componentKey] = numeric;
        } else {
            quantities[target.componentKey] = numeric;
        }
    });

    return { quantities, amounts, toggles, choices };
}

export function boundComponentKeys(pricing: PricingV2Draft): string[] {
    return pricing.components.filter(c => c.form_binding && c.type !== 'fee').map(c => c.key);
}
