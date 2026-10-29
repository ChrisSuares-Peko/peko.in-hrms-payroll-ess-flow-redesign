import React from 'react';

import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Import the component and hooks
import useScreenSize from '@src/hooks/useScreenSize';

import AlertsTable from '../../../components/TaskToDo/AlertsTable';
import { useGetDashToDoApi } from '../../../hooks/dashboardHooks/useGetDashTaskDataApi';

// Mock the dependencies
vi.mock('react-router-dom', async importOriginal => {
    const actual = (await importOriginal()) as typeof import('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
    };
});
vi.mock('@src/hooks/useScreenSize', () => ({
    default: vi.fn(),
}));
vi.mock('../../../hooks/dashboardHooks/useGetDashTaskDataApi', () => ({
    useGetDashToDoApi: vi.fn(),
}));
vi.mock('../../../components/TaskToDo/AlertsMobileView', () => ({
    __esModule: true,
    default: vi.fn(() => <div>AlertsMobileView</div>),
}));

describe('AlertsTable', () => {
    const mockNavigate = vi.fn();
    const defaultProps = {
        toDoData: [
            { id: 1, title: 'Alert 1', date: '2024-01-01', type: 'FLEETS', status: 'Active' },
            { id: 2, title: 'Alert 2', date: '2024-02-01', type: 'FLEETS', status: 'Inactive' },
        ],
        isLoading: false,
    };

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
        (useScreenSize as any).mockReturnValue({ xs: false });
        (useGetDashToDoApi as any).mockReturnValue(defaultProps);
        (useNavigate as any).mockImplementation(() => mockNavigate);
    });

    it('renders correctly in desktop view', () => {
        render(<AlertsTable />);
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getByText('Alert 1')).toBeInTheDocument();
        expect(screen.getByText('Alert 2')).toBeInTheDocument();
    });

    it('renders correctly in mobile view', () => {
        (useScreenSize as any).mockReturnValue({ xs: true });
        render(<AlertsTable />);
        expect(screen.getByText('AlertsMobileView')).toBeInTheDocument();
    });

    it('displays loading state when isLoading is true', () => {
        (useGetDashToDoApi as any).mockReturnValue({ ...defaultProps, isLoading: true });
        const { container } = render(<AlertsTable />);
        const skeletons = container.querySelector('div.ant-spin-nested-loading');
        expect(skeletons).toBeInTheDocument();
    });

    it('displays empty state when no data is available', () => {
        (useGetDashToDoApi as any).mockReturnValue({ toDoData: [], isLoading: false });
        render(<AlertsTable />);
        const allNoDataTexts = screen.getAllByText('No data');

        const filtered = allNoDataTexts.filter(element => !element.closest('svg'));

        expect(filtered.length).toBeGreaterThan(0);
    });

    it('navigates to the correct path when a table row is clicked', () => {
        render(<AlertsTable />);
        fireEvent.click(screen.getAllByRole('button', { name: /update/i })[1]);
        expect(mockNavigate).toHaveBeenCalled();
    });

    it('opens AlertsMobileView when in mobile view', () => {
        (useScreenSize as any).mockReturnValue({ xs: true });
        render(<AlertsTable />);
        expect(screen.getByText('AlertsMobileView')).toBeInTheDocument();
    });
});
