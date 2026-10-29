import { describe, expect, it, vi } from 'vitest';

import { ApplicationListItem } from '../../apis';
import reducer, {
    clearSelectedApplication,
    setSelectedApplication,
    setSelectedService,
    setServicesList,
    setVendorGid,
} from '../../slices';
import { Service } from '../../types';

vi.mock('@src/services/config', () => ({
    ApiClient: { get: vi.fn(), post: vi.fn() },
}));

const initialState = {
    selectedApplication: null,
    selectedService: null,
    servicesList: [],
    vendorGid: null,
};

const service: Service = {
    id: 10,
    serviceId: 100,
    name: 'Trademark Registration',
    slug: 'trademark-registration',
    accessKey: 'govt_trademark_registration',
    description: 'Register your trademark',
    category: 'Registration',
    tab: 'Mandatory',
    duration: '7 days',
    price: 5000,
    govtFee: 4500,
};

const application: ApplicationListItem = {
    id: 1,
    applicationNumber: 'APP-1',
    service: 'Trademark Registration',
    status: 'DRAFT',
    currentStep: 0,
    adminNotes: null,
    remarks: null,
    approvedDocument: null,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-02',
};

describe('governmentServices slice', () => {
    it('returns the initial state', () => {
        expect(reducer(undefined, { type: '@@INIT' })).toEqual(initialState);
    });

    it('sets and clears the selected application', () => {
        const withApp = reducer(initialState, setSelectedApplication(application));
        expect(withApp.selectedApplication).toEqual(application);

        const cleared = reducer(withApp, clearSelectedApplication());
        expect(cleared.selectedApplication).toBeNull();
    });

    it('sets the selected service without touching other fields', () => {
        const state = reducer({ ...initialState, vendorGid: 'G-1' }, setSelectedService(service));
        expect(state.selectedService).toEqual(service);
        expect(state.vendorGid).toBe('G-1');
    });

    it('replaces the services list', () => {
        const first = reducer(initialState, setServicesList([service]));
        expect(first.servicesList).toEqual([service]);

        const second = reducer(first, setServicesList([]));
        expect(second.servicesList).toEqual([]);
    });

    it('sets and resets the vendor gid', () => {
        const withGid = reducer(initialState, setVendorGid('G-1'));
        expect(withGid.vendorGid).toBe('G-1');

        expect(reducer(withGid, setVendorGid(null)).vendorGid).toBeNull();
    });

    it('exposes action types under the governmentServices namespace', () => {
        expect(setVendorGid('x').type).toBe('governmentServices/setVendorGid');
        expect(clearSelectedApplication().type).toBe('governmentServices/clearSelectedApplication');
    });
});
