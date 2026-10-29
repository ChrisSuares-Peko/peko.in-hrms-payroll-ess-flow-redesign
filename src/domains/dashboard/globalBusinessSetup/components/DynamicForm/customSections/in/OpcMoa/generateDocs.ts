import { RootState, store } from '@store/store';

import { buildOpcTemplateData } from './resolve';
import { getCountries } from '../../../../../api/globalBusinessSetup';
import { ISection } from '../../../../../types/forms';
import { toPdfFile } from '../../pdf/generatePdf';
import { FormValuesMap } from '../../useFormValues';
import { buildAoaHtml } from '../MoaAoa/aoaTemplate';
import { CLAUSE_MAP } from '../MoaAoa/constants';
import { buildMoaHtml } from '../MoaAoa/moaTemplate';
import { resolveMoaInputs } from '../MoaAoa/resolve';

type FieldEntry = { field: string; name: string; value: unknown };

/**
 * Build the OPC MOA/AOA PDFs from the final submitted values and write them onto
 * the section's `generated_*_file` fields. Same flow as the MOA & AOA generator,
 * but the Declaration Clause subscriber comes from the shareholder mapping with a
 * fallback to the sole director. Runs at submit time (not tied to the component
 * being mounted), so the documents reflect the latest data regardless of which
 * page the user last viewed. Mutates `fields` in place.
 */
export async function generateOpcMoaDocs(
    values: FormValuesMap,
    config: Record<string, unknown>,
    fields: FieldEntry[],
    section: ISection
) {
    const getField = (name: string) => fields.find(f => f.name === name)?.value;
    const setField = (name: string, value: unknown) => {
        const entry = fields.find(f => f.name === name);
        if (entry) entry.value = value;
    };

    // Derive options and items from section.fields so labels reflect the API, not constants.
    const sectionFields = section?.fields ?? [];
    const templateOptions = (
        sectionFields.find(f => f.name === 'object_template')?.options || []
    ).map(opt => ({ key: String(opt.value), clause: CLAUSE_MAP[String(opt.value)] || '' }));
    const ancillaryItems = sectionFields
        .filter(f => f.name.startsWith('ancillary_'))
        .map(f => ({
            key: f.name.replace(/^ancillary_/, ''),
            label: f.label,
            default: f.default_value === 'true',
        }));

    // Resolve subscriber nationality ids to country names (same source the form's
    // country selects use), so the generated documents print names, not ids.
    const auth = (store.getState() as RootState)?.reducer?.auth;
    const countriesRes = await getCountries({
        userId: auth?.id,
        userType: auth?.role,
        filters: 'is_active=true',
    });
    const countries = countriesRes ? countriesRes.countries : [];

    const { templateData, companyName } = buildOpcTemplateData(values, config, countries);
    const { objectTemplate, mainObjectClause, ancillary } = resolveMoaInputs(
        getField,
        templateOptions,
        ancillaryItems
    );

    const moaType = (getField('moa_type') as string) || 'standard';
    const aoaType = (getField('aoa_type') as string) || 'standard';

    // Persist the resolved selections so the saved submission matches the PDF even
    // when the page was never opened (the seeding effect never ran).
    setField('object_template', objectTemplate);
    setField('main_object_clause', mainObjectClause);
    ancillaryItems.forEach(o => setField(`ancillary_${o.key}`, ancillary.includes(o.key)));

    if (moaType === 'standard') {
        const selectedAncillaryItems = ancillaryItems.filter(o => ancillary.includes(o.key));
        const moaHtml = buildMoaHtml({
            data: templateData,
            clause: mainObjectClause,
            ancillaryItems: selectedAncillaryItems,
        });
        setField('generated_moa_file', await toPdfFile(moaHtml, `MOA - ${companyName}.pdf`));
    }

    if (aoaType === 'standard') {
        const aoaHtml = buildAoaHtml(templateData);
        setField('generated_aoa_file', await toPdfFile(aoaHtml, `AOA - ${companyName}.pdf`));
    }
}
