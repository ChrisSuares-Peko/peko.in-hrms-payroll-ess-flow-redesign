import React from 'react';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, vi, beforeEach, expect, Mock } from 'vitest';

import SelectServiceModal from '../../../components/user_management/SelectServiceModal';
import useCrud from '../../../hooks/user_management/useCrud';

// Mock the useCrud hook
vi.mock('../../../hooks/user_management/useCrud', () => ({
    __esModule: true,
    default: vi.fn(),
}));

interface CheckboxInputProps {
    name: string;
    checked: boolean;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
    children: React.ReactNode;
}

interface CustomModalWithFormProps {
    modalTitle: string;
    open: boolean;
    handleCancel: () => void;
    initialValues: any; // Replace `any` with a more specific type if known
    handleFormSubmit: (values: any) => void; // Replace `any` with a more specific type if known
    isLoading: boolean;
    children: (props: {
        values: any;
        setFieldValue: (field: string, value: any) => void;
    }) => React.ReactNode; // Replace `any` with specific types if known
}
// Mock inner components
vi.mock('@components/atomic/inputs/CheckboxInput', () => ({
    __esModule: true,
    default: ({ name, checked, onChange, children }: CheckboxInputProps) => (
        <div>
            <input
                type="checkbox"
                id={`checkbox-${name}`}
                name={name}
                checked={checked}
                onChange={onChange}
            />
            <label htmlFor={`checkbox-${name}`}>{children}</label>
        </div>
    ),
}));

vi.mock('@components/molecular/modals/CustomModalWithForm', () => ({
    __esModule: true,
    default: ({
        modalTitle,
        open,
        handleCancel,
        initialValues,
        handleFormSubmit,
        isLoading,
        children,
    }: CustomModalWithFormProps) =>
        open ? (
            <div>
                <h1>{modalTitle}</h1>
                <form
                    onSubmit={e => {
                        e.preventDefault();
                        handleFormSubmit(initialValues);
                    }}
                >
                    {children({ values: initialValues, setFieldValue: () => {} })}
                    <button type="submit" disabled={isLoading}>
                        Submit
                    </button>
                    <button type="button" onClick={handleCancel}>
                        Close
                    </button>
                </form>
            </div>
        ) : null,
}));

describe('SelectServiceModal Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render the SelectServiceModal and display checkboxes', () => {
        const mockUpdateServiceAccess = vi.fn();
        const mockReloadTable = vi.fn();

        (useCrud as unknown as Mock).mockReturnValue({
            isLoading: false,
            updateServiceAccess: mockUpdateServiceAccess,
            initialValues: { 'Service 1': false, 'Service 2': true },
            corporateServices: [
                { label: 'Service 1', display: 'Service 1' },
                { label: 'Service 2', display: 'Service 2' },
            ],
        });

        render(
            <SelectServiceModal
                open
                handleCancel={() => {}}
                selectedRow={{
                    id: 1,
                    name: 'SubCorporate 1',
                    email: 'test@example.com',
                    mobileNo: '1234567890',
                    role: 'admin',
                    services: [
                        { label: 'Service 1', hasAccess: false },
                        { label: 'Service 2', hasAccess: true },
                    ],
                    corporateCredentialID: 'corp123',
                    status: 'ACTIVE',
                    isDeleted: 0,
                    createdAt: '2024-08-01T00:00:00Z',
                    updatedAt: '2024-08-02T00:00:00Z',
                    credentialId: 101,
                    corporateUserId: 202,
                }}
                reloadTable={mockReloadTable}
            />
        );
        screen.debug(undefined, 100000);
        expect(screen.getByText('Select Services')).toBeInTheDocument();
        expect(screen.getByText('Service 1')).toBeInTheDocument();
        expect(screen.getByText('Service 2')).toBeInTheDocument();
    });

    it('should call updateServiceAccess on form submission', async () => {
        const mockUpdateServiceAccess = vi.fn();
        const mockReloadTable = vi.fn();

        (useCrud as unknown as Mock).mockReturnValue({
            isLoading: false,
            updateServiceAccess: mockUpdateServiceAccess,
            initialValues: { 'Service 1': false, 'Service 2': true },
            corporateServices: [
                { label: 'Service 1', display: 'Service 1' },
                { label: 'Service 2', display: 'Service 2' },
            ],
        });

        render(
            <SelectServiceModal
                open
                handleCancel={() => {}}
                selectedRow={{
                    id: 1,
                    name: 'SubCorporate 1',
                    email: 'test@example.com',
                    mobileNo: '1234567890',
                    role: 'admin',
                    services: [
                        { label: 'Service 1', hasAccess: false },
                        { label: 'Service 2', hasAccess: true },
                    ],
                    corporateCredentialID: 'corp123',
                    status: 'ACTIVE',
                    isDeleted: 0,
                    createdAt: '2024-08-01T00:00:00Z',
                    updatedAt: '2024-08-02T00:00:00Z',
                    credentialId: 101,
                    corporateUserId: 202,
                }}
                reloadTable={mockReloadTable}
            />
        );

        fireEvent.click(screen.getByText('Submit'));

        await waitFor(() => {
            expect(mockUpdateServiceAccess).toHaveBeenCalled();
        });
    });

    it('should call handleCancel when Close button is clicked', () => {
        const mockHandleCancel = vi.fn();
        const mockReloadTable = vi.fn();

        (useCrud as unknown as Mock).mockReturnValue({
            isLoading: false,
            updateServiceAccess: vi.fn(),
            initialValues: { 'Service 1': false, 'Service 2': true },
            corporateServices: [
                { label: 'Service 1', display: 'Service 1' },
                { label: 'Service 2', display: 'Service 2' },
            ],
        });

        render(
            <SelectServiceModal
                open
                handleCancel={mockHandleCancel}
                selectedRow={{
                    id: 1,
                    name: 'SubCorporate 1',
                    email: 'test@example.com',
                    mobileNo: '1234567890',
                    role: 'admin',
                    services: [
                        { label: 'Service 1', hasAccess: false },
                        { label: 'Service 2', hasAccess: true },
                    ],
                    corporateCredentialID: 'corp123',
                    status: 'ACTIVE',
                    isDeleted: 0,
                    createdAt: '2024-08-01T00:00:00Z',
                    updatedAt: '2024-08-02T00:00:00Z',
                    credentialId: 101,
                    corporateUserId: 202,
                }}
                reloadTable={mockReloadTable}
            />
        );

        fireEvent.click(screen.getByText('Close'));

        expect(mockHandleCancel).toHaveBeenCalled();
    });

    it('should display loading state correctly', () => {
        const mockUpdateServiceAccess = vi.fn();
        const mockReloadTable = vi.fn();

        (useCrud as unknown as Mock).mockReturnValue({
            isLoading: true,
            updateServiceAccess: mockUpdateServiceAccess,
            initialValues: { 'Service 1': false, 'Service 2': true },
            corporateServices: [
                { label: 'Service 1', display: 'Service 1' },
                { label: 'Service 2', display: 'Service 2' },
            ],
        });

        render(
            <SelectServiceModal
                open
                handleCancel={() => {}}
                selectedRow={{
                    id: 1,
                    name: 'SubCorporate 1',
                    email: 'test@example.com',
                    mobileNo: '1234567890',
                    role: 'admin',
                    services: [
                        { label: 'Service 1', hasAccess: false },
                        { label: 'Service 2', hasAccess: true },
                    ],
                    corporateCredentialID: 'corp123',
                    status: 'ACTIVE',
                    isDeleted: 0,
                    createdAt: '2024-08-01T00:00:00Z',
                    updatedAt: '2024-08-02T00:00:00Z',
                    credentialId: 101,
                    corporateUserId: 202,
                }}
                reloadTable={mockReloadTable}
            />
        );

        expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
    });
});
