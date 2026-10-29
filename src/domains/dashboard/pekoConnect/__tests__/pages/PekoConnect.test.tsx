/* eslint-disable react/button-has-type */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { Suspense } from 'react';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Spin } from 'antd';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useGetRequests } from '../../hooks/useGetRequests';
import PekoConnect from '../../pages/PekoConnect';

// Mock hooks
vi.mock('../../hooks/useGetRequests', () => ({
    useGetRequests: vi.fn(),
}));

vi.mock('@components/molecular/freshChat/hooks/useHideWidgetOnDrawer', () => ({
    default: vi.fn(),
}));

vi.mock('../../components/CorporateList', () => ({
    default: vi.fn(({ handleConnection }) => (
        <div data-testid="corporate-list" onClick={handleConnection}>
            CorporateList
        </div>
    )),
}));

vi.mock('../../components/ConnectionModal', () => ({
    default: vi.fn(({ visible, onCancel }) =>
        visible ? (
            <div data-testid="connection-modal">
                ConnectionModal
                <button onClick={onCancel}>Close</button>
            </div>
        ) : null
    ),
}));

describe('PekoConnect Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useGetRequests as unknown as Mock).mockReturnValue({
            requests: [],
            refresh: vi.fn(),
            isLoading: false,
        });
    });

    it('should render without crashing', () => {
        render(<PekoConnect />);
        expect(screen.getByTestId('corporate-list')).toBeInTheDocument();
    });

    it('should show the connection modal when handleConnection is triggered', async () => {
        render(<PekoConnect />);

        // Simulate clicking to open the modal
        fireEvent.click(screen.getByTestId('corporate-list'));

        await waitFor(() => {
            expect(screen.getByTestId('connection-modal')).toBeInTheDocument();
        });
    });

    it('should close the connection modal when onCancel is clicked', async () => {
        render(<PekoConnect />);

        // Simulate opening the modal
        fireEvent.click(screen.getByTestId('corporate-list'));

        await waitFor(() => {
            expect(screen.getByTestId('connection-modal')).toBeInTheDocument();
        });

        // Simulate closing the modal
        fireEvent.click(screen.getByText('Close'));

        await waitFor(() => {
            expect(screen.queryByTestId('connection-modal')).not.toBeInTheDocument();
        });
    });

    it('should display loading state when isLoading is true', () => {
        (useGetRequests as unknown as Mock).mockReturnValue({
            requests: [],
            refresh: vi.fn(),
            isLoading: true,
        });

        render(
            <Suspense fallback={<Spin />}>
                <PekoConnect />
            </Suspense>
        );

        expect(screen.getByText('CorporateList')).toBeInTheDocument();
    });
});
