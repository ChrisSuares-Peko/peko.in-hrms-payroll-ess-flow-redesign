import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import AlertsMobileView from '../../../components/TaskToDo/AlertsMobileView';

// Mock the AlertsMobileCard component
vi.mock('../../../components/TaskToDo/AlertsMobileCard', () => ({
    __esModule: true,
    default: vi.fn(() => <div>AlertsMobileCard</div>),
}));

describe('AlertsMobileView', () => {
    const defaultProps = {
        tableDatas: [
            {
                title: 'Test Title',
                date: '2024-01-01',
                type: 'FLEETS',
                status: 'Active',
                actions: '',
            },
        ],
        isLoading: false,
    };

    it('renders the component correctly', () => {
        render(<AlertsMobileView {...defaultProps} />);

        // Check for header texts
        expect(screen.getByText('Alerts')).toBeInTheDocument();
        expect(screen.getByText('Date')).toBeInTheDocument();

        // Check for AlertsMobileCard components
        expect(screen.getByText('AlertsMobileCard')).toBeInTheDocument();
    });

    it('displays loading skeleton when isLoading is true', () => {
        const { container } = render(<AlertsMobileView {...defaultProps} isLoading />);
        const skeletons = container.querySelectorAll('.ant-skeleton-paragraph');
        expect(skeletons.length).toBe(10); // Verify 10 skeletons are rendered
    });

    it('displays empty state when tableDatas is empty', () => {
        render(<AlertsMobileView {...defaultProps} tableDatas={[]} />);
        expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('renders AlertsMobileCard components for each item in tableDatas', () => {
        render(<AlertsMobileView {...defaultProps} />);
        expect(screen.getAllByText('AlertsMobileCard').length).toBe(defaultProps.tableDatas.length);
    });
});
