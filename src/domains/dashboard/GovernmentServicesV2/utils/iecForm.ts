import { IecApplicantDetailsValues } from '../types';

export const IEC_STEP_TITLES = ['Application Details', 'Documents', 'Preview'];

export const SALUTATION_OPTIONS = [
    { label: 'Mr.', value: 'Mr.' },
    { label: 'Mrs.', value: 'Mrs.' },
    { label: 'Dr.', value: 'Dr.' },
    { label: 'Ms.', value: 'Ms.' },
    { label: 'Miss.', value: 'Miss.' },
    { label: 'Prof.', value: 'Prof.' },
];

export type PreferredSector = 'Import' | 'Export' | 'Others';

export const PREFERRED_SECTOR_OPTIONS: { label: string; value: PreferredSector }[] = [
    { label: 'Import', value: 'Import' },
    { label: 'Export', value: 'Export' },
    { label: 'Others', value: 'Others' },
];

// Doc §7.2's entity-to-document matrix is computed server-side (see purchase's
// controllers/corporate/govtServicesIecV2.js's own requiredDocumentTypesForEntity) so the
// Documents step's required/uploaded state is a single source of truth, not duplicated here.

export const EMPTY_IEC_VALUES: IecApplicantDetailsValues = {
    businessApplicationId: '',
    salutation: '',
    entityType: '',
    authorizedPersonId: '',
    authorizedPerson: '',
    preferredSectors: [],
    importDetails: [],
    exportDetails: [],
    othersDetails: [],
};
