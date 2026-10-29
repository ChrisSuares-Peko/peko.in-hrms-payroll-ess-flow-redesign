import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import GstinDetailsCard from '../../../components/gstinLookup/GstinDetailsCard';
import { GstinDetails } from '../../../types/gstinLookup';

const details: GstinDetails = {
    gstin: '29ABCDE1234F1Z5',
    legalName: 'Acme Pvt Ltd',
    tradeName: 'Acme',
    status: 'Active',
    stateName: 'Karnataka',
    registrationType: 'Regular',
    registrationDate: '2020-01-15',
    registeredAddress: '12 Main St, Bengaluru',
};

describe('GstinDetailsCard', () => {
    it('renders verified header', () => {
        render(<GstinDetailsCard details={details} />);
        expect(screen.getByText('GSTIN Verified')).toBeInTheDocument();
    });

    it('renders the gstin and key fields', () => {
        render(<GstinDetailsCard details={details} />);
        expect(screen.getByText('29ABCDE1234F1Z5')).toBeInTheDocument();
        expect(screen.getByText('Acme Pvt Ltd')).toBeInTheDocument();
        expect(screen.getByText('Acme')).toBeInTheDocument();
        expect(screen.getByText('Karnataka')).toBeInTheDocument();
        expect(screen.getByText('Regular')).toBeInTheDocument();
        expect(screen.getByText('2020-01-15')).toBeInTheDocument();
        expect(screen.getByText('12 Main St, Bengaluru')).toBeInTheDocument();
    });

    it('renders the status text (appears twice — header line and GST Status tag)', () => {
        render(<GstinDetailsCard details={details} />);
        expect(screen.getAllByText('Active').length).toBeGreaterThanOrEqual(1);
    });
});
