import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import LocationCard from '../components/LocationCard';
import { setPlanData } from '../slices';
import { WorkspaceDetail } from '../types';

vi.mock('../slices', () => ({
    setPlanData: vi.fn(),
}));

const mockStore = configureStore();
const store = mockStore({
    reducer: {
        plan: { workspaceId: null },
    },
});

describe('LocationCard Component', () => {
    const mockDispatch = vi.fn();
    store.dispatch = mockDispatch;

    const mockWorkspace: WorkspaceDetail = {
        id: 1,
        address: '123 Test Street',
        logo: '',
        name: 'Test Workspace',
        features: ['Feature 1', 'Feature 2'],
        monthlyPrice: '',
        yearlyPrice: '',
        latLng: '',
        status: false,
        perks: undefined,
        planId: 0,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the location card correctly', () => {
        render(
            <Provider store={store}>
                <LocationCard data={mockWorkspace} buttonState={0} />
            </Provider>
        );

        expect(screen.getByText('Test Workspace')).toBeInTheDocument();
        expect(screen.getByText('123 Test Street')).toBeInTheDocument();
        expect(screen.getByText('Feature 1')).toBeInTheDocument();
        expect(screen.getByText('Feature 2')).toBeInTheDocument();
    });

    it('selects the workspace when radio button is clicked', () => {
        render(
            <Provider store={store}>
                <LocationCard data={mockWorkspace} buttonState={0} />
            </Provider>
        );

        const radioButton = screen.getByRole('radio');
        fireEvent.click(radioButton);

        expect(mockDispatch).toHaveBeenCalledWith(
            setPlanData({
                workspaceId: 1,
                planId: 0,
                amount: '',
                planName: '',
            })
        );
    });

    it('displays an error message when no location is selected and buttonState is non-zero', () => {
        render(
            <Provider store={store}>
                <LocationCard data={mockWorkspace} buttonState={1} />
            </Provider>
        );

        expect(screen.getByText('Please select location')).toBeInTheDocument();
    });
});
