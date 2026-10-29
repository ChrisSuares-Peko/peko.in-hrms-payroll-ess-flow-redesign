import { useEffect, useRef } from 'react';

import { getIn, useFormikContext } from 'formik';
import { v4 as uuid } from 'uuid';

import { SH } from './constants';
import { Shareholder } from './types';
import { ISection } from '../../../../../types/forms';

const str = (v: unknown): string => {
    if (typeof v === 'string') return v;
    if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'string') return v[0];
    return '';
};

const defaultValueForField = (fieldType: string): unknown => {
    switch (fieldType) {
        case 'text':
        case 'textarea':
        case 'email':
        case 'phone':
        case 'radio':
            return '';
        case 'checkbox':
            return false;
        default:
            return undefined;
    }
};

const buildEmptyInstance = (section: ISection, id: string) => {
    const instance: Record<string, unknown> = { id };
    section.fields.forEach(field => {
        instance[field.name] = defaultValueForField(field.type);
    });
    return instance;
};

/**
 * Instance-list mutations + seeding for the self-managed (non-repeater) mode.
 * Kept out of useShareholdingPattern so repeater-mode consumers (the footer and
 * the per-instance form) don't seed or mutate the instance list the repeater UI
 * owns. Instances are stored as numeric keys under the section path — the same
 * shape RepeatableSection uses.
 */
export function useShareholderList(section: ISection, instancePath: string) {
    const { values, setFieldValue } = useFormikContext<any>();
    const seeded = useRef(false);

    const sectionPath = instancePath.replace(/\.\d+$/, '');
    const readSection = () => (getIn(values, sectionPath) as Record<string, any>) || {};
    const readIndices = (source: Record<string, any>) =>
        Object.keys(source)
            .filter(key => !Number.isNaN(Number(key)))
            .map(Number)
            .sort((a, b) => a - b);

    // Seed up to 2 empty shareholder instances on first load and backfill ids for
    // instances restored from a saved draft (ids are session-scoped identities).
    // Gated on the builder repeater flag: with the repeater enabled, instance
    // counts belong to the repeater (min/max, add/remove), not this component.
    useEffect(() => {
        if (seeded.current || section.repeater?.enabled) return;
        seeded.current = true;

        const sectionValues = readSection();
        const instanceIndices = readIndices(sectionValues);

        instanceIndices.forEach(idx => {
            if (!sectionValues[idx]?.id) setFieldValue(`${sectionPath}.${idx}.id`, uuid());
        });

        let count = instanceIndices.length;

        // A draft saved through the flat (non-repeatable) path only kept the
        // mirrored first shareholder — rehydrate it as instance 0.
        if (count === 0 && (str(sectionValues[SH.name]) || str(sectionValues[SH.email]))) {
            setFieldValue(`${sectionPath}.0`, {
                ...buildEmptyInstance(section, uuid()),
                [SH.name]: sectionValues[SH.name] ?? '',
                [SH.nationality]: sectionValues[SH.nationality] ?? '',
                [SH.email]: sectionValues[SH.email] ?? '',
                [SH.phone]: sectionValues[SH.phone] ?? '',
                [SH.pan]: sectionValues[SH.pan] ?? '',
                [SH.sharePercent]: Number(sectionValues[SH.sharePercent] ?? 0) || 0,
                [SH.isDirector]: sectionValues[SH.isDirector] === true,
            });
            count = 1;
        }

        for (let idx = count; idx < 2; idx += 1) {
            setFieldValue(`${sectionPath}.${idx}`, buildEmptyInstance(section, uuid()));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const addSpecific = (s: Shareholder) => {
        const instanceIndices = readIndices(readSection());
        setFieldValue(
            `${sectionPath}.${instanceIndices.length}`,
            buildEmptyInstance(section, s.id)
        );
    };

    const removeShareholder = (id: string) => {
        const sectionValues = readSection();
        const instanceIndices = readIndices(sectionValues);
        if (instanceIndices.length <= 1) return;

        const listIdx = instanceIndices.findIndex(idx => String(sectionValues[idx]?.id) === id);
        if (listIdx < 0) return;

        // Shift the following instances down one slot, then drop the last key
        // (same reindexing approach as RepeatableSection.removeInstance).
        for (let i = listIdx; i < instanceIndices.length - 1; i += 1) {
            setFieldValue(`${sectionPath}.${i}`, sectionValues[i + 1]);
        }
        setFieldValue(`${sectionPath}.${instanceIndices.length - 1}`, undefined);
    };

    return { addSpecific, removeShareholder };
}

export type ShareholderListController = ReturnType<typeof useShareholderList>;
