import { describe, it, expect } from 'vitest';

import { EntityType } from '../../types';
import {
    getAllDocNames,
    getDocPeopleGroup,
    isPartnerEntity,
    personRequiredDocs,
    serviceDocFields,
    singlePersonLabel,
} from '../../utils/proprietorDocuments';

describe('singlePersonLabel', () => {
    it('labels the proprietorship owner "Proprietor", others "Director"', () => {
        expect(singlePersonLabel({ entityType: EntityType.PROPRIETORSHIP })).toBe('Proprietor');
        expect(singlePersonLabel({ entityType: EntityType.OPC })).toBe('Director');
    });
});

describe('isPartnerEntity', () => {
    it('is true only for LLP and Partnership', () => {
        expect(isPartnerEntity(EntityType.LLP)).toBe(true);
        expect(isPartnerEntity(EntityType.PARTNERSHIP)).toBe(true);
        expect(isPartnerEntity(EntityType.PROPRIETORSHIP)).toBe(false);
        expect(isPartnerEntity(EntityType.OPC)).toBe(false);
        expect(isPartnerEntity(undefined)).toBe(false);
    });
});

describe('getDocPeopleGroup', () => {
    it('groups FieldArray entities by their people field + label', () => {
        expect(
            getDocPeopleGroup({ entityType: EntityType.PRIVATE_LIMITED, directors: [] })
        ).toEqual(expect.objectContaining({ field: 'directors', label: 'Promoter' }));
        expect(getDocPeopleGroup({ entityType: EntityType.PARTNERSHIP, partners: [] })).toEqual(
            expect.objectContaining({ field: 'partners', label: 'Partner' })
        );
        expect(getDocPeopleGroup({ entityType: EntityType.LLP, directors: [] })).toEqual(
            expect.objectContaining({ field: 'directors', label: 'Designated Partner' })
        );
    });

    it('returns null for single-owner entities (proprietorship / OPC)', () => {
        expect(getDocPeopleGroup({ entityType: EntityType.PROPRIETORSHIP })).toBeNull();
        expect(getDocPeopleGroup({ entityType: EntityType.OPC })).toBeNull();
    });
});

describe('personRequiredDocs (nationality + entity rules)', () => {
    it('Indian person → PAN + Photo, no Passport', () => {
        const keys = personRequiredDocs(
            undefined,
            'director',
            false,
            EntityType.PRIVATE_LIMITED
        ).map(d => d.key);
        expect(keys).toEqual(expect.arrayContaining(['panCard', 'photo']));
        expect(keys).not.toContain('passport');
    });

    it('foreign person → Passport (not PAN)', () => {
        const keys = personRequiredDocs(
            'foreign',
            'director',
            false,
            EntityType.PRIVATE_LIMITED
        ).map(d => d.key);
        expect(keys).toEqual(expect.arrayContaining(['passport', 'photo']));
        expect(keys).not.toContain('panCard');
    });

    it('LLP / Partnership partners do NOT submit a passport photo', () => {
        expect(
            personRequiredDocs(undefined, 'director', false, EntityType.LLP).map(d => d.key)
        ).not.toContain('photo');
        expect(
            personRequiredDocs('foreign', 'director', false, EntityType.LLP).map(d => d.key)
        ).toEqual(['passport']);
    });
});

describe('serviceDocFields (default fallback)', () => {
    it('renders NOC / Utility Bill / Rent-Lease under documents.service.* with only Utility Bill required', () => {
        const fields = serviceDocFields();
        expect(fields.map(f => f.name)).toEqual([
            'documents.service.nocFromOwner',
            'documents.service.utilityBill',
            'documents.service.rentLeaseDeed',
        ]);
        expect(fields.find(f => f.name.endsWith('utilityBill'))?.required).toBe(true);
        expect(fields.find(f => f.name.endsWith('nocFromOwner'))?.required).toBe(false);
    });
});

describe('getAllDocNames', () => {
    it('single-owner entity → service docs + documents.director.*', () => {
        const names = getAllDocNames({ entityType: EntityType.PROPRIETORSHIP });
        expect(names).toContain('documents.service.utilityBill');
        expect(names).toContain('documents.director.panCard');
        expect(names).toContain('documents.director.photo');
    });

    it('FieldArray entity → service docs + per-person documents.<field>.<i>.*', () => {
        const names = getAllDocNames({
            entityType: EntityType.PRIVATE_LIMITED,
            directors: [{ firstName: 'A' }],
        });
        expect(names).toContain('documents.directors.0.panCard');
    });
});
