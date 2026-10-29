import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import CustomerSelectionCard from '../../../components/createAgreement/CustomerSelectionCard';

describe('CustomerSelectionCard', () => {
    const customer: any = {
        id: 'c-1',
        name: 'Acme Corp',
        initials: 'AC',
        status: 'Active',
        contactPerson: 'John Doe',
        email: 'john@acme.com',
        phone: '9999999999',
        address: 'Line 1\nKochi\nKerala',
    };

    it('renders all customer fields and status badge', () => {
        render(<CustomerSelectionCard customer={customer} />);

        expect(screen.getByText('AC')).toBeInTheDocument();
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
        expect(screen.getByText('Active customer')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john@acme.com')).toBeInTheDocument();
        expect(screen.getByText('9999999999')).toBeInTheDocument();
        expect(screen.getByText(/Line 1/)).toBeInTheDocument();
    });
});
