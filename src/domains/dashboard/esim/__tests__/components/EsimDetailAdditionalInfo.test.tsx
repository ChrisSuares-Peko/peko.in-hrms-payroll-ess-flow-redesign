import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import AdditionalInfoTab from '@src/domains/dashboard/esim/components/esimDetails/AdditionalInfoTab';
import EsimDetailsAdditionalInfoList from '@src/domains/dashboard/esim/components/esimDetails/EsimDetailAdditionalInfo';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';

// Mock useAppDispatch
vi.mock('@src/hooks/store', () => ({
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(),
}));

vi.mock('@src/domains/dashboard/esim/components/esimDetails//AdditionalInfoTab', () => ({
    __esModule: true,
    default: vi.fn(() => <div>Mocked AdditionalInfoTab</div>),
}));

vi.mock('@src/domains/dashboard/esim/components/esimDetails//EsimTab', () => ({
    __esModule: true,
    default: vi.fn(() => <div>Mocked EsimTab</div>),
}));

vi.mock('react-router-dom', async importOriginal => {
    const actual = (await importOriginal()) as typeof import('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
        useLocation: () => ({ state: { iccid: 'sample-plan-id' } }), // Mocking a non-null state
    };
});

vi.mock('@src/slices/apiSlice', async importOriginal => {
    const actual = (await importOriginal()) as typeof import('@src/slices/apiSlice');
    return {
        ...actual,
        showToast: vi.fn(),
    };
});
// Mock clipboard API
Object.assign(navigator, {
    clipboard: {
        writeText: vi.fn(),
    },
});

const defaultProps = {
    countryName: 'UAE',
    esim: '1243133223',
};

describe('EsimDetailsAdditionalInfoList Component', () => {
    beforeEach(() => {
        const mockDispatch = vi.fn();
        (useAppDispatch as any).mockReturnValue(mockDispatch);
        (useAppSelector as any).mockImplementation((selector: any) =>
            selector({
                reducer: {
                    auth: {
                        role: 'user',
                        id: 12,
                    },
                    subscription: {
                        amount: 100,
                    },
                },
            })
        );
    });
    it('should render AdditionalInfoTab and EsimTab components with correct props', () => {
        // Arrange
        render(<EsimDetailsAdditionalInfoList {...defaultProps} />);

        // Check if AdditionalInfoTab is rendered with the correct props
        expect(screen.getByText('Mocked AdditionalInfoTab')).toBeInTheDocument();
        expect(AdditionalInfoTab).toHaveBeenCalledWith(
            {
                countryName: 'UAE',
                esim: '1243133223',
            },
            expect.any(Object) // props for AdditionalInfoTab
        );

        // Check if EsimTab is rendered correctly
        expect(screen.getByText('Mocked EsimTab')).toBeInTheDocument();
    });

    it('should render the "Installation Guideline" text correctly', () => {
        // Arrange
        render(<EsimDetailsAdditionalInfoList {...defaultProps} />);

        // Act & Assert
        expect(screen.getByText('Installation Guidelines:')).toBeInTheDocument();
    });

    it('should render the component without crashing when no props are passed', () => {
        // Arrange
        render(<EsimDetailsAdditionalInfoList countryName="" esim="" />);

        // Act & Assert
        expect(screen.getByText('Installation Guidelines:')).toBeInTheDocument();
        expect(screen.getByText('Mocked EsimTab')).toBeInTheDocument();
        expect(screen.getByText('Mocked AdditionalInfoTab')).toBeInTheDocument();
    });
});
