import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import SearchEsim from '@src/domains/dashboard/esim/components/home/SearchEsim'; // Adjust the path accordingly
import useSearchPackages from '@src/domains/dashboard/esim/hooks/useSearchPackages';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';

// Mocking the Redux hooks
vi.mock('@src/hooks/store', () => ({
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(),
}));

// Mocking the useSearchPackages hook
vi.mock('@src/domains/dashboard/esim/hooks/useSearchPackages', () => ({
    default: vi.fn(),
}));

// Mocking the clevertap-web-sdk
vi.mock('clevertap-web-sdk', () => ({
    event: {
        push: vi.fn(),
    },
}));

describe('SearchEsim Component', () => {
    const mockDispatch = vi.fn();

    beforeEach(() => {
        (useAppDispatch as any).mockReturnValue(mockDispatch);
        (useAppSelector as any).mockReturnValue({
            esimType: '',
            country: '',
            region: '',
            user: { email: 'test@example.com' },
        });
        (useSearchPackages as any).mockReturnValue({
            data: [
                {
                    title: 'Country 1',
                    country_code: 'C1',
                    image: { url: 'https://example.com/image1.jpg' },
                },
                {
                    title: 'Country 2',
                    country_code: 'C2',
                    image: { url: 'https://example.com/image2.jpg' },
                },
            ],
            isLoading: false,
        });
    });

    it('should render the SearchEsim component', () => {
        render(
            <MemoryRouter>
                <SearchEsim />
            </MemoryRouter>
        );

        expect(screen.getByText('Package Type')).toBeInTheDocument();
        expect(screen.getByText('Search eSIM')).toBeInTheDocument();
    });

    it('should show an error toast when no eSIM type is selected and search is triggered', async () => {
        render(
            <MemoryRouter>
                <SearchEsim />
            </MemoryRouter>
        );

        const searchButton = screen.getByText('Search eSIM');
        fireEvent.click(searchButton);

        await waitFor(() => {
            expect(mockDispatch).toHaveBeenCalledWith(
                expect.objectContaining({
                    payload: expect.objectContaining({
                        description: 'Select eSIM Type',
                    }),
                })
            );
        });
    });

    // it('should open the SearchDrawer modal when clicking on "Search for supported smartphone models"', async () => {
    //     render(
    //         <MemoryRouter>
    //             <SearchEsim />
    //         </MemoryRouter>
    //     );

    //     const searchSmartphoneLink = screen.getByText('Search for supported smartphone models');
    //     screen.debug();
    //     fireEvent.click(searchSmartphoneLink);

    //     await waitFor(() => {
    //         expect(screen.getByText('Search for Device')).toBeInTheDocument();
    //     });
    // });
});
