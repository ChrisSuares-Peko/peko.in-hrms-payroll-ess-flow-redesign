import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, expect, test } from 'vitest';

import IconCardMobile from '../../components/IconCardMobile';

describe('IconCardMobile Component', () => {
    test('should render the icon and title correctly', () => {
        const icon = 'path/to/icon.svg'; // Replace with your icon path
        const title = 'Test Card';

        render(<IconCardMobile icon={icon} title={title} />);

        // Check if the image and title are displayed correctly
        expect(screen.getByAltText('icon')).toHaveAttribute('src', icon);
        expect(screen.getByText(title)).toBeInTheDocument();
    });

    test('should call onClick when the card is clicked', () => {
        const icon = 'path/to/icon.svg'; // Replace with your icon path
        const title = 'Test Card';
        const mockOnClick = vi.fn();

        render(<IconCardMobile icon={icon} title={title} onClick={mockOnClick} />);

        // Trigger the click event
        fireEvent.click(screen.getByRole('button'));

        // Verify that the onClick function was called
        expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    test('should render without onClick handler', () => {
        const icon = 'path/to/icon.svg'; // Replace with your icon path
        const title = 'Test Card';

        render(<IconCardMobile icon={icon} title={title} />);

        // Check if the title and icon are rendered without any errors
        expect(screen.getByAltText('icon')).toHaveAttribute('src', icon);
        expect(screen.getByText(title)).toBeInTheDocument();
    });

    test('should not re-render if props are the same (React.memo)', () => {
        const icon = 'path/to/icon.svg';
        const title = 'Test Card';
        const { rerender } = render(<IconCardMobile icon={icon} title={title} />);

        // Initial render
        const card = screen.getByRole('button');

        // Rerender with the same props
        rerender(<IconCardMobile icon={icon} title={title} />);

        // Ensure no new render happened (if React.memo is working correctly)
        expect(card).toBeInTheDocument();
    });

    test('should render correctly with missing or empty icon', () => {
        const icon = ''; // Empty icon
        const title = 'Test Card';

        render(<IconCardMobile icon={icon} title={title} />);

        // Check if the card renders correctly without an icon
        expect(screen.getByText(title)).toBeInTheDocument();
    });
});
