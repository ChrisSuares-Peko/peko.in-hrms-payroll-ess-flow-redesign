import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import OwnersDetails from '../../../components/OwnershipDoc/OwnersDetails';
import { useGetAllOwnerDocApi } from '../../../hooks/ownerDocHooks/useListOwnerDocApi';

// Mock dependencies
vi.mock('../../../hooks/ownerDocHooks/useListOwnerDocApi', () => ({
    useGetAllOwnerDocApi: vi.fn(),
}));

vi.mock('../../../components/Modals/OwnerDetailsModal', () => ({
    __esModule: true,
    default: vi.fn(({ handleCancel }) => (
        <div>
            OwnerDetailsModal{' '}
            <button type="button" onClick={handleCancel}>
                cancel
            </button>
        </div>
    )),
}));

vi.mock('../../../components/OwnershipDoc/OwnerCard', () => ({
    __esModule: true,
    default: vi.fn(() => <div>Owner Card</div>),
}));

describe('OwnersDetails', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders "Add Owner" button', () => {
        (useGetAllOwnerDocApi as any).mockReturnValue({
            tableDatas: [],
            tableLoading: false,
        });

        render(<OwnersDetails />);

        expect(screen.getByText('Add Owner')).toBeInTheDocument();
    });

    it('opens OwnerDetailsModal when "Add Owner" button is clicked', () => {
        (useGetAllOwnerDocApi as any).mockReturnValue({
            tableDatas: [],
            tableLoading: false,
        });

        render(<OwnersDetails />);

        fireEvent.click(screen.getByText('Add Owner'));

        expect(screen.getByText('OwnerDetailsModal')).toBeInTheDocument();
    });

    it('renders OwnerCard components when tableDatas is not empty', () => {
        const mockTableDatas = [
            { id: '1', name: 'Owner 1' },
            { id: '2', name: 'Owner 2' },
        ];

        (useGetAllOwnerDocApi as any).mockReturnValue({
            tableDatas: mockTableDatas,
            tableLoading: false,
        });

        render(<OwnersDetails />);

        expect(screen.getAllByText('Owner Card')).toHaveLength(mockTableDatas.length);
    });

    it('renders "No Owner Found" message when tableDatas is empty and tableLoading is false', () => {
        (useGetAllOwnerDocApi as any).mockReturnValue({
            tableDatas: [],
            tableLoading: false,
        });

        render(<OwnersDetails />);

        expect(screen.getByText('No Owner Found')).toBeInTheDocument();
    });

    it('renders skeleton loader when tableLoading is true', () => {
        (useGetAllOwnerDocApi as any).mockReturnValue({
            tableDatas: [],
            tableLoading: true,
        });

        const { container } = render(<OwnersDetails />);
        const skeletons = container.querySelectorAll('div.ant-skeleton');
        expect(skeletons.length).toBe(16);
    });

    it('closes OwnerDetailsModal when handleCancel is called', () => {
        (useGetAllOwnerDocApi as any).mockReturnValue({
            tableDatas: [],
            tableLoading: false,
        });

        render(<OwnersDetails />);

        fireEvent.click(screen.getByText('Add Owner'));

        expect(screen.getByText('OwnerDetailsModal')).toBeInTheDocument();

        // Simulate modal close
        fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

        expect(screen.queryByText('OwnerDetailsModal')).not.toBeInTheDocument();
    });
});
