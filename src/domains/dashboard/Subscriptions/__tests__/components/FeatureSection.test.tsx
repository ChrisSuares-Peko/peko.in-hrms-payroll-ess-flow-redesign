import React from 'react';

import { cleanup, render } from '@testing-library/react';
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';

import FeaturesSection from '../../components/subscriptionDetails/FeaturesSection';

describe('FeaturesSection', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });
    it('renders a list of features when data is provided', () => {
        const featureText = 'Feature 1\nFeature 2\nFeature 3';
        const { getByText } = render(<FeaturesSection feature={featureText} />);

        expect(getByText('Feature 1')).toBeInTheDocument();
        expect(getByText('Feature 2')).toBeInTheDocument();
        expect(getByText('Feature 3')).toBeInTheDocument();
    });

    it('renders empty state when no features are provided', () => {
        const { getByText } = render(<FeaturesSection feature="" />);
        expect(getByText('No Data')).toBeInTheDocument();
        const emptyComponent = getByText('No Data').closest('div');
        expect(emptyComponent).toHaveClass('ant-empty-description');
    });

    it('applies alternating row backgrounds', () => {
        const featureText = 'Feature 1\nFeature 2';
        const { container } = render(<FeaturesSection feature={featureText} />);
        const rows = container.querySelectorAll('.py-4');

        expect(rows[0]).toHaveClass('bg-listBg');
        expect(rows[1]).toHaveClass('bg-white');
    });

    it('handles a single feature without line breaks', () => {
        const featureText = 'Single Feature';
        const { getByText } = render(<FeaturesSection feature={featureText} />);

        expect(getByText('Single Feature')).toBeInTheDocument();
    });
});
