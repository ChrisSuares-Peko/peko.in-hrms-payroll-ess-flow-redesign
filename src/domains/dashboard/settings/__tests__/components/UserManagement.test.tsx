import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, vi, beforeEach, afterEach, expect, Mock } from 'vitest';

import UserManagement from '../../components/UserManagement';
import useCrud from '../../hooks/user_management/useCrud';
import useFilter from '../../hooks/user_management/useFilter';
import useGetAllSubCorporate from '../../hooks/user_management/useGetAllSubCorporate';

// Mock hooks and components
vi.mock('../../hooks/user_management/useGetAllSubCorporate', () => ({
    __esModule: true,
    default: vi.fn(),
}));

vi.mock('../../hooks/user_management/useCrud', () => ({
    __esModule: true,
    default: vi.fn(),
}));

vi.mock('../../hooks/user_management/useFilter', () => ({
    __esModule: true,
    default: vi.fn(() => ({
        handlePageChange: vi.fn(),
        handleSearch: vi.fn(),
        reloadTable: vi.fn(),
    })),
}));

interface SelectServiceModalProps {
    open: boolean;
    handleCancel: () => void;
}

interface ConfirmationModalProps {
    isOpen: boolean;
    handleSubmit: () => void;
    handleCancel: () => void;
    title: string;
}

interface DrawerModalProps {
    open: boolean;
    handleCancel: () => void;
    modalTitle: string;
}

vi.mock('../../components/user_management/SelectServiceModal', () => ({
    __esModule: true,
    default: ({ open, handleCancel }: SelectServiceModalProps) =>
        open ? (
            <div>
                <div>Select Service Modal</div>
                <button type="button" onClick={handleCancel}>
                    Close
                </button>
            </div>
        ) : null,
}));

vi.mock('../../../../../../components/molecular/modals/ConfirmationModal.tsx', () => ({
    __esModule: true,
    default: ({ isOpen, handleSubmit, handleCancel, title }: ConfirmationModalProps) =>
        isOpen ? (
            <div>
                {title}
                <button type="button" onClick={handleSubmit}>
                    Yes
                </button>
                <button type="button" onClick={handleCancel}>
                    No
                </button>
            </div>
        ) : null,
}));

vi.mock('@components/atomic/DrawerModal', () => ({
    __esModule: true,
    default: ({ open, handleCancel, modalTitle }: DrawerModalProps) =>
        open ? (
            <div>
                <div>{modalTitle}</div>
                <button type="button" onClick={handleCancel}>
                    Close
                </button>
            </div>
        ) : null,
}));

// Cleanup after each test
afterEach(() => {
    vi.clearAllMocks();
    cleanup();
});
describe('UserManagement Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render UserManagement component and display table data', () => {
        (useGetAllSubCorporate as unknown as Mock).mockReturnValue({
            data: [
                {
                    id: '1',
                    name: 'SubCorporate 1',
                    services: [],
                    credential: { username: 'testuser' },
                },
            ],
            isLoading: false,
            count: 1,
        });

        (useCrud as unknown as Mock).mockReturnValue({
            deleteSubUser: vi.fn(),
            blockSubUser: vi.fn(),
            resendInvite: vi.fn(),
            isLoading: false,
        });

        (useFilter as unknown as Mock).mockReturnValue({
            handlePageChange: vi.fn(),
            handleSearch: vi.fn(),
            reloadTable: vi.fn(),
        });

        render(<UserManagement />);

        expect(screen.getByText('SubCorporate 1')).toBeInTheDocument();
        expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should handle pagination correctly', async () => {
        const handlePageChange = vi.fn();

        (useGetAllSubCorporate as unknown as Mock).mockReturnValue({
            data: [
                {
                    id: '1',
                    name: 'SubCorporate 1',
                    services: [],
                    credential: { username: 'testuser' },
                },
            ],
            isLoading: false,
            count: 20,
        });

        (useFilter as unknown as Mock).mockReturnValue({
            handlePageChange,
            handleSearch: vi.fn(),
            reloadTable: vi.fn(),
        });

        render(<UserManagement />);

        fireEvent.click(screen.getByText('2'));

        await waitFor(() => {
            expect(handlePageChange).toHaveBeenCalled();
        });
    });

    it('should open and close SelectServiceModal when editing a user', async () => {
        (useGetAllSubCorporate as unknown as Mock).mockReturnValue({
            data: [
                {
                    id: 1,
                    name: 'John Doe',
                    email: 'john.doe@example.com',
                    role: 'Admin',
                    mobileNo: '1234567890',
                    services: [{ label: 'Service 1' }],
                    status: 'ACTIVE',
                    credential: { username: 'john_doe' },
                },
            ],
            isLoading: false,
            count: 1,
        });

        (useFilter as unknown as Mock).mockReturnValue({
            handlePageChange: vi.fn(),
            handleSearch: vi.fn(),
            reloadTable: vi.fn(),
        });

        render(<UserManagement />);

        const dropdownTrigger = screen.getByRole('button', { name: '' });
        fireEvent.click(dropdownTrigger);
        fireEvent.click(screen.getByRole('button', { name: /Edit Access/i }));

        const closeButton = screen.getByText('Close');
        fireEvent.click(closeButton);

        await waitFor(() => {
            expect(screen.queryByText('Select Service Modal')).not.toBeInTheDocument();
        });
    });

    it('should open and close ConfirmationModal when confirming an action', async () => {
        (useGetAllSubCorporate as unknown as Mock).mockReturnValue({
            data: [
                {
                    id: '1',
                    name: 'SubCorporate 1',
                    services: [],
                    credential: { username: 'testuser' },
                },
            ],
            isLoading: false,
            count: 1,
        });

        (useCrud as unknown as Mock).mockReturnValue({
            deleteSubUser: vi.fn(),
            blockSubUser: vi.fn(),
            resendInvite: vi.fn(),
            isLoading: false,
        });

        render(<UserManagement />);

        const element = screen.getByTestId('trash-bin');

        fireEvent.click(element);

        expect(screen.getByText('Are you sure you want to delete this user?')).toBeInTheDocument();

        const yesButton = screen.getByText('Yes');
        fireEvent.click(yesButton);
    });

    it('should open and close DrawerModal when viewing services', async () => {
        (useGetAllSubCorporate as unknown as Mock).mockReturnValue({
            data: [
                {
                    id: '1',
                    name: 'SubCorporate 1',
                    services: [{ label: 'Service 1' }, { label: 'Service 2' }],
                    credential: { username: 'testuser' },
                },
            ],
            isLoading: false,
            count: 1,
        });

        (useFilter as unknown as Mock).mockReturnValue({
            handlePageChange: vi.fn(),
            handleSearch: vi.fn(),
            reloadTable: vi.fn(),
        });

        render(<UserManagement />);
        const viewServicesButton = screen.getByText(2);
        fireEvent.click(viewServicesButton);
        screen.debug(undefined, 100000);

        await waitFor(() => {
            expect(screen.getByText('List of service')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /close/i }));
    });
});
