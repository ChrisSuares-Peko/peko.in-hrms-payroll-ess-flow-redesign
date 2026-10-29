import { useEffect, useMemo, useRef } from 'react';

import { CLAUSE_MAP } from './constants';
import { resolveMoaInputs } from './resolve';
import { ISection } from '../../../../../types/forms';
import { useCustomSectionFields } from '../../useCustomSectionFields';

export type DocChoice = 'standard' | 'custom';

// MOA & AOA selections, backed by the section's real (declared) fields so they
// are stored and submitted via the normal field-value path. Each ancillary object
// is its own checkbox field (`ancillary_<key>`).
export function useMoaAoa(section: ISection, instancePath: string) {
    const { get, set, error } = useCustomSectionFields(section, instancePath);
    const seeded = useRef(false);

    // Template options — keys and labels from the API; clause text from CLAUSE_MAP.
    const templateOptions = useMemo(() => {
        const field = section.fields.find(f => f.name === 'object_template');
        return (field?.options || []).map(opt => ({
            key: String(opt.value),
            label: opt.label,
            clause: CLAUSE_MAP[String(opt.value)] || '',
        }));
    }, [section.fields]);

    // Ancillary items — keys, labels, and defaults all from the API.
    const ancillaryItems = useMemo(
        () =>
            section.fields
                .filter(f => f.name.startsWith('ancillary_'))
                .map(f => ({
                    key: f.name.replace(/^ancillary_/, ''),
                    label: f.label,
                    default: f.default_value === 'true',
                })),
        [section.fields]
    );

    // Seed the component's defaults on first mount. generateDefaultValues only
    // applies a field's default_value when the saved field carries it; sections
    // provisioned before these defaults existed render blank, so seed from the
    // API-derived items when the template is still unset.
    useEffect(() => {
        if (seeded.current) return;
        seeded.current = true;
        if (!get('moa_type')) set('moa_type', 'standard');
        if (!get('aoa_type')) set('aoa_type', 'standard');
        // Use main_object_clause as sentinel: textarea fields initialize to '' even when
        // a default_value exists (unlike radio fields which Formik auto-seeds). This
        // ensures ancillary defaults are applied on first open, but not on subsequent
        // loads where the user may have explicitly unchecked items.
        if (get('main_object_clause')) return;
        const initialKey = (get('object_template') as string) || templateOptions[0]?.key || '';
        const initialTemplate =
            templateOptions.find(t => t.key === initialKey) || templateOptions[0];
        if (initialTemplate) {
            if (!get('object_template')) set('object_template', initialTemplate.key);
            set('main_object_clause', initialTemplate.clause);
        }
        ancillaryItems.forEach(o => set(`ancillary_${o.key}`, o.default));
    });

    const { objectTemplate, mainObjectClause, ancillary } = resolveMoaInputs(
        get,
        templateOptions,
        ancillaryItems
    );

    const selectTemplate = (key: string) => {
        const template = templateOptions.find(t => t.key === key);
        set('object_template', key);
        if (template) set('main_object_clause', template.clause);
    };

    const toggleAncillary = (key: string) => set(`ancillary_${key}`, !get(`ancillary_${key}`));

    return {
        moaType: (get('moa_type') as DocChoice) || 'standard',
        setMoaType: (v: DocChoice) => set('moa_type', v),
        objectTemplate,
        selectTemplate,
        templateOptions,
        mainObjectClause,
        setMainObjectClause: (v: string) => set('main_object_clause', v),
        ancillary,
        ancillaryItems,
        toggleAncillary,
        aoaType: (get('aoa_type') as DocChoice) || 'standard',
        setAoaType: (v: DocChoice) => set('aoa_type', v),
        customMoaFile: get('custom_moa_file'),
        setCustomMoaFile: (file: File | undefined) => set('custom_moa_file', file),
        customMoaFileError: error('custom_moa_file'),
        customAoaFile: get('custom_aoa_file'),
        setCustomAoaFile: (file: File | undefined) => set('custom_aoa_file', file),
        customAoaFileError: error('custom_aoa_file'),
        generatedMoaFile: get('generated_moa_file'),
        setGeneratedMoaFile: (file: File | undefined) => set('generated_moa_file', file),
        generatedAoaFile: get('generated_aoa_file'),
        setGeneratedAoaFile: (file: File | undefined) => set('generated_aoa_file', file),
        confirmed: !!get('confirmed'),
        setConfirmed: (v: boolean) => set('confirmed', v),
        confirmedError: error('confirmed'),
    };
}

export type MoaAoaController = ReturnType<typeof useMoaAoa>;
