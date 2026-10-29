import { getCustomSectionEntry } from './registry';
import { FormValuesMap } from './useFormValues';
import { IForm } from '../../../types/forms';

type FieldEntry = { field: string; name: string; value: unknown };
type InstanceEntry = { fields?: FieldEntry[] };
type SectionEntry = { section: string; instances?: InstanceEntry[] };
type PageEntry = { page?: string; sections?: SectionEntry[] };
type SubmitPayload = { pages?: PageEntry[] };

const isEmpty = (value: unknown) =>
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0);

// The submission payload is the vendor array shape (pages[].sections[]
// .instances[].fields[]), not the live Formik map that useFormValues walks —
// so finalize gets its own values-map builder over that shape.
export function buildSubmissionValuesMap(pages: PageEntry[] = []): FormValuesMap {
    const byName: Record<string, unknown> = {};
    const allByName: Record<string, unknown[]> = {};

    pages.forEach(page =>
        (page.sections ?? []).forEach(section =>
            (section.instances ?? []).forEach(instance =>
                (instance.fields ?? []).forEach(({ name, value }) => {
                    if (!name) return;
                    if (!allByName[name]) allByName[name] = [];
                    allByName[name].push(value);
                    if (byName[name] === undefined && !isEmpty(value)) byName[name] = value;
                })
            )
        )
    );

    const get = (name: string, fallback?: unknown) =>
        byName[name] !== undefined ? byName[name] : fallback;

    return { byName, allByName, get };
}

/**
 * Run each custom section's submit-time `finalize` hook on the submission
 * payload just before it is sent (e.g. to generate a document and attach it as
 * a field value). Operates on the full form values (every page), so it works
 * even if the custom section's page was never opened. Mutates `payload`.
 */
export async function finalizeCustomSections(form: IForm, payload: SubmitPayload) {
    if (!form?.pages || !payload?.pages) return payload;

    const values = buildSubmissionValuesMap(payload.pages);

    const jobs: Array<{ key: string; run: () => Promise<void> | void }> = [];

    form.pages.forEach((formPage, pageIdx) => {
        const dataPage = payload.pages?.[pageIdx];
        if (!dataPage?.sections) return;

        formPage.sections.forEach(formSection => {
            if (formSection.section_type !== 'custom') return;

            const entry = getCustomSectionEntry(formSection.component_key);
            if (!entry?.finalize) return;

            const dataSection = dataPage.sections?.find(s => s.section === formSection._id);
            // Run finalize once per instance (a repeated custom section — e.g. a
            // repeater-mode ShareholdingPattern/KycDocuments — generates its
            // artifacts per row). Single-instance sections just run once.
            (dataSection?.instances ?? []).forEach(instance => {
                const fields = instance?.fields;
                if (!fields) return;

                jobs.push({
                    key: formSection.component_key || formSection._id,
                    run: () =>
                        entry.finalize?.({
                            values,
                            config: (formSection.component_config || {}) as Record<string, unknown>,
                            fields,
                            form,
                            section: formSection,
                        }),
                });
            });
        });
    });

    // Run finalizers sequentially (PDF generation is heavy and order matters),
    // but isolate each one: a failure to generate a single document is logged
    // and skipped rather than aborting the whole submission. A generated PDF is
    // recoverable/regenerable — it must not block a company registration.
    await jobs.reduce<Promise<unknown>>(
        (chain, job) =>
            chain.then(() =>
                Promise.resolve()
                    .then(() => job.run())
                    .catch(err => {
                        console.error(
                            `[globalBusinessSetup] custom section "${job.key}" finalize failed`,
                            err
                        );
                    })
            ),
        Promise.resolve()
    );

    return payload;
}
