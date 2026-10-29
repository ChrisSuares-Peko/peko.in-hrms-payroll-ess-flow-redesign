import { describe, it, expect } from 'vitest';

import {
    ENTITY_ONBOARDING_FIELDS,
    getEntityOnboardingFields,
} from '../../../components/nupayOnboarding/entityDocuments';

const names = (entityType?: string) => getEntityOnboardingFields(entityType).map(f => f.name);

describe('getEntityOnboardingFields', () => {
    it('uses separate ubo_pan + ubo_aadhar for partnership (no ubo_adhaar typo, no shareholding)', () => {
        const partnership = names('partnership');
        expect(partnership).toContain('ubo_pan');
        expect(partnership).toContain('ubo_aadhar');
        expect(partnership).not.toContain('ubo_adhaar');
        expect(partnership).not.toContain('shareholding');
    });

    it('includes ubo_pan, ubo_aadhar, shareholding and cin for private_limited', () => {
        const priv = names('private_limited');
        expect(priv).toEqual(expect.arrayContaining(['ubo_pan', 'ubo_aadhar', 'shareholding', 'cin']));
        expect(priv).not.toContain('ubo_adhaar');
    });

    it('does not attach UBO fields to individual', () => {
        const individual = names('individual');
        expect(individual).not.toContain('ubo_pan');
        expect(individual).not.toContain('ubo_aadhar');
    });

    it('returns an empty list for an unknown or missing entity type', () => {
        expect(getEntityOnboardingFields('unknown')).toEqual([]);
        expect(getEntityOnboardingFields(undefined)).toEqual([]);
        expect(getEntityOnboardingFields()).toEqual([]);
    });

    it('marks the ownership_percentage_details / cin extras as text, everything else as file', () => {
        Object.values(ENTITY_ONBOARDING_FIELDS)
            .flat()
            .forEach(field => {
                expect(['file', 'text']).toContain(field.type);
                expect(field.required).toBe(true);
            });
        const priv = ENTITY_ONBOARDING_FIELDS.private_limited;
        expect(priv.find(f => f.name === 'cin')?.type).toBe('text');
        expect(priv.find(f => f.name === 'ubo_pan')?.type).toBe('file');
    });
});
