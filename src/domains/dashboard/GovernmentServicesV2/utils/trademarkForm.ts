import { paths } from '@src/routes/paths';

import { trademarkApplicantDetailsSchema, trademarkDetailsSchema } from '../schema';
import { ApplicantDetailsValues } from '../types';

// Shared by TrademarkRegistrationForm.tsx and its useTrademarkApplicationData/
// useTrademarkFormActions hooks — kept here (not in the page) so neither hook
// needs to import from the page component.

export const STEP_TITLES = ['Applicant Details', 'Trademark Details', 'Logo Upload', 'Preview'];

// One schema per data-entry step, matched to currentStep via Formik's validationSchema prop.
// Logo Upload/Preview have nothing required to validate.
export const STEP_VALIDATION_SCHEMAS = [
    trademarkApplicantDetailsSchema,
    trademarkDetailsSchema,
    undefined,
    undefined,
];

export const isIndividualEntity = (constitution?: string) =>
    (constitution ?? '').trim().toLowerCase() === 'individual';

// Registration/Objection/Expedited all funnel through the same generic
// governmentServicesApplication data and share these two entry points (MyApplications.tsx's

export const resolveTrademarkFormSegment = (
    serviceName?: string | null,
    variantName?: string | null
): string => {
    const name = (serviceName ?? '').toLowerCase();
    const variant = (variantName ?? '').toLowerCase();
    if (name.includes('objection')) return paths.governmentServices.objection;
    if (name.includes('expedited') || variant.includes('expedited'))
        return paths.governmentServices.expedited;
    return paths.governmentServices.register;
};

export const EMPTY_VALUES: ApplicantDetailsValues = {
    trademarkOwner: '',
    entityType: '',
    salutation: '',
    authorizedPerson: '',
    address: '',
    pincode: '',
    state: '',
    district: '',
    country: '',
    city: '',
    mainGoodsOrService: '',
    trademarkClass: '',
    description: [],
    brand: '',
    language: '',
    transliterationOfMark: '',
    translationOfMark: '',
    trademarkInUse: false,
    usedSince: '',
    usedSinceDisplay: '',
    associatedMarks: '',
    logo: null,
    logoFormat: undefined,
};
