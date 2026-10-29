/**
 * @file SoftwareLayout.test.tsx
 * @description Unit test for SoftwareLayout component
 * Verifies:
 *  - Renders child routes via Outlet
 *  - Dispatches resetSoftwareStateKeepSearch on unmount
 */

import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import SoftwareLayout from '../../layout/SoftwareLayout';
import { resetSoftwareStateKeepSearch } from '../../slice/softwareSlice';

const mockDispatch = vi.fn();

/**
 * @mock Redux store hook
 */
vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => mockDispatch,
}));

/**
 * @mock resetSoftwareStateKeepSearch action
 */
vi.mock('../../slice/softwareSlice', () => ({
    resetSoftwareStateKeepSearch: vi.fn(() => ({ type: 'software/resetSoftwareStateKeepSearch' })),
}));

/**
 * Renders SoftwareLayout with a child route so Outlet has content to display
 */
const renderWithRouter = () => {
    const router = createMemoryRouter(
        [
            {
                path: '/',
                element: <SoftwareLayout />,
                children: [{ index: true, element: <div>Child Route</div> }],
            },
        ],
        { initialEntries: ['/'] }
    );
    return render(<RouterProvider router={router} />);
};

describe('SoftwareLayout', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render child routes via Outlet', () => {
        renderWithRouter();

        expect(screen.getByText('Child Route')).toBeInTheDocument();
    });

    it('should dispatch resetSoftwareStateKeepSearch on unmount', () => {
        const { unmount } = renderWithRouter();

        expect(mockDispatch).not.toHaveBeenCalled();

        unmount();

        expect(mockDispatch).toHaveBeenCalledTimes(1);
        expect(mockDispatch).toHaveBeenCalledWith(resetSoftwareStateKeepSearch());
    });

    it('should not dispatch resetSoftwareStateKeepSearch on mount', () => {
        renderWithRouter();

        expect(mockDispatch).not.toHaveBeenCalled();
    });
});
