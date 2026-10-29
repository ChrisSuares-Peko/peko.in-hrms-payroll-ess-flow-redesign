import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import SearchDrawer from '@src/domains/dashboard/esim/components/home/SearchDrawer'; // Adjust the import path accordingly
import useGetCompatibleDevice from '@src/domains/dashboard/esim/hooks/useListCompatibleDevice';

// Correct mock implementation
vi.mock('@src/domains/dashboard/esim/hooks/useListCompatibleDevice', () => ({
    __esModule: true,
    default: vi.fn(),
}));

const mockData = [
    {
        id: '1',
        name: 'iPhone 13 Pro',
        brand: 'Apple',
        os: 'ios',
    },
    {
        id: '2',
        name: 'Samsung Galaxy S21',
        brand: 'Samsung',
        os: 'android',
    },
];

// Mocking the SVG import for ReactSVG
vi.mock('react-svg', () => ({
    ReactSVG: ({ src }: { src: string }) => <img src={src} alt="smartphone" />,
}));

describe('SearchDrawer Component', () => {
    it('should render the drawer with input and list', async () => {
        // Mock the useGetCompatibleDevice hook to return mock data
        (useGetCompatibleDevice as any).mockReturnValue({
            compatibleDeviceList: mockData,
            isLoading: false,
        });

        const toggleModal = vi.fn();

        render(<SearchDrawer isModalOpen toggleModal={toggleModal} />);

        // Check if the drawer title is rendered
        expect(screen.getByText('Search for Device')).toBeInTheDocument();

        // Check if input field is rendered
        expect(screen.getByPlaceholderText('Enter Your Device Model')).toBeInTheDocument();

        // Verify that both devices are displayed
        await waitFor(() => {
            expect(screen.getByText('Apple')).toBeInTheDocument();
            expect(screen.getByText('Samsung')).toBeInTheDocument();
        });
    });

    it('should filter the devices based on user input', async () => {
        // Mock the useGetCompatibleDevice hook to return mock data
        (useGetCompatibleDevice as any).mockReturnValue({
            compatibleDeviceList: mockData,
            isLoading: false,
        });

        const toggleModal = vi.fn();

        render(<SearchDrawer isModalOpen toggleModal={toggleModal} />);

        const input = screen.getByPlaceholderText('Enter Your Device Model');

        // Initially, both devices should be displayed
        await waitFor(() => {
            expect(screen.getByText('Apple')).toBeInTheDocument();
            expect(screen.getByText('Samsung')).toBeInTheDocument();
        });

        // Filter for "Apple"
        fireEvent.change(input, { target: { value: 'Apple' } });

        // Now only the Apple device should be visible
        await waitFor(() => {
            expect(screen.getByText('Apple')).toBeInTheDocument();
            expect(screen.queryByText('Samsung')).toBeNull();
        });
    });

    it('should show "No Result Found" when there are no matches', async () => {
        // Mock the useGetCompatibleDevice hook to return mock data
        (useGetCompatibleDevice as any).mockReturnValue({
            compatibleDeviceList: mockData,
            isLoading: false,
        });

        const toggleModal = vi.fn();

        render(<SearchDrawer isModalOpen toggleModal={toggleModal} />);

        const input = screen.getByPlaceholderText('Enter Your Device Model');

        // Enter a search term that has no matches
        fireEvent.change(input, { target: { value: 'NonExistentDevice' } });

        // "No Result Found" should be displayed
        await waitFor(() => {
            expect(screen.getByText('No Result Found')).toBeInTheDocument();
        });
    });

    it('should display a loading skeleton while loading devices', () => {
        // Mock the useGetCompatibleDevice hook to simulate loading state
        (useGetCompatibleDevice as any).mockReturnValue({
            compatibleDeviceList: [],
            isLoading: true,
        });

        const toggleModal = vi.fn();

        render(<SearchDrawer isModalOpen toggleModal={toggleModal} />);

        // Check if the skeleton is displayed using class or other methods
        const skeleton = document.querySelector('.ant-skeleton');
        expect(skeleton).toBeInTheDocument();
    });
});
