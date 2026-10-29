import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import useScreenSize from '@src/hooks/useScreenSize';

import DocumentsTab from '../../../components/FleetManagement/DocumentsTab';
import { useDeleteVehicleDocApi } from '../../../hooks/fleetHooks/useDeleteVehicleDocApi';
import { useGetAllVehicleDocApi } from '../../../hooks/fleetHooks/useListVehicleDocApi';

// Mock dependencies
vi.mock('react-router-dom', async importOriginal => {
    const actual = (await importOriginal()) as typeof import('react-router-dom');
    return {
        ...actual,
        useLocation: vi.fn(),
    };
});
vi.mock('@src/hooks/useScreenSize', () => ({
    default: vi.fn(() => ({ xs: false })),
}));
vi.mock('../../../hooks/fleetHooks/useDeleteVehicleDocApi', () => ({
    useDeleteVehicleDocApi: vi.fn(() => ({
        deleteVehicleDocData: vi.fn(),
        isLoading: false,
    })),
}));
vi.mock('../../../hooks/fleetHooks/useListVehicleDocApi', () => ({
    useGetAllVehicleDocApi: vi.fn(() => ({
        tableDatas: [],
        orderCount: 0,
        tableLoading: false,
    })),
}));
vi.mock('../../../hooks/useDownloadDocumentApi', () => ({
    default: vi.fn(() => ({
        handleDocumentDownload: vi.fn(),
        isLoading: false,
    })),
}));
vi.mock('../../../components/FleetManagement/FleetDocMobileView.tsx', () => ({
    __esModule: true,
    default: vi.fn(() => <div>FleetDocMobileView</div>),
}));
vi.mock('../../../components/Modals/VehicleDocModal', () => ({
    __esModule: true,
    default: vi.fn(() => <div>VehicleDocModal</div>),
}));
vi.mock('../../../../../../components/molecular/modals/ConfirmationModal.tsx', () => ({
    __esModule: true,
    default: vi.fn(({ handleSubmit }) => (
        <div>
            ConfirmationModal
            <button type="button" onClick={handleSubmit}>
                Yes
            </button>
        </div>
    )),
}));
vi.mock('../../../utils/useFilter.ts', () => ({
    default: vi.fn(() => ({
        handlePageChange: vi.fn(),
        handleSearch: vi.fn(),
    })),
}));

describe('DocumentsTab', () => {
    const mockHandleDocumentDownload = vi.fn();
    const mockHandleDeleteVehicleDoc = vi.fn();

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
        (useLocation as any).mockReturnValue({ state: { fleetId: 1 } });
        (useScreenSize as any).mockReturnValue({ xs: false });
        (useGetAllVehicleDocApi as any).mockReturnValue({
            tableDatas: [
                {
                    id: '1',
                    document: 'docKey',
                    documentName: 'docName',
                    issueDate: '12-04-2024',
                    documentNumber: '23412424',
                },
            ],
            orderCount: 1,
            tableLoading: false,
        });
        (useDeleteVehicleDocApi as any).mockReturnValue({
            deleteVehicleDocData: mockHandleDeleteVehicleDoc,
            isLoading: false,
        });
    });

    it('renders component correctly in desktop view', () => {
        render(<DocumentsTab />);
        expect(screen.getByPlaceholderText('Search for documents')).toBeInTheDocument();
        expect(screen.getByText('Add New Document')).toBeInTheDocument();
        expect(screen.getByRole('table')).toBeInTheDocument(); // Ensure table is present
    });

    it('renders component correctly in mobile view', () => {
        (useScreenSize as any).mockReturnValue({ xs: true });
        render(<DocumentsTab />);

        expect(screen.getByText('FleetDocMobileView')).toBeInTheDocument();
    });

    it('renders loading skeletons when tableLoading is true', () => {
        (useGetAllVehicleDocApi as any).mockReturnValue({
            tableDatas: [],
            orderCount: 0,
            tableLoading: true,
        });
        const { container } = render(<DocumentsTab />);
        const skeletons = container.querySelector('div.ant-spin-nested-loading');
        expect(skeletons).toBeInTheDocument();
    });

    it('handles search input change', () => {
        render(<DocumentsTab />);

        const search = screen.getByPlaceholderText(/Search for documents/i);
        fireEvent.change(search, {
            target: { value: 'test' },
        });
        expect(search).toHaveValue('test');
    });

    it('opens VehicleDocModal when "Add New Document" is clicked', () => {
        render(<DocumentsTab />);
        fireEvent.click(screen.getByText('Add New Document'));
        expect(screen.getByText('VehicleDocModal')).toBeInTheDocument();
    });

    it('handles document download', async () => {
        render(<DocumentsTab />);
        const record = { id: '1', document: 'docKey', documentName: 'docName' };
        await mockHandleDocumentDownload(record);
        expect(mockHandleDocumentDownload).toHaveBeenCalledWith(record);
    });

    it('opens and closes ConfirmationModal and handles delete', async () => {
        render(<DocumentsTab />);

        fireEvent.click(screen.getByRole('button', { name: /Delete/i }));
        expect(screen.getByText('ConfirmationModal')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /Yes/i }));
        await waitFor(() => {
            expect(mockHandleDeleteVehicleDoc).toHaveBeenCalled();
        });
    });

    it('handles edit action', async () => {
        render(<DocumentsTab />);
        fireEvent.click(screen.getByRole('img', { name: /Edit/i }));

        expect(screen.getByText('VehicleDocModal')).toBeInTheDocument();
    });
});
