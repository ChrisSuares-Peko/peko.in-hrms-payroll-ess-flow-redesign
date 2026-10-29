import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import AnnouncementsPanel from '../../../components/dashboard/AnnouncementsPanel';
import { Announcement } from '../../../types';

const announcements: Announcement[] = [
    {
        id: '1',
        title: 'Holiday Notice',
        description: 'Office closed on 15th August.',
        date: '10 Aug',
    },
    {
        id: '2',
        title: 'New Policy',
        description: 'Updated leave policy effective next month.',
        date: '05 Aug',
    },
];

describe('AnnouncementsPanel', () => {
    it('renders an empty state when there are no announcements', () => {
        render(<AnnouncementsPanel announcements={[]} />);

        expect(screen.getByText('No announcements right now')).toBeInTheDocument();
        expect(screen.queryByText('See all')).not.toBeInTheDocument();
    });

    it('renders each announcement with title, description and date when populated', () => {
        render(<AnnouncementsPanel announcements={announcements} />);

        expect(screen.getByText('Holiday Notice')).toBeInTheDocument();
        expect(screen.getByText('Office closed on 15th August.')).toBeInTheDocument();
        expect(screen.getByText('10 Aug')).toBeInTheDocument();
        expect(screen.getByText('New Policy')).toBeInTheDocument();
        expect(screen.getByText('Updated leave policy effective next month.')).toBeInTheDocument();
        expect(screen.queryByText('No announcements right now')).not.toBeInTheDocument();
        expect(screen.getByText('See all')).toBeInTheDocument();
    });

    it('does not render the drawer until "See all" is clicked', () => {
        render(<AnnouncementsPanel announcements={announcements} />);

        expect(screen.queryByText('All Announcements')).not.toBeInTheDocument();
    });

    it('opens the drawer with all announcements when "See all" is clicked', () => {
        render(<AnnouncementsPanel announcements={announcements} />);

        fireEvent.click(screen.getByText('See all'));

        const dialog = screen.getByRole('dialog');
        expect(within(dialog).getByText('All Announcements')).toBeInTheDocument();
        expect(within(dialog).getByText('Holiday Notice')).toBeInTheDocument();
        expect(within(dialog).getByText('New Policy')).toBeInTheDocument();
    });

    it('closes the drawer when the close button is clicked', () => {
        render(<AnnouncementsPanel announcements={announcements} />);

        fireEvent.click(screen.getByText('See all'));
        expect(screen.getByRole('dialog')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Close announcements' }));

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
});
