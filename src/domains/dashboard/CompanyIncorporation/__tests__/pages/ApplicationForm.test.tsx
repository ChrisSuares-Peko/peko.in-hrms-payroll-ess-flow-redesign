import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useIncorporationForm } from '../../hooks/useIncorporationForm';
import ApplicationForm from '../../pages/ApplicationForm';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => vi.fn(),
    useAppSelector: (cb: (s: any) => any) =>
        cb({ reducer: { incorporation: { currentApplication: { entityType: 'private_limited' } } } }),
}));

vi.mock('@src/hooks/useScrollTopOnPageChange', () => ({ default: vi.fn() }));

vi.mock('@routes/paths', () => ({
    paths: {
        companyIncorporation: { index: '/company-incorporation', payment: 'payment' },
        dashboard: { home: '/dashboard' },
    },
}));

vi.mock('../../hooks/useIncorporationForm', () => ({
    useIncorporationForm: vi.fn(),
}));

const mockHook = useIncorporationForm as unknown as ReturnType<typeof vi.fn>;

const baseHook = {
    currentStep: 0,
    handleStepChange: vi.fn(),
    handleSubmit: vi.fn(),
    isLoading: false,
    isHydrating: false,
};

describe('ApplicationForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the first step with its title, indicator and Next action', () => {
        (mockHook as any).mockReturnValue({ ...baseHook, currentStep: 0 });
        render(<ApplicationForm />);

        expect(screen.getByText('Incorporate Your Company')).toBeInTheDocument();
        // Step heading + the BasicDetails step content
        expect(screen.getAllByText('Basic Details').length).toBeGreaterThan(0);
        expect(screen.getByText('Applicant Details')).toBeInTheDocument();
        expect(screen.getByText('Next →')).toBeInTheDocument();
    });

    it('shows the "Pay & Submit" action on the final review step', () => {
        (mockHook as any).mockReturnValue({ ...baseHook, currentStep: 6 });
        render(<ApplicationForm />);
        expect(screen.getByText('Pay & Submit')).toBeInTheDocument();
        expect(screen.queryByText('Next →')).toBeNull();
    });

    it('shows a spinner while hydrating', () => {
        (mockHook as any).mockReturnValue({ ...baseHook, isHydrating: true });
        const { container } = render(<ApplicationForm />);
        expect(container.querySelector('.ant-spin')).toBeTruthy();
    });
});
