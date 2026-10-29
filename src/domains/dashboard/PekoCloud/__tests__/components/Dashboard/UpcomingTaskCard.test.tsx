import React from 'react';

import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Import the component and hooks
import { paths } from '@src/routes/paths';

import UpcomingTaskCard from '../../../components/Dashboard/UpcomingTaskCard';
import { TaskData } from '../../../types/types';

// Mock the dependencies
vi.mock('react-router-dom', async importOriginal => {
    const actual = (await importOriginal()) as typeof import('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
    };
});

describe('UpcomingTaskCard', () => {
    const mockNavigate = vi.fn();

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
        (useNavigate as any).mockImplementation(() => mockNavigate);
    });

    it('renders correctly in loading state', () => {
        const mockItem: TaskData = { isLoading: true, title: '', date: '', type: '', icon: '' };
        const { container } = render(<UpcomingTaskCard item={mockItem} />, {
            wrapper: MemoryRouter,
        });

        const skeletons = container.querySelectorAll('.ant-skeleton-input');
        expect(skeletons).toHaveLength(3); // Check if three skeleton inputs are rendered
    });

    it('renders correctly with data', () => {
        const mockItem: TaskData = {
            isLoading: false,
            title: 'Upcoming Task',
            date: '2024-01-01',
            type: 'FLEETS',
            icon: '',
        };
        render(<UpcomingTaskCard item={mockItem} />, {
            wrapper: MemoryRouter,
        });

        expect(screen.getByText('Upcoming Task')).toBeInTheDocument();
        expect(screen.getByText('2024-01-01')).toBeInTheDocument();
    });

    it('calls navigate with the correct path for FLEETS type', () => {
        const mockItem: TaskData = {
            isLoading: false,
            title: 'Upcoming Task',
            date: '2024-01-01',
            type: 'FLEETS',
            icon: '',
        };
        render(<UpcomingTaskCard item={mockItem} />, {
            wrapper: MemoryRouter,
        });

        fireEvent.click(screen.getByText('Update Now'));
        expect(mockNavigate).toHaveBeenCalledWith(
            `/${paths.pekoCloud.index}/${paths.pekoCloud.fleet}`
        );
    });

    it('calls navigate with the correct path for ASSETS type', () => {
        const mockItem: TaskData = {
            isLoading: false,
            title: 'Upcoming Task',
            date: '2024-01-01',
            type: 'ASSETS',
            icon: '',
        };
        render(<UpcomingTaskCard item={mockItem} />, {
            wrapper: MemoryRouter,
        });

        fireEvent.click(screen.getByText('Update Now'));
        expect(mockNavigate).toHaveBeenCalledWith(
            `/${paths.pekoCloud.index}/${paths.pekoCloud.assets}`
        );
    });

    it('calls navigate with the correct path for COMPANY_DOCS type', () => {
        const mockItem: TaskData = {
            isLoading: false,
            title: 'Upcoming Task',
            date: '2024-01-01',
            type: 'COMPANY_DOCS',
            icon: '',
        };
        render(<UpcomingTaskCard item={mockItem} />, {
            wrapper: MemoryRouter,
        });

        fireEvent.click(screen.getByText('Update Now'));
        expect(mockNavigate).toHaveBeenCalledWith(
            `/${paths.pekoCloud.index}/${paths.pekoCloud.companyDocuments}`
        );
    });

    it('calls navigate with the correct path for FINANCIAL_DOCS type with tab state', () => {
        const mockItem: TaskData = {
            isLoading: false,
            title: 'Upcoming Task',
            date: '2024-01-01',
            type: 'FINANCIAL_DOCS',
            icon: '',
        };
        render(<UpcomingTaskCard item={mockItem} />, {
            wrapper: MemoryRouter,
        });

        fireEvent.click(screen.getByText('Update Now'));
        expect(mockNavigate).toHaveBeenCalledWith(
            `/${paths.pekoCloud.index}/${paths.pekoCloud.financials}`,
            {
                state: { tab: '3' },
            }
        );
    });

    it('calls navigate with the correct path for OWNERS_DOCS type', () => {
        const mockItem: TaskData = {
            isLoading: false,
            title: 'Upcoming Task',
            date: '2024-01-01',
            type: 'OWNERS_DOCS',
            icon: '',
        };
        render(<UpcomingTaskCard item={mockItem} />, {
            wrapper: MemoryRouter,
        });

        fireEvent.click(screen.getByText('Update Now'));
        expect(mockNavigate).toHaveBeenCalledWith(
            `/${paths.pekoCloud.index}/${paths.pekoCloud.ownershipDocuments}`
        );
    });

    it('calls navigate with the correct path for CHEQUE_LEAVES type with tab state', () => {
        const mockItem: TaskData = {
            isLoading: false,
            title: 'Upcoming Task',
            date: '2024-01-01',
            type: 'CHEQUE_LEAVES',
            icon: '',
        };
        render(<UpcomingTaskCard item={mockItem} />, {
            wrapper: MemoryRouter,
        });

        fireEvent.click(screen.getByText('Update Now'));
        expect(mockNavigate).toHaveBeenCalledWith(
            `/${paths.pekoCloud.index}/${paths.pekoCloud.financials}`,
            {
                state: { tab: '1' },
            }
        );
    });

    it('calls navigate with the correct path for SUBSCRIPTIONS type', () => {
        const mockItem: TaskData = {
            isLoading: false,
            title: 'Upcoming Task',
            date: '2024-01-01',
            type: 'SUBSCRIPTIONS',
            icon: '',
        };
        render(<UpcomingTaskCard item={mockItem} />, {
            wrapper: MemoryRouter,
        });

        fireEvent.click(screen.getByText('Update Now'));
        expect(mockNavigate).toHaveBeenCalledWith(
            `/${paths.pekoCloud.index}/${paths.pekoCloud.subscriptions}`
        );
    });
});
