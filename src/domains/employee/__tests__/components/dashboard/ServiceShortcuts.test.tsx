import { fireEvent, render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { paths } from '@src/routes/paths';

import ServiceShortcuts from '../../../components/dashboard/ServiceShortcuts';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('react-svg', () => ({
    ReactSVG: ({ src }: any) => <span data-testid="svg-icon" data-src={src} />,
}));

const renderShortcuts = () =>
    render(
        <BrowserRouter>
            <ServiceShortcuts />
        </BrowserRouter>
    );

describe('ServiceShortcuts', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders all six shortcut cards', () => {
        renderShortcuts();

        expect(screen.getByText('Attendance')).toBeInTheDocument();
        expect(screen.getByText('My Pay')).toBeInTheDocument();
        expect(screen.getByText('Leave')).toBeInTheDocument();
        expect(screen.getByText('Reimbursement')).toBeInTheDocument();
        expect(screen.getByText('Documents')).toBeInTheDocument();
        expect(screen.getByText('My Profile')).toBeInTheDocument();
    });

    it.each([
        ['Attendance', paths.employee.attendance],
        ['My Pay', paths.employee.payslips],
        ['Leave', paths.employee.leaves],
        ['Reimbursement', paths.employee.reimbursements],
        ['Documents', paths.employee.documents],
        ['My Profile', paths.employee.profile],
    ])('navigates to the correct path when "%s" is clicked', (title, path) => {
        renderShortcuts();

        fireEvent.click(screen.getByText(title));

        expect(mockNavigate).toHaveBeenCalledWith(path);
    });
});
