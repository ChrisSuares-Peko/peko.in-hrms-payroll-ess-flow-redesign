import { render, screen, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { describe, it, expect, vi, afterEach } from 'vitest';

import DetailsWeb from '@domains/dashboard/Hotels/Components/HotelListing/DetailsWeb';

const mockStore = configureStore([]);

vi.mock('react-lottie', () => ({
    __esModule: true,
    default: () => <div data-testid="lottie-mock" />,
}));

vi.mock('react-svg', () => ({
    __esModule: true,
    ReactSVG: () => <div data-testid="svg-icon" />,
}));

vi.mock('@domains/dashboard/Hotels/Components/HotelListing/Detailshead', () => ({
    __esModule: true,
    default: () => <div>Detailshead</div>,
}));

vi.mock('@domains/dashboard/Hotels/Components/HotelListing/Filterhotel', () => ({
    __esModule: true,
    default: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock('@domains/dashboard/Hotels/Components/HotelListing/HotelList', () => ({
    __esModule: true,
    default: ({ name }: { name: string }) => <div>{name}</div>,
}));

vi.mock('@domains/dashboard/Hotels/Components/Empty', () => ({
    __esModule: true,
    default: () => <div>No hotels found</div>,
}));

vi.mock('antd', async () => {
    const actual = await vi.importActual('antd'); 
    return {
        ...actual,
        Spin: () => <div role="progressbar">Loading...</div>,
        Modal: ({ visible, children }: any) =>
            visible ? <div data-testid="modal">{children}</div> : null,
        Select: ({ options, defaultValue, onChange }: any) => (
            <select
                defaultValue={defaultValue}
                onChange={e => onChange(e.target.value)}
                data-testid="mock-select"
            >
                {options.map((option: any) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        ), 
    };
});

describe('DetailsWeb Component', () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    const mockHotelsData = [
        {
            HotelName: 'Hotel One',
            Images: ['http://example.com/image1.jpg'],
            HotelRating: 4.5,
            Address: '123 Main St',
            Rooms: [
                {
                    TotalFare: 100,
                },
            ],
        },
        {
            HotelName: 'Hotel Two',
            Images: ['http://example.com/image2.jpg'],
            HotelRating: 4.0,
            Address: '456 Second St',
            Rooms: [
                {
                    TotalFare: 150,
                },
            ],
        },
    ];

    const store = mockStore({
        reducer: {
            hotels: {
                hotelArr: mockHotelsData,
                hotelsRequest: {
                    cityName: 'test',
                },
            },
        },
    });

    it('should render the Detailshead component', () => {
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <DetailsWeb
                        isLoading={false}
                        conversationId="123"
                        searchKey="test"
                        hotelsSearch={vi.fn()}
                    />
                </MemoryRouter>
            </Provider>
        );

        expect(screen.getByText('Detailshead')).toBeInTheDocument();
    });

    it('should display loading spinner when isLoading is true', () => {
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <DetailsWeb
                        isLoading
                        conversationId="123"
                        searchKey="test"
                        hotelsSearch={vi.fn()}
                    />
                </MemoryRouter>
            </Provider>
        );
    });

    it('should display "No hotels found" when hotel data is empty', () => {
        const emptyStore = mockStore({
            reducer: {
                hotels: {
                    hotelArr: { data: false },
                },
            },
        });

        render(
            <Provider store={emptyStore}>
                <MemoryRouter>
                    <DetailsWeb
                        isLoading={false}
                        conversationId="123"
                        searchKey="test"
                        hotelsSearch={vi.fn()}
                    />
                </MemoryRouter>
            </Provider>
        );

        expect(screen.getByText('No hotels found')).toBeInTheDocument();
    });

    it('should display hotel list when hotel data is available', () => {
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <DetailsWeb
                        isLoading={false}
                        conversationId="123"
                        searchKey="test"
                        hotelsSearch={vi.fn()}
                    />
                </MemoryRouter>
            </Provider>
        );
    });

    it('should change the page when the pagination component is used', async () => {
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <DetailsWeb
                        isLoading={false}
                        conversationId="123"
                        searchKey="test"
                        hotelsSearch={vi.fn()}
                    />
                </MemoryRouter>
            </Provider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('show-text')).toHaveTextContent('Showing Properties');
        });
    });
});
