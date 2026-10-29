import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import CustomAvatar from '../../components/CustomAvatar';

describe('CustomAvatar Component', () => {
    it('renders an image when logo is provided', () => {
        const logoUrl = 'https://example.com/avatar.png';
        render(<CustomAvatar logo={logoUrl} name="John Doe" />);

        const image = screen.getByRole('img', { name: 'John Doe' });
        expect(image).toHaveAttribute('src', logoUrl);
    });

    it('renders the first letter of the name when no logo is provided', () => {
        render(<CustomAvatar logo={undefined} name="John Doe" />);

        const avatar = screen.getByText('J'); // First letter of "John"
        expect(avatar).toBeInTheDocument();
    });

    it('renders default background color when no logo is provided', () => {
        render(<CustomAvatar logo={undefined} name="John" />);

        const avatar = screen.getByText('J').closest('.ant-avatar'); // Get closest parent Avatar

        expect(avatar).toHaveStyle({
            backgroundColor: '#FFE6E6',
            color: '#FF4F4F',
            fontWeight: 'bolder',
        });
    });
});
