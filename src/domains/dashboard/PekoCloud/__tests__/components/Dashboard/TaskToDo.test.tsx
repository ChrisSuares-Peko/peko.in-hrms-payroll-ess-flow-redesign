import React from 'react';

import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Import the component and hooks
import { paths } from '@src/routes/paths';

import TaskToDo from '../../../components/Dashboard/TaskToDo';

// Mock the dependencies
vi.mock('react-router-dom', async importOriginal => {
    const actual = (await importOriginal()) as typeof import('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
    };
});

describe('TaskToDo', () => {
    const mockNavigate = vi.fn();

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
        (useNavigate as any).mockImplementation(() => mockNavigate);
    });

    it('renders correctly in loading state', () => {
        const { container } = render(<TaskToDo isLoading toDoData={[]} slicedToDoData={[]} />, {
            wrapper: MemoryRouter,
        });

        const skeletons = container.querySelector('ul.ant-skeleton-paragraph');
        expect(skeletons).toBeInTheDocument();
    });

    it('renders correctly with data', () => {
        const mockData = [
            { id: 1, title: 'Alert 1', date: '2024-01-01', type: 'FLEETS' },
            { id: 2, title: 'Alert 2', date: '2024-02-01', type: 'ASSETS' },
        ];
        render(<TaskToDo isLoading={false} toDoData={mockData} slicedToDoData={mockData} />, {
            wrapper: MemoryRouter,
        });

        expect(screen.getByText('Task to do')).toBeInTheDocument();
        expect(screen.getByText('View all')).toBeInTheDocument();
        expect(screen.getByText('Alert 1')).toBeInTheDocument();
        expect(screen.getByText('Alert 2')).toBeInTheDocument();
    });

    it('displays empty state when no data is available', () => {
        render(<TaskToDo isLoading={false} toDoData={[]} slicedToDoData={[]} />, {
            wrapper: MemoryRouter,
        });
        expect(screen.getByText('Update document to show task to do')).toBeInTheDocument();
    });

    it('calls navigate with the correct path for FLEETS type', () => {
        const mockData = [{ id: 1, title: 'Alert 1', date: '2024-01-01', type: 'FLEETS' }];
        render(<TaskToDo isLoading={false} toDoData={mockData} slicedToDoData={mockData} />, {
            wrapper: MemoryRouter,
        });

        fireEvent.click(screen.getByText('Update Now'));
        expect(mockNavigate).toHaveBeenCalledWith(
            `/${paths.pekoCloud.index}/${paths.pekoCloud.fleet}`
        );
    });

    it('calls navigate with the correct path for ASSETS type', () => {
        const mockData = [{ id: 1, title: 'Alert 1', date: '2024-01-01', type: 'ASSETS' }];
        render(<TaskToDo isLoading={false} toDoData={mockData} slicedToDoData={mockData} />, {
            wrapper: MemoryRouter,
        });

        fireEvent.click(screen.getByText('Update Now'));
        expect(mockNavigate).toHaveBeenCalledWith(
            `/${paths.pekoCloud.index}/${paths.pekoCloud.assets}`
        );
    });

    it('calls navigate with the correct path for COMPANY_DOCS type', () => {
        const mockData = [{ id: 1, title: 'Alert 1', date: '2024-01-01', type: 'COMPANY_DOCS' }];
        render(<TaskToDo isLoading={false} toDoData={mockData} slicedToDoData={mockData} />, {
            wrapper: MemoryRouter,
        });

        fireEvent.click(screen.getByText('Update Now'));
        expect(mockNavigate).toHaveBeenCalledWith(
            `/${paths.pekoCloud.index}/${paths.pekoCloud.companyDocuments}`
        );
    });

    it('calls navigate with the correct path for FINANCIAL_DOCS type with tab state', () => {
        const mockData = [{ id: 1, title: 'Alert 1', date: '2024-01-01', type: 'FINANCIAL_DOCS' }];
        render(<TaskToDo isLoading={false} toDoData={mockData} slicedToDoData={mockData} />, {
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
        const mockData = [{ id: 1, title: 'Alert 1', date: '2024-01-01', type: 'OWNERS_DOCS' }];
        render(<TaskToDo isLoading={false} toDoData={mockData} slicedToDoData={mockData} />, {
            wrapper: MemoryRouter,
        });

        fireEvent.click(screen.getByText('Update Now'));
        expect(mockNavigate).toHaveBeenCalledWith(
            `/${paths.pekoCloud.index}/${paths.pekoCloud.ownershipDocuments}`
        );
    });

    it('calls navigate with the correct path for CHEQUE_LEAVES type with tab state', () => {
        const mockData = [{ id: 1, title: 'Alert 1', date: '2024-01-01', type: 'CHEQUE_LEAVES' }];
        render(<TaskToDo isLoading={false} toDoData={mockData} slicedToDoData={mockData} />, {
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
        const mockData = [{ id: 1, title: 'Alert 1', date: '2024-01-01', type: 'SUBSCRIPTIONS' }];
        render(<TaskToDo isLoading={false} toDoData={mockData} slicedToDoData={mockData} />, {
            wrapper: MemoryRouter,
        });

        fireEvent.click(screen.getByText('Update Now'));
        expect(mockNavigate).toHaveBeenCalledWith(
            `/${paths.pekoCloud.index}/${paths.pekoCloud.subscriptions}`
        );
    });
});
