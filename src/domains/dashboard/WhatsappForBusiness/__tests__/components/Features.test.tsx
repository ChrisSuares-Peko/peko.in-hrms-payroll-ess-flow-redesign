import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import Features from '../../components/Features';

describe('Features Component', () => {
    const defaultProps = {
        icon: '/test-icon.png',
        title: 'Test Feature',
        description: 'This is a test description',
        bgColor: '#FF0000',
        iconStyle: 'flex',
    };

    it('renders with an icon', () => {
        render(<Features {...defaultProps} />);
        const img = screen.getByRole('img', { name: /test feature icon/i });
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', '/test-icon.png');
    });

    it('renders with a description', () => {
        render(<Features {...defaultProps} />);
        expect(screen.getByText('This is a test description')).toBeInTheDocument();
    });

    it('does not render description when not provided', () => {
        render(<Features {...defaultProps} description={undefined} />);
        expect(screen.queryByText('This is a test description')).not.toBeInTheDocument();
    });

    it('applies background color correctly', () => {
        const { container } = render(<Features {...defaultProps} />);
        expect(container.firstChild).toHaveStyle(`background: ${defaultProps.bgColor}`);
    });
});
