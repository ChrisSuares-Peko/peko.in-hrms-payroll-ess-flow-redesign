import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import PunchModal from '../../../components/dashboard/PunchModal';

describe('PunchModal', () => {
    it('renders nothing when closed', () => {
        render(<PunchModal open={false} mode="in" onClose={vi.fn()} onConfirm={vi.fn()} />);

        expect(screen.queryByText('Start Your Shift?')).not.toBeInTheDocument();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders the check-in copy for mode="in"', () => {
        render(<PunchModal open mode="in" onClose={vi.fn()} onConfirm={vi.fn()} />);

        expect(screen.getByText('Start Your Shift?')).toBeInTheDocument();
        expect(
            screen.getByText('Location verified. Confirm your attendance for today?')
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Check In' })).toBeInTheDocument();
    });

    it('renders the check-out copy for mode="out"', () => {
        render(<PunchModal open mode="out" onClose={vi.fn()} onConfirm={vi.fn()} />);

        expect(screen.getByText('End Your Shift?')).toBeInTheDocument();
        expect(
            screen.getByText('This will log your check-out time and close your shift.')
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Check Out' })).toBeInTheDocument();
    });

    it('renders a live clock in HH:MM:SS AM/PM format', () => {
        render(<PunchModal open mode="in" onClose={vi.fn()} onConfirm={vi.fn()} />);

        expect(screen.getByText(/\d{1,2}:\d{2}:\d{2}\s?(AM|PM)/i)).toBeInTheDocument();
    });

    it('calls onClose when Cancel is clicked', () => {
        const onClose = vi.fn();
        render(<PunchModal open mode="in" onClose={onClose} onConfirm={vi.fn()} />);

        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onConfirm when the CTA button is clicked', () => {
        const onConfirm = vi.fn();
        render(<PunchModal open mode="out" onClose={vi.fn()} onConfirm={onConfirm} />);

        fireEvent.click(screen.getByRole('button', { name: 'Check Out' }));

        expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('disables Cancel and shows a loading CTA while loading', () => {
        render(<PunchModal open mode="in" loading onClose={vi.fn()} onConfirm={vi.fn()} />);

        expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
        expect(document.querySelector('.ant-btn-loading')).toBeInTheDocument();
    });
});
