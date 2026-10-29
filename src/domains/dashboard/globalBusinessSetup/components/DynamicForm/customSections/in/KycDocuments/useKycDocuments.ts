import { useEffect } from 'react';

import { useFormikContext } from 'formik';

import { MAX_DIRECTORS } from './constants';
import { ISection } from '../../../../../types/forms';
import { useCustomSectionFields } from '../../useCustomSectionFields';
import { useFormValues } from '../../useFormValues';

// Ctrl fields mirror external form values and act as conditional gates for Yup
// validation. They must be set without triggering validation (setFieldValue's
// third argument false) because validating would immediately show "required"
// errors on dependent file fields before the user has had a chance to fill them in.
function useCtrlSync(section: ISection, instancePath: string, snapshot: string) {
    const { setFieldValue } = useFormikContext<any>();

    useEffect(() => {
        const parts = snapshot.split('|');
        const hasOffice = parts[0] === 'true';
        const officeType = parts[1] ?? '';
        const directorCount = parseInt(parts[2] ?? '0', 10);
        const nationalities = parts[3] ? parts[3].split(',') : [];
        const ownedOfficeValue = parts[4] ?? '';
        const indianNationalityValue = parts[5] ?? '';
        const isOwned = officeType === ownedOfficeValue;

        const setCtrl = (name: string, value: string) => {
            const hasField = section.fields?.some(f => f.name === name);

            if (hasField) {
                setFieldValue(`${instancePath}.${name}`, value, false);
            }
        };

        setCtrl('ctrl_has_office', hasOffice ? 'yes' : '');
        setCtrl('ctrl_office_owned', hasOffice && isOwned ? 'yes' : '');
        setCtrl('ctrl_office_rented', hasOffice && !isOwned && officeType !== '' ? 'yes' : '');

        for (let i = 0; i < MAX_DIRECTORS; i += 1) {
            const exists = i < directorCount;
            const nat = (nationalities[i] ?? '').toLowerCase();

            setCtrl(`ctrl_dir_${i}`, exists ? 'yes' : '');
            setCtrl(`ctrl_indian_${i}`, exists && nat === indianNationalityValue ? 'yes' : '');
            setCtrl(
                `ctrl_foreign_${i}`,
                exists && nat !== '' && nat !== indianNationalityValue ? 'yes' : ''
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [snapshot]);
}

const str = (v: unknown): string => {
    if (typeof v === 'string') return v;
    if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'string') return v[0];

    return '';
};

export function useKycDocuments(
    section: ISection,
    instancePath: string,
    config: Record<string, unknown>
) {
    const { get, set, error } = useCustomSectionFields(section, instancePath);
    const values = useFormValues();

    const officeYesValue = str(config.office_yes_value).toLowerCase();
    const ownedOfficeValue = str(config.owned_office_value).toLowerCase();
    const indianNationalityValue = str(config.indian_nationality_value).toLowerCase();
    const isLLP = config.is_llp === true;

    const rawOfficeValue = str(values.get(str(config.office_availability_field)));
    const hasOffice = rawOfficeValue.toLowerCase() === officeYesValue && officeYesValue !== '';
    const officeType = str(values.get(str(config.office_type_field))).toLowerCase();

    const directorNames = (values.allByName[config.director_name_field as string] ?? []).map(str);
    const nationalities = (values.allByName[config.nationality_field as string] ?? []).map(str);
    const directorCount = Math.min(directorNames.length, MAX_DIRECTORS);

    const isOwned = officeType === ownedOfficeValue && ownedOfficeValue !== '';

    const ctrlSnapshot = `${hasOffice}|${officeType}|${directorCount}|${nationalities.join(',')}|${ownedOfficeValue}|${indianNationalityValue}`;

    useCtrlSync(section, instancePath, ctrlSnapshot);

    return {
        isLLP,
        personLabel: isLLP ? 'Partner' : 'Director',
        hasOffice,
        isOwned,
        directorCount,
        directorNames,
        nationalities,
        indianNationalityValue,
        get,
        set,
        error,
    };
}

export type KycDocumentsController = ReturnType<typeof useKycDocuments>;
