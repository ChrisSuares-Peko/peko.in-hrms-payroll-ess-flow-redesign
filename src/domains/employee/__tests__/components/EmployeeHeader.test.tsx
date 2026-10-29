import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import { paths } from '@routes/paths';
import { useAppSelector } from '@src/hooks/store';
import { handleLogout } from '@src/services/handleLogout';

import EmployeeHeader from '../../components/EmployeeHeader';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual, useNavigate: vi.fn() };
});

vi.mock('@src/services/handleLogout', () => ({
    handleLogout: vi.fn(),
}));

describe('EmployeeHeader', () => {
    const mockNavigate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useNavigate as unknown as Mock).mockReturnValue(mockNavigate);
        (useAppSelector as unknown as Mock).mockImplementation((selectorFn: any) =>
            selectorFn({ reducer: { auth: { username: 'akshay' } } })
        );
        (handleLogout as unknown as Mock).mockResolvedValue(undefined);
    });

    it('renders the display name and role from the store', () => {
        render(<EmployeeHeader />);

        expect(screen.getByText('akshay')).toBeInTheDocument();
        expect(screen.getByText('Employee')).toBeInTheDocument();
        expect(screen.getByText('A')).toBeInTheDocument();
    });

    it('falls back to "Employee" (with an "E" avatar initial) when there is no username', () => {
        (useAppSelector as unknown as Mock).mockImplementation((selectorFn: any) =>
            selectorFn({ reducer: { auth: { username: '' } } })
        );

        render(<EmployeeHeader />);

        // displayName defaults to 'Employee' before the icon-fallback check runs, so the
        // avatar always renders an initial (never the UserOutlined icon) in current behavior.
        expect(screen.getAllByText('Employee')).toHaveLength(2);
        expect(screen.getByText('E')).toBeInTheDocument();
    });

    it('navigates to the profile page when the avatar row is clicked', () => {
        render(<EmployeeHeader />);

        fireEvent.click(screen.getByText('akshay'));

        expect(mockNavigate).toHaveBeenCalledWith(paths.employee.profile);
    });

    it('calls handleLogout when the logout icon is clicked', async () => {
        const { container } = render(<EmployeeHeader />);

        const logoutImg = container.querySelector('img');
        expect(logoutImg).not.toBeNull();

        fireEvent.click(logoutImg as Element);

        await waitFor(() => expect(handleLogout).toHaveBeenCalledTimes(1));
    });

    it('guards against a double click while logout is in-flight', async () => {
        let resolveLogout: () => void = () => {};
        (handleLogout as unknown as Mock).mockReturnValue(
            new Promise<void>(resolve => {
                resolveLogout = resolve;
            })
        );

        const { container } = render(<EmployeeHeader />);
        const logoutImg = container.querySelector('img') as Element;

        fireEvent.click(logoutImg);
        fireEvent.click(logoutImg);

        expect(handleLogout).toHaveBeenCalledTimes(1);

        resolveLogout();
        await waitFor(() => {});
    });
});
