import { describe, it, expect } from 'vitest';

import { EntityType } from '../../types';
import {
    buildStructures,
    catalogSelectOptions,
    parseCatalog,
    parseCatalogList,
} from '../../utils/catalog';

describe('parseCatalogList', () => {
    it('returns the data array', () => {
        expect(parseCatalogList({ data: [{ id: '6' }] })).toEqual([{ id: '6' }]);
    });

    it('returns [] when data is missing or not an array', () => {
        expect(parseCatalogList(null)).toEqual([]);
        expect(parseCatalogList({ data: 'x' })).toEqual([]);
        expect(parseCatalogList({})).toEqual([]);
    });
});

describe('parseCatalog', () => {
    it('reads the first catalog item and coerces numeric fields', () => {
        const res = {
            data: [{ id: '6', service_name: 'Proprietorship', price: '2999', currency: 'INR' }],
        };
        expect(parseCatalog(res)).toEqual(
            expect.objectContaining({
                catalogId: 6,
                serviceName: 'Proprietorship',
                price: 2999,
                currency: 'INR',
            })
        );
    });

    it('accepts the amount / catalog_name field-name variants', () => {
        const res = { data: [{ catalog_id: '6', catalog_name: 'Prop', amount: 2999 }] };
        expect(parseCatalog(res)).toEqual(
            expect.objectContaining({ catalogId: 6, serviceName: 'Prop', price: 2999 })
        );
    });

    it('defaults the currency to INR when absent', () => {
        expect(parseCatalog({ data: [{ id: '6', price: 100 }] })?.currency).toBe('INR');
    });

    it('returns null when there is no item or no price/amount', () => {
        expect(parseCatalog({ data: [] })).toBeNull();
        expect(parseCatalog({ data: [{ id: '6' }] })).toBeNull();
        expect(parseCatalog(null)).toBeNull();
    });
});

describe('catalogSelectOptions', () => {
    it('keeps active BR rows, sorts by sortOrder, labels "service — variant"', () => {
        const list = [
            {
                id: 2,
                service_id: '1',
                service_name: 'Private Limited Company',
                variant_name: 'Standard',
                status: true,
                sortOrder: 2,
            },
            { id: 1, service_id: '6', service_name: 'Proprietorship', status: true, sortOrder: 1 },
            { id: 3, service_id: '99', service_name: 'Trademark', status: true, sortOrder: 0 }, // not a BR service
            { id: 4, service_id: '3', service_name: 'LLP', status: false, sortOrder: 3 }, // inactive
        ];
        const opts = catalogSelectOptions(list);
        expect(opts).toEqual([
            { label: 'Proprietorship', value: '1' },
            { label: 'Private Limited Company — Standard', value: '2' },
        ]);
    });
});

describe('buildStructures', () => {
    it('returns only entities with an active catalog row, price overridden, sorted by sortOrder', () => {
        const list = [
            {
                id: 10,
                service_id: '1',
                service_name: 'Private Limited Company',
                price: 11999,
                status: true,
                sortOrder: 2,
            },
            {
                id: 11,
                service_id: '6',
                service_name: 'Proprietorship',
                price: 2500,
                status: true,
                sortOrder: 1,
            },
            {
                id: 12,
                service_id: '3',
                service_name: 'LLP',
                price: 7000,
                status: false,
                sortOrder: 3,
            },
        ];
        const structures = buildStructures(list);
        expect(structures.map(s => s.type)).toEqual([
            EntityType.PROPRIETORSHIP,
            EntityType.PRIVATE_LIMITED,
        ]);
        expect(structures.find(s => s.type === EntityType.PROPRIETORSHIP)?.price).toBe('₹2,500');
    });

    it('returns [] when the catalog is empty (no active rows)', () => {
        expect(buildStructures([])).toEqual([]);
    });
});
