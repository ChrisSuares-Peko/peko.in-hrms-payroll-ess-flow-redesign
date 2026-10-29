import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import TransportDetailsCard from '../../../components/eWaybill/TransportDetailsCard';

vi.mock('../../../forms/EWaybillForm', () => ({
    default: () => <div data-testid="ewb-form" />,
}));

vi.mock('react-svg', () => ({
    ReactSVG: ({ src }: any) => <img alt="" src={src} />,
}));

describe('TransportDetailsCard', () => {
    it('renders Transport Details title, form, rules card and action buttons', () => {
        render(<TransportDetailsCard onCancel={vi.fn()} onSubmit={vi.fn()} />);
        expect(screen.getByText('Transport Details')).toBeInTheDocument();
        expect(screen.getByTestId('ewb-form')).toBeInTheDocument();
        expect(screen.getByText('E-Waybill Rules:')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Generate E-Waybill/i })).toBeInTheDocument();
    });

    it('fires onCancel when Cancel is clicked', () => {
        const onCancel = vi.fn();
        render(<TransportDetailsCard onCancel={onCancel} onSubmit={vi.fn()} />);
        fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
        expect(onCancel).toHaveBeenCalled();
    });

    it('disables the generate button when submitDisabled is true', () => {
        render(<TransportDetailsCard onCancel={vi.fn()} onSubmit={vi.fn()} submitDisabled />);
        expect(screen.getByRole('button', { name: /Generate E-Waybill/i })).toBeDisabled();
    });
});
