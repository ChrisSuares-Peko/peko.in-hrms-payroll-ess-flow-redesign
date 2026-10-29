import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest';

import ApprovalGateBanner, {
    GATE_BANNER_DESCRIPTION,
    GATE_BANNER_MESSAGE,
} from '../components/approvals/ApprovalGateBanner';
import { useApprovalGate } from '../context/ApprovalGateContext';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('../context/ApprovalGateContext', () => ({ useApprovalGate: vi.fn() }));

const gate = (enabled: boolean) => ({
    enabled,
    reason: null,
    setById: null,
    setByName: null,
    setAt: null,
});

const renderAt = (path: string) =>
    render(
        <MemoryRouter initialEntries={[path]}>
            <ApprovalGateBanner />
        </MemoryRouter>
    );

describe('ApprovalGateBanner', () => {
    beforeEach(() => vi.clearAllMocks());

    it('shows nothing while loading or while the gate is on', () => {
        (useApprovalGate as Mock).mockReturnValue({ gate: null, isLoading: true });
        renderAt('/system-user/accounting/vendors');
        expect(screen.queryByText(GATE_BANNER_MESSAGE)).not.toBeInTheDocument();

        (useApprovalGate as Mock).mockReturnValue({ gate: gate(true), isLoading: false });
        renderAt('/system-user/accounting/vendors');
        expect(screen.queryByText(GATE_BANNER_MESSAGE)).not.toBeInTheDocument();
    });

    it('warns in red on every page while the gate is off, dashboard included, and opens Approvals', () => {
        (useApprovalGate as Mock).mockReturnValue({ gate: gate(false), isLoading: false });

        renderAt('/system-user/accounting');

        expect(screen.getByText(GATE_BANNER_MESSAGE)).toBeInTheDocument();
        expect(screen.getByText(GATE_BANNER_DESCRIPTION)).toBeInTheDocument();
        expect(document.querySelector('.ant-alert-error')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Open Approvals', { selector: 'span' }));
        expect(navigateMock).toHaveBeenCalledWith('/system-user/accounting/approvals');
    });

    it('drops the button on the Approvals page, where the switch sits', () => {
        (useApprovalGate as Mock).mockReturnValue({ gate: gate(false), isLoading: false });

        renderAt('/system-user/accounting/approvals?partner=12');

        expect(screen.getByText(GATE_BANNER_MESSAGE)).toBeInTheDocument();
        expect(screen.queryByText('Open Approvals')).not.toBeInTheDocument();
    });
});
