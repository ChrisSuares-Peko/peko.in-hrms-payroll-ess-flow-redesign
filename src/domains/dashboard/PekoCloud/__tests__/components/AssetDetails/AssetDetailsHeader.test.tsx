import { cleanup, render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

import AssetDetailsHeader from '../../../components/AssetDetails/AssetDetailsHeader';

// Mock the image imports
vi.mock('@domains/dashboard/PekoCloud/assets/icons/assets/cctv-category.svg', () => ({
    __esModule: true,
    default: 'cctvCat',
}));

vi.mock('@domains/dashboard/PekoCloud/assets/icons/assets/laptop-category.svg', () => ({
    __esModule: true,
    default: 'laptopCat',
}));

vi.mock('@domains/dashboard/PekoCloud/assets/icons/assets/memory-category.svg', () => ({
    __esModule: true,
    default: 'memoryCat',
}));

vi.mock('@domains/dashboard/PekoCloud/assets/icons/assets/printer-category.svg', () => ({
    __esModule: true,
    default: 'printerCat',
}));

describe('AssetDetailsHeader Component', () => {
    const mockSetRefState = vi.fn();

    it('renders with provided asset data', () => {
        const mockData = {
            data: {
                assetName: 'Test Asset',
                assetType: 'Rented',
                assetCategory: 'CCTV',
            },
        };

        render(<AssetDetailsHeader data={mockData} setRefState={mockSetRefState} />);

        // Check if asset name is rendered
        expect(screen.getByText('Test Asset')).toBeInTheDocument();

        // Check if tag with correct style is rendered
        expect(screen.getByText('Rented')).toBeInTheDocument();
        expect(screen.getByText('Rented')).toHaveStyle({
            backgroundColor: '#EF8C44',
            color: '#FFFFFF',
        });

        // Check if the correct icon is rendered
        expect(screen.getByRole('img')).toHaveAttribute('src', 'cctvCat');
    });

    it('renders default values when no data is provided', () => {
        render(<AssetDetailsHeader data={{}} setRefState={mockSetRefState} />);

        // Check if default values are rendered
        expect(screen.getAllByText('N/A')[0]).toBeInTheDocument();

        // Check if the default icon is rendered
        expect(screen.getByRole('img')).toHaveAttribute('src', 'laptopCat');
    });

    it('renders correct tag style for assetType', () => {
        const assetTypes = [
            { type: 'Rented', expectedColor: '#EF8C44' },
            { type: 'Owned', expectedColor: '#206E47' },
            { type: 'Leased', expectedColor: '#20366E' },
            { type: 'Unknown', expectedColor: '#D9D9D9' },
        ];

        assetTypes.forEach(({ type, expectedColor }) => {
            const mockData = {
                data: {
                    assetType: type,
                    assetCategory: 'CCTV',
                },
            };

            render(<AssetDetailsHeader data={mockData} setRefState={mockSetRefState} />);

            // Check if the tag style is correct
            expect(screen.getByText(type)).toHaveStyle({
                backgroundColor: expectedColor,
                color: '#FFFFFF',
            });
        });
    });

    it('renders correct icon based on assetCategory', () => {
        const categories = [
            { category: 'CCTV', expectedSrc: 'cctvCat' },
            { category: 'Printer', expectedSrc: 'printerCat' },
            { category: 'Memory Device', expectedSrc: 'memoryCat' },
            { category: 'Laptop', expectedSrc: 'laptopCat' },
        ];

        categories.forEach(({ category, expectedSrc }, i) => {
            const mockData = {
                data: {
                    assetCategory: category,
                    assetType: 'Rented',
                },
            };

            render(<AssetDetailsHeader data={mockData} setRefState={mockSetRefState} />);

            // Check if the correct icon is rendered
            expect(screen.getByRole('img')).toHaveAttribute('src', expectedSrc);
            cleanup();
        });
    });

    it('handles missing assetType gracefully', () => {
        const mockData = {
            data: {
                assetName: 'Test Asset',
                assetCategory: 'CCTV',
            },
        };

        render(<AssetDetailsHeader data={mockData} setRefState={mockSetRefState} />);

        // Check if default tag style is applied
        expect(screen.getByText('N/A')).toHaveStyle({
            backgroundColor: '#D9D9D9',
            color: '#FFFFFF',
        });
    });
});
