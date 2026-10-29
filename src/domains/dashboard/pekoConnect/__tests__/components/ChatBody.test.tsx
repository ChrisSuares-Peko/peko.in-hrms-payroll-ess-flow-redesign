import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import documentDefault from '../../assets/documentDefault.svg';
import ChatBody from '../../components/ChatBody';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

beforeEach(() => {
    (useAppSelector as Mock).mockReturnValue({ user: { email: 'test@example.com' } });
});

describe('ChatBody Component', () => {
    it('renders empty state when no messages exist', () => {
        render(<ChatBody messages={[]} />);

        expect(screen.getByText('No messages yet')).toBeInTheDocument();
    });

    it('groups messages by date and displays the date', () => {
        const messages = [
            {
                id: '1',
                sender: 'user1@example.com',
                type: 'text',
                text: 'Hello!',
                createdAt: { seconds: 1709836800 },
            },
            {
                id: '2',
                sender: 'user2@example.com',
                type: 'text',
                text: 'Hey!',
                createdAt: { seconds: 1709923200 },
            },
        ];

        render(<ChatBody messages={messages} />);

        expect(screen.getByText(/Hello!/)).toBeInTheDocument();
        expect(screen.getByText(/Hey!/)).toBeInTheDocument();

        const dateElements = screen.getAllByText(
            (content, element) => !!element?.textContent?.match(/\bMarch \d{1,2}, 2024\b/)
        );

        expect(dateElements.length).toBeGreaterThanOrEqual(1);
    });

    it('renders text messages correctly', () => {
        const messages = [
            {
                id: '1',
                sender: 'user1@example.com',
                text: 'Hello!',
                type: 'text',
                createdAt: { seconds: 1707800000 },
            },
        ];

        render(<ChatBody messages={messages} />);

        expect(screen.getByText('Hello!')).toBeInTheDocument();
    });

    it('renders image messages with download link', async () => {
        const messages = [
            {
                id: '1',
                sender: 'user1@example.com',
                type: 'image',
                fileUrl: 'https://example.com/image.png',
                createdAt: { seconds: 1707800000 },
            },
        ];

        render(<ChatBody messages={messages} />);

        const images = screen.getAllByRole('img');
        const messageImage = images.find(
            img => img.getAttribute('src') === 'https://example.com/image.png'
        );

        expect(messageImage).toBeDefined();
        expect(messageImage).toHaveAttribute('src', 'https://example.com/image.png');

        // Verify the download link exists
        const downloadLinks = screen.getAllByRole('link');
        const downloadLink = downloadLinks.find(
            link => link.getAttribute('href') === 'https://example.com/image.png'
        );

        expect(downloadLink).toBeDefined();
        expect(downloadLink).toHaveAttribute('href', 'https://example.com/image.png');
    });

    it('renders call logs correctly', () => {
        const messages = [
            {
                id: '1',
                sender: 'user1@example.com',
                type: 'Call',
                createdAt: { seconds: 1707800000 },
            },
        ];

        render(<ChatBody messages={messages} />);

        expect(screen.getByText('Incoming Call')).toBeInTheDocument();
    });

    it('displays the correct timestamp', () => {
        const messages = [
            {
                id: '1',
                sender: 'user1@example.com',
                text: 'Hello!',
                type: 'text',
                createdAt: { seconds: 1707800000 },
            },
        ];

        render(<ChatBody messages={messages} />);

        expect(screen.getByText(/\d{1,2}:\d{2} (AM|PM)/)).toBeInTheDocument();
    });

    it('shows default image on error', async () => {
        const messages = [
            {
                id: '1',
                sender: 'user1@example.com',
                type: 'image',
                fileUrl: 'https://broken-link.com/image.png',
                createdAt: { seconds: 1707800000 },
            },
        ];

        render(<ChatBody messages={messages} />);

        const images = screen.getAllByRole('img');
        const img = images.find(
            image => image.getAttribute('src') === 'https://broken-link.com/image.png'
        );

        expect(img).toBeDefined();

        img?.dispatchEvent(new Event('error'));

        expect(img).toHaveAttribute('src', documentDefault);
    });
});
