import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import VirtualAccountModal from '../../../components/invoiceDetails/VirtualAccountModal';

vi.mock('react-svg', () => ({
    ReactSVG: () => <span data-testid="rsvg" />,
}));

describe('VirtualAccountModal', () => {
    it('renders header and bank account information when open', () => {
        render(<VirtualAccountModal open onCancel={vi.fn()} />);
        expect(screen.getByText('Virtual Account Details')).toBeInTheDocument();
        expect(screen.getByText('Bank Account Information')).toBeInTheDocument();
    });

    it('fires onCancel when Cancel clicked', () => {
        const onCancel = vi.fn();
        render(<VirtualAccountModal open onCancel={onCancel} />);
        fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
        expect(onCancel).toHaveBeenCalled();
    });

    it('fires onShare when Share is clicked, falls back to onCancel', () => {
        const onShare = vi.fn();
        const onCancel = vi.fn();
        render(<VirtualAccountModal open onCancel={onCancel} onShare={onShare} />);
        fireEvent.click(screen.getByRole('button', { name: /Share with Customer/i }));
        expect(onShare).toHaveBeenCalled();
        expect(onCancel).not.toHaveBeenCalled();
    });
});
