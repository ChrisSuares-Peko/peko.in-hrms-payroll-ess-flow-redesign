import React from 'react';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import EmojiPicker from '@src/domains/dashboard/pekoConnect/components/EmojiPicker';

// Mock the emoji-picker-react component
vi.mock('emoji-picker-react', () => ({
    default: ({
        onEmojiClick,
        width,
        height,
    }: {
        onEmojiClick: (emoji: string) => void;
        width: number;
        height: number;
    }) => (
        <div data-testid="emoji-picker" style={{ width, height }}>
            <button type="button" data-testid="emoji-item" onClick={() => onEmojiClick('😀')}>
                😀
            </button>
        </div>
    ),
}));

vi.mock('antd', async () => {
    const actual = await vi.importActual<any>('antd');
    return {
        ...actual,
        Grid: {
            useBreakpoint: vi.fn(() => ({
                xxl: false,
                xl: false,
                lg: false,
                md: true,
                sm: false,
                xs: false,
            })),
        },
    };
});

describe('EmojiPicker Component', () => {
    it('renders loading spinner while emoji picker is loading', async () => {
        render(<EmojiPicker onEmojiClick={vi.fn()} />);

        await waitFor(() => {
            expect(document.querySelector('.ant-spin')).toBeInTheDocument();
        });
    });

    it('loads EmojiPickerReact after suspense resolves', async () => {
        render(<EmojiPicker onEmojiClick={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getByTestId('emoji-picker')).toBeInTheDocument();
        });
    });

    it('calls onEmojiClick when an emoji is selected', async () => {
        const mockOnEmojiClick = vi.fn();
        render(<EmojiPicker onEmojiClick={mockOnEmojiClick} />);

        await waitFor(() => screen.getByTestId('emoji-picker'));

        fireEvent.click(screen.getByTestId('emoji-item'));

        expect(mockOnEmojiClick).toHaveBeenCalledWith('😀');
    });

    it('applies correct width and height based on screen size', async () => {
        render(<EmojiPicker onEmojiClick={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getByTestId('emoji-picker')).toBeInTheDocument();
        });

        const picker = screen.getByTestId('emoji-picker');

        expect(picker).toHaveStyle({
            width: '270px',
            height: '340px',
        });
    });
});
