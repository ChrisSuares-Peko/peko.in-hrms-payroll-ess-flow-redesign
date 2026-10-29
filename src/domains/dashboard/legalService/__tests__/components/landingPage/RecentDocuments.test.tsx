import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import RecentDocuments from '../../../components/landingPage/RecentDocuments';
import type { RecentDocument } from '../../../types';

vi.mock('react-svg', () => ({
    ReactSVG: () => <span data-testid="rsvg" />,
}));

vi.mock('../../../constants', () => ({
    RECENT_DOC_TABS: ['All', 'Draft', 'Sent', 'Signed'],
}));

const mockDocuments: RecentDocument[] = [
    { id: '1', title: 'NDA Agreement', subTitle: 'Legal • 15 Jan 2024', date: '2024-01-15', status: 'Draft', iconSrc: '/icon.svg' },
    { id: '2', title: 'Employment Contract', subTitle: 'HR • 20 Feb 2024', date: '2024-02-20', status: 'Signed', iconSrc: '/icon.svg' },
];

describe('RecentDocuments', () => {
    it('should render all documents', () => {
        render(<RecentDocuments documents={mockDocuments} />);

        expect(screen.getByText('NDA Agreement')).toBeInTheDocument();
        expect(screen.getByText('Employment Contract')).toBeInTheDocument();
    });

    it('should show empty state when no documents', () => {
        render(<RecentDocuments documents={[]} />);

        expect(screen.getByText('No documents found')).toBeInTheDocument();
    });

    it('should call onViewAll when View all is clicked', () => {
        const onViewAll = vi.fn();
        render(<RecentDocuments documents={mockDocuments} onViewAll={onViewAll} />);

        fireEvent.click(screen.getByRole('button', { name: /view all/i }));

        expect(onViewAll).toHaveBeenCalledTimes(1);
    });

    it('should call onDocumentClick with the correct document when row is clicked', () => {
        const onDocumentClick = vi.fn();
        render(<RecentDocuments documents={mockDocuments} onDocumentClick={onDocumentClick} />);

        fireEvent.click(screen.getByText('NDA Agreement'));

        expect(onDocumentClick).toHaveBeenCalledWith(mockDocuments[0]);
    });

    it('should call onTabChange with the correct tab when a tab is clicked', () => {
        const onTabChange = vi.fn();
        render(<RecentDocuments documents={mockDocuments} onTabChange={onTabChange} />);

        fireEvent.click(screen.getByRole('button', { name: 'Draft' }));

        expect(onTabChange).toHaveBeenCalledWith('Draft');
    });

    it('should render Recent Documents heading', () => {
        render(<RecentDocuments documents={mockDocuments} />);

        expect(screen.getByText('Recent Documents')).toBeInTheDocument();
    });
});
