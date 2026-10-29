import { useEffect } from 'react';

import { getIn, useFormikContext } from 'formik';

import { SENTINEL_FIELD, SH } from './constants';
import { Director, Shareholder } from './types';
import { ISection } from '../../../../../types/forms';
import { useCustomSectionFields } from '../../useCustomSectionFields';
import { useFormValues } from '../../useFormValues';

const str = (v: unknown): string => {
    if (typeof v === 'string') return v;
    if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'string') return v[0];
    return '';
};

const toNum = (v: unknown): number | null => {
    const n = Number(v);
    return !Number.isNaN(n) && n > 0 ? n : null;
};

export const computeShares = (sharePercent: number, paidUpShares: number): number =>
    Math.round((sharePercent / 100) * paidUpShares);

/**
 * Read-side state + cross-instance sentinel for the shareholding pattern.
 *
 * Shareholder instances are stored as numeric keys under the section path
 * (`${sectionPath}.0`, `${sectionPath}.1`, ...) — the same shape our
 * RepeatableSection uses. The `instancePath` this hook receives varies by mount:
 *  - legacy (non-repeater): `pages.{pageId}.{sectionId}`
 *  - repeater item form:    `pages.{pageId}.{sectionId}.{idx}`
 *  - repeater footer:       `pages.{pageId}.{sectionId}.0`
 * so the section path is derived by stripping a trailing numeric segment.
 *
 * Instance add/remove/seed lives in useShareholderList (legacy mode only) so
 * repeater-mode consumers don't drive the instance list the repeater UI owns.
 */
export function useShareholdingPattern(
    section: ISection,
    instancePath: string,
    config: Record<string, unknown> = {}
) {
    const { values, errors, setFieldValue } = useFormikContext<any>();
    const { error } = useCustomSectionFields(section, instancePath);
    const formValues = useFormValues();

    const sectionPath = instancePath.replace(/\.\d+$/, '');
    const sectionValues = (getIn(values, sectionPath) as Record<string, any>) || {};
    const instanceIndices = Object.keys(sectionValues)
        .filter(key => !Number.isNaN(Number(key)))
        .map(Number)
        .sort((a, b) => a - b);

    // Read paid-up capital and face value from the admin-configured form fields
    const paidUpCapitalField = str(config.paid_up_capital_field);
    const faceValueField = str(config.face_value_field);

    const paidUpCapital = toNum((formValues.allByName[paidUpCapitalField] ?? [])[0]);
    const faceValue = toNum((formValues.allByName[faceValueField] ?? [])[0]);
    const paidUpShares = paidUpCapital && faceValue ? Math.round(paidUpCapital / faceValue) : null;

    // Director linking
    const directorNameField = str(config.director_name_field);
    const directorNationalityField = str(config.director_nationality_field);
    const directorEmailField = str(config.director_email_field);
    const directorPhoneField = str(config.director_phone_field);
    const directorPanField = str(config.director_pan_field);
    const indianNationalityValue = str(config.indian_nationality_value).toLowerCase();

    const directors: Director[] = (
        directorNameField
            ? (formValues.allByName[directorNameField] ?? []).map(str).filter(Boolean)
            : []
    ).map((name, i) => ({
        name,
        nationality: str((formValues.allByName[directorNationalityField] ?? [])[i]),
        email: str((formValues.allByName[directorEmailField] ?? [])[i]),
        phone: str((formValues.allByName[directorPhoneField] ?? [])[i]),
        pan: str((formValues.allByName[directorPanField] ?? [])[i]),
    }));

    const shareholders: Shareholder[] = instanceIndices.map(idx => {
        const inst = sectionValues[idx] || {};
        return {
            id: String(inst.id ?? idx),
            name: String(inst[SH.name] ?? ''),
            nationality: String(inst[SH.nationality] ?? ''),
            email: String(inst[SH.email] ?? ''),
            phone: String(inst[SH.phone] ?? ''),
            pan: String(inst[SH.pan] ?? ''),
            sharePercent: Number(inst[SH.sharePercent] ?? 0) || 0,
            isDirector: inst[SH.isDirector] === true || inst[SH.isDirector] === 'true',
        };
    });

    const totalSharesAllotted = paidUpShares
        ? shareholders.reduce((sum, s) => sum + computeShares(s.sharePercent, paidUpShares), 0)
        : 0;
    const remainingShares = paidUpShares !== null ? paidUpShares - totalSharesAllotted : null;
    const everyShareholderHasShares =
        paidUpShares !== null &&
        shareholders.every(s => computeShares(s.sharePercent, paidUpShares) > 0);
    const shareholdersValid =
        paidUpShares !== null &&
        totalSharesAllotted === paidUpShares &&
        shareholders.length > 0 &&
        everyShareholderHasShares;

    // Keep the sentinel in sync on the flat section path AND on every instance,
    // and mirror the first shareholder onto the flat field names so the flat
    // schema (e.g. the always-required email rule) validates against real data.
    // Runs every render with diff-guards, like useMoaAoa's seeding effect. In
    // repeater mode this lives in the always-mounted footer so the sentinel
    // stays correct even while the per-item modal is closed.
    useEffect(() => {
        const sentinel = shareholdersValid ? 'valid' : '';
        const write = (path: string, value: unknown) => {
            if (getIn(values, path) !== value) setFieldValue(path, value);
        };

        write(`${sectionPath}.${SENTINEL_FIELD}`, sentinel);
        instanceIndices.forEach(idx => write(`${sectionPath}.${idx}.${SENTINEL_FIELD}`, sentinel));

        const first = shareholders[0];
        write(`${sectionPath}.${SH.name}`, first?.name ?? '');
        write(`${sectionPath}.${SH.nationality}`, first?.nationality ?? '');
        write(`${sectionPath}.${SH.email}`, first?.email ?? '');
        write(`${sectionPath}.${SH.phone}`, first?.phone ?? '');
        write(`${sectionPath}.${SH.pan}`, first?.pan ?? '');
        write(`${sectionPath}.${SH.sharePercent}`, first ? String(first.sharePercent) : '');
        write(`${sectionPath}.${SH.isDirector}`, first?.isDirector ?? false);
    });

    const updateShareholder = (id: string, data: Omit<Shareholder, 'id'>) => {
        const listIdx = shareholders.findIndex(s => s.id === id);
        if (listIdx < 0) return;

        const absoluteIdx = instanceIndices[listIdx];
        setFieldValue(`${sectionPath}.${absoluteIdx}`, {
            ...(sectionValues[absoluteIdx] || {}),
            [SH.name]: data.name,
            [SH.nationality]: data.nationality,
            [SH.email]: data.email,
            [SH.phone]: data.phone,
            [SH.pan]: data.pan,
            [SH.sharePercent]: data.sharePercent,
            [SH.isDirector]: data.isDirector ?? false,
        });
    };

    // The sentinel error lands on the flat path with a non-repeatable section
    // definition, or on the instances with a repeatable one — check both.
    const sectionError = (name: string): string | undefined => {
        const flat = error(name);
        if (flat) return flat;
        const instErr = getIn(errors, `${instancePath}.0.${name}`);
        return typeof instErr === 'string' ? instErr : undefined;
    };

    return {
        error: sectionError,
        paidUpShares,
        shareholders,
        totalSharesAllotted,
        remainingShares,
        shareholdersValid,
        directors,
        directorLinkingConfigured: !!directorNameField,
        indianNationalityValue,
        updateShareholder,
    };
}

export type ShareholdingPatternController = ReturnType<typeof useShareholdingPattern>;
