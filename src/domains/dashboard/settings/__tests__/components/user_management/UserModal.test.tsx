import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';

import UserModal from '../../../components/user_management/UserModal';
import useCrud from '../../../hooks/user_management/useCrud';

// Mock the `useCrud` hook
vi.mock('../../../hooks/user_management/useCrud', () => ({
    __esModule: true,
    default: vi.fn().mockReturnValue({
        validateBeforeCreateSubUser: vi.fn(),
        createSubUser: vi.fn(),
        corporateServices: [
            { label: 'Service1', display: 'Service1' },
            { label: 'Service2', display: 'Service2' },
        ],
        isInitialSubmit: true,
        isLoading: false,
        setIsInitialSubmit: vi.fn(),
    }),
}));

describe('UserModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderComponent = (open = true) =>
        render(<UserModal open={open} handleCancel={vi.fn()} reloadTable={vi.fn()} />);

    it('should render initial fields when isInitialSubmit is true', async () => {
        renderComponent();

        await waitFor(() => {
            expect(screen.getByPlaceholderText('Enter employee name')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Enter mobile number')).toBeInTheDocument();
        });
    });

    // Role here is the person's job title. Corporate-cards authority is held on the employee row and set
    // from the cards People screen, so this field offers no fixed Admin/Employee choice.
    it('offers Role as a free-text job title', async () => {
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Role')).toBeInTheDocument();
        });
        expect(screen.getByPlaceholderText('Enter employee role')).toBeInTheDocument();
    });

    it('should render service selection checkboxes when isInitialSubmit is false', async () => {
        (useCrud as Mock).mockImplementationOnce(({ handleCancel, reloadTable, selectedRow }) => ({
            validateBeforeCreateSubUser: vi.fn(),
            createSubUser: vi.fn(),
            corporateServices: [
            { label: 'Service1', display: 'Service1' },
            { label: 'Service2', display: 'Service2' },
        ],
            isInitialSubmit: false,
            isLoading: false,
            setIsInitialSubmit: vi.fn(),
            initialValues: {}, // Provide initialValues if needed
        }));

        renderComponent();

        // await waitFor(() => {
        expect(screen.getByText('Select Services')).toBeInTheDocument();
        expect(screen.getByText('Enable All Services')).toBeInTheDocument();
        expect(screen.getByText('Service1')).toBeInTheDocument();
        expect(screen.getByText('Service2')).toBeInTheDocument();
        // });
    });

    it('should handle form submission correctly', async () => {
        // Mock implementation with dummy arguments
        const mockValidateBeforeCreateSubUser = vi.fn();
        (useCrud as Mock).mockImplementationOnce(({ handleCancel, reloadTable, selectedRow }) => ({
            validateBeforeCreateSubUser: mockValidateBeforeCreateSubUser,
            createSubUser: vi.fn(),
            corporateServices: [
            { label: 'Service1', display: 'Service1' },
            { label: 'Service2', display: 'Service2' },
        ],
            isInitialSubmit: true,
            isLoading: false,
            setIsInitialSubmit: vi.fn(),
            initialValues: {},
        }));

        renderComponent();

        fireEvent.change(screen.getByPlaceholderText('Enter employee name'), {
            target: { value: 'John Doe' },
        });
        fireEvent.change(screen.getByPlaceholderText('Enter employee role'), {
            target: { value: 'Accountant' },
        });
        fireEvent.change(screen.getByPlaceholderText('Enter mobile number'), {
            target: { value: '5555555555' },
        });

        await waitFor(() => screen.getByPlaceholderText('Enter email ID'));
        fireEvent.change(screen.getByPlaceholderText('Enter email ID'), {
            target: { value: 'john@example.com' },
        });
        fireEvent.change(screen.getByPlaceholderText('Confirm your email ID'), {
            target: { value: 'john@example.com' },
        });

        fireEvent.click(screen.getByText('Next'));

        await waitFor(() => {
            expect(mockValidateBeforeCreateSubUser).toHaveBeenCalled();
        });
    });

    it('should trigger the handleCancel function on cancel button click', async () => {
        const mockHandleCancel = vi.fn();
        render(<UserModal open handleCancel={mockHandleCancel} reloadTable={vi.fn()} />);

        fireEvent.click(screen.getByText('Cancel'));

        await waitFor(() => {
            expect(mockHandleCancel).toHaveBeenCalled();
        });
    });
});
