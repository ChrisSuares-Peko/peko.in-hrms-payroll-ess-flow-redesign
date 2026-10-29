import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { paths } from '@src/routes/paths';

import { useOnboardingStatus } from '../../hooks/useOnboardingStatus';
import EmployeeHome from '../../pages/EmployeeHome';

vi.mock('../../hooks/useOnboardingStatus', () => ({
    useOnboardingStatus: vi.fn(),
}));

const mockAuth = vi.fn(() => ({ role: 'user', employeeProfileId: '900', serviceMemberships: null }));
vi.mock('@hooks/store', () => ({
    useAppSelector: (selector: (state: unknown) => unknown) =>
        selector({ reducer: { auth: mockAuth() } }),
    useAppDispatch: () => vi.fn(),
}));

vi.mock('../../pages/Dashboard', () => ({
    default: () => <div data-testid="dashboard-page" />,
}));

const renderWithRouter = () =>
    render(
        <MemoryRouter initialEntries={['/employee']}>
            <Routes>
                <Route path="/employee" element={<EmployeeHome />} />
                <Route path={paths.employee.onboarding} element={<div>Onboarding Page</div>} />
            </Routes>
        </MemoryRouter>
    );

describe('EmployeeHome Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows a spinner while the onboarding status is loading', () => {
        (useOnboardingStatus as Mock).mockReturnValue({ loading: true, isComplete: false });

        const { container } = renderWithRouter();

        expect(container.querySelector('.ant-spin')).toBeInTheDocument();
        expect(screen.queryByTestId('dashboard-page')).not.toBeInTheDocument();
        expect(screen.queryByText('Onboarding Page')).not.toBeInTheDocument();
    });

    it('redirects to the onboarding flow when onboarding is not complete', () => {
        (useOnboardingStatus as Mock).mockReturnValue({ loading: false, isComplete: false });

        renderWithRouter();

        expect(screen.getByText('Onboarding Page')).toBeInTheDocument();
        expect(screen.queryByTestId('dashboard-page')).not.toBeInTheDocument();
    });

    it('renders the Dashboard once onboarding is complete', () => {
        (useOnboardingStatus as Mock).mockReturnValue({ loading: false, isComplete: true });

        renderWithRouter();

        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
        expect(screen.queryByText('Onboarding Page')).not.toBeInTheDocument();
    });
});
