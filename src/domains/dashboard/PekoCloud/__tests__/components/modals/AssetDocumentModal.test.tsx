import React from 'react';

import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import dayjs from 'dayjs';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Import the component and hooks
import AssetDocumentModal from '../../../components/Modals/AssetDocumentModal';
import useAssetDocCreate from '../../../hooks/assetHooks/useCreateAssetDocApi';
import { useUpdateAssetDoc } from '../../../hooks/assetHooks/useUpdateAssetDocApi';

// Mock the dependencies
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));
vi.mock('react-router-dom', async importOriginal => {
    const actual = (await importOriginal()) as typeof import('react-router-dom');
    return {
        ...actual,
        useLocation: () => ({
            state: { assetId: '123' },
        }),
    };
});

vi.mock('../../../hooks/assetHooks/useCreateAssetDocApi', () => ({
    default: vi.fn(() => ({
        handleAssetDocCreation: vi.fn(),
        submitLoading: false,
    })),
}));

vi.mock('../../../hooks/assetHooks/useUpdateAssetDocApi', () => ({
    useUpdateAssetDoc: vi.fn(() => ({
        updateAssetDocs: vi.fn(),
        submitLoading: false,
    })),
}));

describe('AssetDocumentModal', () => {
    const mockHandleCancel = vi.fn();

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('renders correctly in add mode', () => {
        render(<AssetDocumentModal open handleCancel={mockHandleCancel} />, {
            wrapper: MemoryRouter,
        });

        expect(screen.getByText('Add Document')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter document number')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Select issued date')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Select expiry date')).toBeInTheDocument();
    });

    it('renders correctly in edit mode with selectedRecordData', () => {
        render(
            <AssetDocumentModal
                open
                handleCancel={mockHandleCancel}
                selectedRecordData={{
                    documentName: 'Test Doc',
                    documentNumber: '1234',
                    issueDate: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
                    expireDate: dayjs().add(1, 'month').format('YYYY-MM-DD'),
                    document: '',
                    documentBase: '',
                }}
            />,
            { wrapper: MemoryRouter }
        );

        expect(screen.getByText('Edit Document')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test Doc')).toBeInTheDocument();
        expect(screen.getByDisplayValue('1234')).toBeInTheDocument();
    });

    it('calls handleAssetDocCreation on form submit in add mode', async () => {
        const handleAssetDocCreation = vi.fn();
        (useAssetDocCreate as any).mockReturnValue({
            handleAssetDocCreation,
            submitLoading: false,
        });

        render(<AssetDocumentModal open handleCancel={mockHandleCancel} />, {
            wrapper: MemoryRouter,
        });

        fireEvent.change(screen.getByPlaceholderText('Enter name'), {
            target: { value: 'New Document' },
        });
        fireEvent.change(screen.getByPlaceholderText('Enter document number'), {
            target: { value: '5678' },
        });
        const calendarIcon = screen.getAllByRole('img', { name: /calendar/i });
        fireEvent.click(calendarIcon[0]);
        fireEvent.click(screen.getByText('Today'));

        fireEvent.click(screen.getByRole('button', { name: /submit/i }));

        await waitFor(() => expect(handleAssetDocCreation).toHaveBeenCalled());
    });

    it('calls updateAssetDocs on form submit in edit mode', async () => {
        const updateAssetDocs = vi.fn();
        (useUpdateAssetDoc as any).mockReturnValue({
            updateAssetDocs,
            submitLoading: false,
        });

        render(
            <AssetDocumentModal
                open
                handleCancel={mockHandleCancel}
                selectedRecordData={{
                    id: '1',
                    documentName: 'Existing Doc',
                    documentNumber: '1234',
                    issueDate: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
                    expireDate: dayjs().add(1, 'month').format('YYYY-MM-DD'),
                    document: '',
                    documentBase: '',
                }}
            />,
            { wrapper: MemoryRouter }
        );

        fireEvent.change(screen.getByPlaceholderText('Enter name'), {
            target: { value: 'Updated Document' },
        });
        fireEvent.change(screen.getByPlaceholderText('Enter document number'), {
            target: { value: '5678' },
        });
        fireEvent.click(screen.getByText('Submit'));

        await waitFor(() => expect(updateAssetDocs).toHaveBeenCalled());
    });

    it('calls handleCancel when cancel button is clicked', () => {
        render(<AssetDocumentModal open handleCancel={mockHandleCancel} />, {
            wrapper: MemoryRouter,
        });

        fireEvent.click(screen.getByText('Cancel'));
        expect(mockHandleCancel).toHaveBeenCalled();
    });

    it('renders loading state correctly', () => {
        (useAssetDocCreate as any).mockReturnValue({
            handleAssetDocCreation: vi.fn(),
            submitLoading: true,
        });
        (useUpdateAssetDoc as any).mockReturnValue({
            updateAssetDocs: vi.fn(),
            submitLoading: true,
        });

        render(<AssetDocumentModal open handleCancel={mockHandleCancel} />, {
            wrapper: MemoryRouter,
        });

        expect(screen.getByLabelText('loading')).toBeInTheDocument();
    });
});
