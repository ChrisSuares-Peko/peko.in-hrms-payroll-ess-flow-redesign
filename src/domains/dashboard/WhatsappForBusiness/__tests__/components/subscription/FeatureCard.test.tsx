import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import FeatureCard from '../../../components/subscription/FeatureCard';

describe('FeatureCard Component', () => {
    const mockProps = {
        icon: 'https://example.com/icon.png',
        title: 'Test Feature',
        description: 'This is a test feature description.',
    };

    it('renders the title and description', () => {
        render(<FeatureCard {...mockProps} />);

        expect(screen.getByText(mockProps.title)).toBeInTheDocument();
        expect(screen.getByText(mockProps.description)).toBeInTheDocument();
    });

    it('renders the image with correct src and alt attributes', () => {
        render(<FeatureCard {...mockProps} />);

        const image = screen.getByRole('img', { name: /test feature icon/i });
        expect(image).toHaveAttribute('src', mockProps.icon);
        expect(image).toHaveAttribute('alt', 'Test Feature icon');
    });

    it('applies the correct styling to the container', () => {
        const { container } = render(<FeatureCard {...mockProps} />);

        expect(container.firstChild).toHaveStyle({
            borderRadius: '10px',
            background: '#FFF9F9',
            padding: '8px',
            height: '252px',
            overflow: 'hidden',
        });
    });
});
