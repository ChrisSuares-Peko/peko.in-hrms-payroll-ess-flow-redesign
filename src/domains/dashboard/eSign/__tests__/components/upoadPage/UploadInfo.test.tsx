import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import UploadInfo from '../../../components/uploadPage/UploadInfo';
import { eSignSteps } from '../../../utils';

describe('UploadInfo Component', () => {
    it('renders the title correctly', () => {
        render(<UploadInfo />);
        expect(screen.getByText(/How do you eSign a Document\?/i)).toBeInTheDocument();
        expect(
            screen.getByText(/You can easily eSign a document using Peko\./i)
        ).toBeInTheDocument();
    });

    it('renders all eSign steps correctly', () => {
        render(<UploadInfo />);

        eSignSteps.forEach(step => {
            expect(screen.getByText(step.text)).toBeInTheDocument();
        });
    });

    it('renders the correct number of FeatureCard components', () => {
        render(<UploadInfo />);

        const featureCards = screen.getAllByTestId('feature-card'); // Ensure `FeatureCard` has a `data-testid`

        expect(featureCards.length).toBe(1);
    });
});
