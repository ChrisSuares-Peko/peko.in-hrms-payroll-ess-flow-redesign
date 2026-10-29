import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, type Mock } from 'vitest';

import AllDocumentsDrawer from '../../../components/landingPage/AllDocumentsDrawer';
import useDocuments from '../../../hooks/useDocuments';
import type { RecentDocument } from '../../../types';

vi.mock('react-svg', () => ({
    ReactSVG: () => <span data-testid="rsvg" />,
}));

vi.mock('../../../constants', () => ({
    RECENT_DOC_TABS: ['All', 'Draft', 'Sent', 'Signed'],
}));

vi.mock('../../../hooks/useDocuments');

vi.mock('@src/hooks/useDebounceSearch', () => ({
    default: (_setter: any) => ({ updateSearchText: vi.fn() }),
}));

vi.mock('@components/atomic/DrawerModal', () => ({
    default: ({ children, open }: any) => open ? <div data-testid="drawer">{children}</div> : null,
}));

const mockDocuments: RecentDocument[] = [
    { id: '1', title: 'NDA Agreement', subTitle: 'Legal', date: '2024-01-15', status: 'Draft', iconSrc: '/icon.svg' },
    { id: '2', title: 'Employment Contract', subTitle: 'HR', date: '2024-02-20', status: 'Signed', iconSrc: '/icon.svg' },
];

describe('AllDocumentsDrawer', () => {
    it('should render when open is true', () => {
        (useDocuments as Mock).mockReturnValue({ documents: mockDocuments, total: 2, isLoading: false });

        render(<AllDocumentsDrawer open onClose={vi.fn()} />);

        expect(screen.getByTestId('drawer')).toBeInTheDocument();
        expect(screen.getByText('All Documents')).toBeInTheDocument();
    });

    it('should not render when open is false', () => {
        (useDocuments as Mock).mockReturnValue({ documents: [], total: 0, isLoading: false });

        render(<AllDocumentsDrawer open={false} onClose={vi.fn()} />);

        expect(screen.queryByTestId('drawer')).not.toBeInTheDocument();
    });

    it('should show total document count', () => {
        (useDocuments as Mock).mockReturnValue({ documents: mockDocuments, total: 2, isLoading: false });

        render(<AllDocumentsDrawer open onClose={vi.fn()} />);

        expect(screen.getByText('2 total')).toBeInTheDocument();
    });

    it('should show loading spinner when isLoading is true', () => {
        (useDocuments as Mock).mockReturnValue({ documents: [], total: 0, isLoading: true });

        const { container } = render(<AllDocumentsDrawer open onClose={vi.fn()} />);

        expect(container.querySelector('.ant-spin')).toBeInTheDocument();
    });

    it('should show empty state when no documents found', () => {
        (useDocuments as Mock).mockReturnValue({ documents: [], total: 0, isLoading: false });

        render(<AllDocumentsDrawer open onClose={vi.fn()} />);

        expect(screen.getByText('No documents found')).toBeInTheDocument();
    });

    it('should render document list when documents exist', () => {
        (useDocuments as Mock).mockReturnValue({ documents: mockDocuments, total: 2, isLoading: false });

        render(<AllDocumentsDrawer open onClose={vi.fn()} />);

        expect(screen.getByText('NDA Agreement')).toBeInTheDocument();
        expect(screen.getByText('Employment Contract')).toBeInTheDocument();
    });

    it('should call onClose when close icon is clicked', () => {
        (useDocuments as Mock).mockReturnValue({ documents: [], total: 0, isLoading: false });
        const onClose = vi.fn();

        render(<AllDocumentsDrawer open onClose={onClose} />);

        fireEvent.click(screen.getByRole('img', { name: /close-circle/i, hidden: true }));

        expect(onClose).toHaveBeenCalled();
    });

    it('should call onDocumentClick with correct doc when a document is clicked', () => {
        (useDocuments as Mock).mockReturnValue({ documents: mockDocuments, total: 2, isLoading: false });
        const onDocumentClick = vi.fn();

        render(<AllDocumentsDrawer open onClose={vi.fn()} onDocumentClick={onDocumentClick} />);

        fireEvent.click(screen.getByText('NDA Agreement'));

        expect(onDocumentClick).toHaveBeenCalledWith(mockDocuments[0]);
    });
});
