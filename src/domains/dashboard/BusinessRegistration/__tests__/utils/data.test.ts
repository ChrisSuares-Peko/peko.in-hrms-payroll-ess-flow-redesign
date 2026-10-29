import { describe, it, expect } from 'vitest';

import { EntityType } from '../../types';
import {
    ENTITY_NAME_SUFFIX,
    ENTITY_SHORT_LABELS,
    INDIA_STATES,
    STEPS_BY_ENTITY,
    applicationStepLabel,
    buildRegisterPath,
    cityFromPincode,
    matchIndiaState,
    parseCatalogAbout,
    withEntitySuffix,
} from '../../utils/data';

describe('withEntitySuffix', () => {
    it('returns an empty string for blank / whitespace / undefined input', () => {
        expect(withEntitySuffix('', EntityType.PRIVATE_LIMITED)).toBe('');
        expect(withEntitySuffix('   ', EntityType.PRIVATE_LIMITED)).toBe('');
        expect(withEntitySuffix(undefined, EntityType.PRIVATE_LIMITED)).toBe('');
    });

    it('leaves proprietorship / partnership names unchanged (no statutory suffix)', () => {
        expect(withEntitySuffix('Acme Traders', EntityType.PROPRIETORSHIP)).toBe('Acme Traders');
        expect(withEntitySuffix('Acme & Co', EntityType.PARTNERSHIP)).toBe('Acme & Co');
    });

    it('appends the statutory suffix per entity when missing', () => {
        expect(withEntitySuffix('Acme', EntityType.PRIVATE_LIMITED)).toBe('Acme Private Limited');
        expect(withEntitySuffix('Acme', EntityType.OPC)).toBe('Acme (OPC) Private Limited');
        expect(withEntitySuffix('Acme', EntityType.LLP)).toBe('Acme LLP');
    });

    it('does not double-append when the suffix is already present (case-insensitive)', () => {
        const suffix = ENTITY_NAME_SUFFIX[EntityType.PRIVATE_LIMITED] as string;
        expect(withEntitySuffix(`Acme ${suffix.toLowerCase()}`, EntityType.PRIVATE_LIMITED)).toBe(
            `Acme ${suffix.toLowerCase()}`
        );
    });
});

describe('matchIndiaState (31568 — vendor pincode state is ALL CAPS)', () => {
    it('maps an all-caps vendor state to the proper-case dropdown option', () => {
        expect(matchIndiaState('TAMIL NADU')).toBe('Tamil Nadu');
        expect(matchIndiaState('DELHI')).toBe('Delhi');
    });

    it('is case-insensitive and trims whitespace', () => {
        expect(matchIndiaState('  maharashtra  ')).toBe('Maharashtra');
    });

    it('returns the trimmed raw string when no option matches', () => {
        expect(matchIndiaState('Atlantis')).toBe('Atlantis');
        expect(matchIndiaState('  Narnia ')).toBe('Narnia');
    });

    it('returns an empty string for null / undefined', () => {
        expect(matchIndiaState(null)).toBe('');
        expect(matchIndiaState(undefined)).toBe('');
    });
});

describe('cityFromPincode', () => {
    it('returns the first taluk entry when present', () => {
        expect(cityFromPincode({ taluk: ['Kulithalai', 'Other'], district: 'Karur' })).toBe(
            'Kulithalai'
        );
    });

    it('falls back to the district when taluk is empty or absent', () => {
        expect(cityFromPincode({ taluk: [], district: 'Karur' })).toBe('Karur');
        expect(cityFromPincode({ district: 'Karur' })).toBe('Karur');
    });

    it('returns an empty string when neither a taluk nor a string district exists', () => {
        expect(cityFromPincode({})).toBe('');
        expect(cityFromPincode({ taluk: 'notArray', district: 123 })).toBe('');
    });
});

describe('parseCatalogAbout', () => {
    it('splits a bullet block into trimmed, non-empty lines', () => {
        expect(parseCatalogAbout('* First\r\n* Second\n- Third')).toEqual([
            'First',
            'Second',
            'Third',
        ]);
    });

    it('returns an empty array for null / undefined / empty', () => {
        expect(parseCatalogAbout(null)).toEqual([]);
        expect(parseCatalogAbout(undefined)).toEqual([]);
        expect(parseCatalogAbout('')).toEqual([]);
    });
});

describe('buildRegisterPath', () => {
    it('appends the entity type and no query string when no opts are given', () => {
        const path = buildRegisterPath(EntityType.PROPRIETORSHIP);
        expect(path.endsWith(`/${EntityType.PROPRIETORSHIP}`)).toBe(true);
        expect(path).not.toContain('?');
    });

    it('keeps step=0 (0 is a real step) and url-encodes the applicationId', () => {
        const path = buildRegisterPath(EntityType.LLP, {
            applicationId: 'BR/2026/1',
            step: 0,
            status: 'success',
        });
        expect(path).toContain('applicationId=BR%2F2026%2F1');
        expect(path).toContain('step=0');
        expect(path).toContain('status=success');
    });
});

describe('applicationStepLabel', () => {
    it('returns "—" for a non-pending application or an unknown entity', () => {
        expect(applicationStepLabel(EntityType.PROPRIETORSHIP, 'SUBMITTED', 'COMPLETED')).toBe('—');
        expect(applicationStepLabel('unknown_entity', 'PENDING', 'PENDING')).toBe('—');
    });

    it('uses the persisted step when it is in range', () => {
        expect(
            applicationStepLabel(EntityType.PROPRIETORSHIP, 'PENDING', 'PENDING', { step: 2 })
        ).toBe('Address Details');
    });

    it('falls back to the first step for an unpaid draft with no persisted step', () => {
        expect(applicationStepLabel(EntityType.PRIVATE_LIMITED, 'PENDING', 'PENDING')).toBe(
            'Basic Information'
        );
    });

    it('points a paid draft at the furthest step whose data is present', () => {
        expect(
            applicationStepLabel(EntityType.PRIVATE_LIMITED, 'PENDING', 'COMPLETED', {
                directors: [{ firstName: 'A' }],
            })
        ).toBe('Promoters KYC');
    });
});

describe('INDIA_STATES', () => {
    it('uses label === value for every option', () => {
        INDIA_STATES.forEach(o => expect(o.label).toBe(o.value));
    });

    it('lists the priority states first in the agreed order', () => {
        expect(INDIA_STATES.slice(0, 8).map(o => o.value)).toEqual([
            'Maharashtra',
            'Delhi',
            'Uttar Pradesh',
            'Karnataka',
            'Tamil Nadu',
            'Telangana',
            'Andhra Pradesh',
            'Gujarat',
        ]);
    });

    it('excludes vendor meta rows like "International"', () => {
        const values = INDIA_STATES.map(o => o.value);
        expect(values).not.toContain('International');
        expect(values).not.toContain('Not Applicable');
    });
});

describe('ENTITY_SHORT_LABELS', () => {
    it('has a banner label for every entity type', () => {
        expect(ENTITY_SHORT_LABELS[EntityType.PROPRIETORSHIP]).toBe('Proprietorship');
        expect(ENTITY_SHORT_LABELS[EntityType.PARTNERSHIP]).toBe('Partnership Firm');
        expect(ENTITY_SHORT_LABELS[EntityType.OPC]).toBe('One Person Company (OPC)');
        expect(ENTITY_SHORT_LABELS[EntityType.PRIVATE_LIMITED]).toBe('Private Limited Company');
        expect(ENTITY_SHORT_LABELS[EntityType.LLP]).toBe('LLP');
    });
});

describe('STEPS_BY_ENTITY (all flows)', () => {
    it('defines the six proprietorship steps in order', () => {
        expect(STEPS_BY_ENTITY[EntityType.PROPRIETORSHIP]).toEqual([
            'Basic Information',
            'Applicant Details',
            'Address Details',
            'GST Information',
            'Documents',
            'Registration & Filing',
        ]);
    });

    it('defines a 5-step flow for every incorporation / partnership entity', () => {
        expect(STEPS_BY_ENTITY[EntityType.OPC]).toHaveLength(5);
        expect(STEPS_BY_ENTITY[EntityType.PRIVATE_LIMITED]).toHaveLength(5);
        expect(STEPS_BY_ENTITY[EntityType.LLP]).toHaveLength(5);
        expect(STEPS_BY_ENTITY[EntityType.PARTNERSHIP]).toHaveLength(5);
        // Every flow starts at Basic Information.
        [
            EntityType.OPC,
            EntityType.PRIVATE_LIMITED,
            EntityType.LLP,
            EntityType.PARTNERSHIP,
        ].forEach(e => expect(STEPS_BY_ENTITY[e]?.[0]).toBe('Basic Information'));
    });
});
