import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { describe, it, expect, vi } from 'vitest';

import SignersPopup from '../../../components/viewPage/SignersPopup';

// Mock Redux store
const mockStore = configureStore();
const store = mockStore({
    reducer: {
        eSignDoc: {
            signerArray: [0, 1],
        },
    },
});

// Mock UUID
vi.mock('uuid', () => ({
    v4: vi.fn(() => 'mock-uuid'),
}));

// Mock dispatch
vi.mock('../../slices/eSignDocSlice', () => ({
    addSignerCoordinate: vi.fn(),
}));

describe('SignersPopup Component', () => {
    const handleCancel = vi.fn();
    const mockCoordinates = {
        x1: 10,
        y1: 20,
        x2: 30,
        y2: 40,
        page: 1,
        pageHeight: 1000,
        pageWidth: 800,
    };

    const renderComponent = (open = true) =>
        render(
            <Provider store={store}>
                <SignersPopup
                    open={open}
                    handleCancel={handleCancel}
                    coordinates={mockCoordinates}
                />
            </Provider>
        );

    it('renders the modal when open', () => {
        renderComponent();
        expect(screen.getByText('Select Signer')).toBeInTheDocument();
    });

    it('closes the modal when "Cancel" button is clicked', () => {
        renderComponent();
        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);
        expect(handleCancel).toHaveBeenCalled();
    });

    it('does not render when open is false', () => {
        renderComponent(false);
        expect(screen.queryByText('Select Signer')).not.toBeInTheDocument();
    });
});
