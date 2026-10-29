import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import EmojiPanel from '@src/domains/dashboard/pekoConnect/components/EmojiPanel';

vi.mock('@src/domains/dashboard/pekoConnect/components/EmojiPicker', () => ({
    default: ({ onEmojiClick }: { onEmojiClick: (emoji: string) => void }) => (
        <div data-testid="emoji-picker">
            <button type="button" data-testid="emoji-item" onClick={() => onEmojiClick('😀')}>
                😀
            </button>
        </div>
    ),
}));

describe('EmojiPanel Component', () => {
    it('renders the emoji button correctly', () => {
        render(<EmojiPanel onEmojiClick={vi.fn()} />);

        const emojiButton = screen.getByTestId('emoji-button');
        expect(emojiButton).toBeInTheDocument();
    });

    it('opens the emoji picker when clicked', async () => {
        render(<EmojiPanel onEmojiClick={vi.fn()} />);

        const emojiButton = screen.getByTestId('emoji-button');
        fireEvent.click(emojiButton);

        expect(await screen.findByTestId('emoji-picker')).toBeInTheDocument();
    });

    it('calls onEmojiClick when an emoji is selected', async () => {
        const mockOnEmojiClick = vi.fn();
        render(<EmojiPanel onEmojiClick={mockOnEmojiClick} />);

        fireEvent.click(screen.getByTestId('emoji-button')); // Open picker
        fireEvent.click(await screen.findByTestId('emoji-item')); // Select emoji

        expect(mockOnEmojiClick).toHaveBeenCalledWith('😀');
    });
});
