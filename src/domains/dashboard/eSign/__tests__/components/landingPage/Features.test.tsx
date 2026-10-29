import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import Features from '../../../components/landingPage/Features';
import { features } from '../../../utils';

// Mock `features` data if needed
vi.mock('../../../utils', () => ({
    features: [
        { title: 'Feature 1', description: 'Description 1', icon: '/icon1.svg' },
        { title: 'Feature 2', description: 'Description 2', icon: '/icon2.svg' },
    ],
}));

describe('Features Component', () => {
    it('renders the "Key Features" heading', () => {
        render(<Features />);

        expect(screen.getByText('Key Features')).toBeInTheDocument();
        expect(screen.getByText('Signing has never been easier')).toBeInTheDocument();
    });

    it('renders the correct number of feature items', () => {
        render(<Features />);

        // Ensure all feature titles are rendered
        features.forEach(feature => {
            expect(screen.getByText(feature.title)).toBeInTheDocument();
            expect(screen.getByText(feature.description)).toBeInTheDocument();
        });
    });

    it('renders the correct icons for features', () => {
        render(<Features />);

        // Ensure all icons are present in the document
        features.forEach(feature => {
            const iconElement = document.querySelector(`[data-src="${feature.icon}"]`);
            expect(iconElement).not.toBeNull();
        });
    });
});
