import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import SessionManagementCard from '../../../components/eInvoice/SessionManagementCard';
import { SessionInfo } from '../../../types/eInvoice';

const activeSession: SessionInfo = {
    isActive: true,
    timeLeft: '3h 12m left',
    progressPercent: 60,
    gstin: '29ABCDE1234F1Z5',
    clientId: 'client-1',
    expiresAt: '04:30 PM',
};

describe('SessionManagementCard', () => {
    it('renders gstin, client id, expiry and time left for active session', () => {
        render(<SessionManagementCard session={activeSession} />);
        expect(screen.getByText('Session Active')).toBeInTheDocument();
        expect(screen.getByText('3h 12m left')).toBeInTheDocument();
        expect(screen.getByText('29ABCDE1234F1Z5')).toBeInTheDocument();
        expect(screen.getByText('client-1')).toBeInTheDocument();
        expect(screen.getByText('04:30 PM')).toBeInTheDocument();
    });

    it('shows Session Inactive when session is not active', () => {
        render(<SessionManagementCard session={{ ...activeSession, isActive: false }} />);
        expect(screen.getByText('Session Inactive')).toBeInTheDocument();
    });

    it('renders the progress bar with the provided percent width', () => {
        const { container } = render(<SessionManagementCard session={activeSession} />);
        const bar = container.querySelector('[style*="width"]') as HTMLElement;
        expect(bar).not.toBeNull();
        expect(bar.style.width).toBe('60%');
    });

    it('fires onLogout when Logout is clicked', () => {
        const onLogout = vi.fn();
        render(<SessionManagementCard session={activeSession} onLogout={onLogout} />);
        fireEvent.click(screen.getByRole('button', { name: /Logout/i }));
        expect(onLogout).toHaveBeenCalled();
    });
});
