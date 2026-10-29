import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import ReceiptRow from '../../../components/shared/ReceiptRow';

describe('ReceiptRow', () => {
    it('renders label and value', () => {
        render(<ReceiptRow label="Email" value="a@b.com" />);

        expect(screen.getByText('Email')).toBeInTheDocument();
        expect(screen.getByText('a@b.com')).toBeInTheDocument();
    });

    it('applies bold class on label when bold is true', () => {
        render(<ReceiptRow label="Total" value="1000" bold />);

        const label = screen.getByText('Total');
        expect(label.className).toContain('font-bold');
    });

    it('applies custom valueColor and valueClassName', () => {
        render(
            <ReceiptRow
                label="Status"
                value="Paid"
                valueColor="text-green-700"
                valueClassName="extra-class"
            />
        );

        const value = screen.getByText('Paid');
        expect(value.className).toContain('text-green-700');
        expect(value.className).toContain('extra-class');
    });
});
