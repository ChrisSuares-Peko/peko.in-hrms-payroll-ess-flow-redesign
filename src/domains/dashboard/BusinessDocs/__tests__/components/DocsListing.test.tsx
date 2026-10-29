import React from 'react';

import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

import DocsListing from '@src/domains/dashboard/BusinessDocs/components/DocsListing';

// Mock the ReactSVG component to avoid rendering actual SVGs during tests
vi.mock('react-svg', () => ({
    ReactSVG: vi.fn(() => <div data-testid="mock-svg" />),
}));

describe('DocsListing Component', () => {
    const defaultProps = {
        title: 'Sample Document',
        documentUrl: 'http://example.com/sample.pdf',
        key: 1,
    };

    it('renders the document title', () => {
        render(<DocsListing {...defaultProps} />);

        const titleElement = screen.getByText('Sample Document');
        expect(titleElement).toBeInTheDocument();
    });

    it('renders the document title with tooltip if title is long', () => {
        const longTitleProps = {
            ...defaultProps,
            title: 'A Very Long Document Title That Exceeds Twenty-Three Characters',
        };

        render(<DocsListing {...longTitleProps} />);

        const tooltipText = screen.getByText(/A Very Long Document Title That Exceeds/);
        expect(tooltipText).toBeInTheDocument();

        // Ensure the title is inside a Tooltip by checking its parent element
        expect(tooltipText.closest('div')).toBeTruthy();
    });

    it('renders the download icon with the correct href', () => {
        render(<DocsListing {...defaultProps} />);

        const downloadLink = screen.getByRole('link');
        expect(downloadLink).toHaveAttribute('href', 'http://example.com/sample.pdf');
        expect(downloadLink).toHaveAttribute('target', '_blank');
        expect(downloadLink).toHaveAttribute('rel', 'noopener noreferrer');
        expect(downloadLink).toHaveAttribute('download');
    });

    it('renders the file icon and download icon as SVGs', () => {
        render(<DocsListing {...defaultProps} />);

        const svgIcons = screen.getAllByTestId('mock-svg');
        expect(svgIcons).toHaveLength(1); // File icon and download icon
    });
});
