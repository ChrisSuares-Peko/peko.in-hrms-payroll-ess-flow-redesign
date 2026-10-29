import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { getGovtServicesListApi } from '../../apis';
import GovernmentServicesHome from '../../pages/GovernmentServicesHome';

const mockDispatch = vi.fn();

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('../../apis', () => ({
    getGovtServicesListApi: vi.fn(),
}));

vi.mock('../../components/home/sections/HeroBanner', () => ({
    default: () => <div data-testid="hero-banner" />,
}));

vi.mock('../../components/home/sections/ServiceCards', () => ({
    default: () => <div data-testid="service-cards" />,
}));

vi.mock('../../components/home/sections/MyApplications', () => ({
    default: () => <div data-testid="my-applications" />,
}));

describe('GovernmentServicesHome Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppDispatch as Mock).mockReturnValue(mockDispatch);
        (getGovtServicesListApi as Mock).mockResolvedValue([]);
    });

    it('renders the welcome heading', () => {
        (useAppSelector as Mock).mockImplementation((selector: Function) =>
            selector({ reducer: { auth: { role: 'admin', id: '123' }, governmentServices: { servicesList: [] } } })
        );

        render(
            <BrowserRouter>
                <GovernmentServicesHome />
            </BrowserRouter>
        );

        expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    });

    it('renders the subtitle text', () => {
        (useAppSelector as Mock).mockImplementation((selector: Function) =>
            selector({ reducer: { auth: { role: 'admin', id: '123' }, governmentServices: { servicesList: [] } } })
        );

        render(
            <BrowserRouter>
                <GovernmentServicesHome />
            </BrowserRouter>
        );

        expect(
            screen.getByText(/Manage your business registrations and compliance/i)
        ).toBeInTheDocument();
    });

    it('renders HeroBanner, ServiceCards, and MyApplications sections', () => {
        (useAppSelector as Mock).mockImplementation((selector: Function) =>
            selector({ reducer: { auth: { role: 'admin', id: '123' }, governmentServices: { servicesList: [] } } })
        );

        render(
            <BrowserRouter>
                <GovernmentServicesHome />
            </BrowserRouter>
        );

        expect(screen.getByTestId('hero-banner')).toBeInTheDocument();
        expect(screen.getByTestId('service-cards')).toBeInTheDocument();
        expect(screen.getByTestId('my-applications')).toBeInTheDocument();
    });

    it('fetches services list on mount when list is empty', async () => {
        (useAppSelector as Mock).mockImplementation((selector: Function) =>
            selector({ reducer: { auth: { role: 'admin', id: '123' }, governmentServices: { servicesList: [] } } })
        );

        render(
            <BrowserRouter>
                <GovernmentServicesHome />
            </BrowserRouter>
        );

        expect(getGovtServicesListApi).toHaveBeenCalledWith('123', 'admin');
    });

    it('does not fetch services list when list already has items', () => {
        const existingServices = [
            {
                id: 1,
                name: 'MSME Registration',
                slug: 'msme',
                accessKey: 'govt_msme',
                description: '',
                category: 'Registration',
                tab: 'Mandatory',
                duration: '2-5 days',
                price: 999,
                govtFee: 'Free',
            },
        ];

        (useAppSelector as Mock).mockImplementation((selector: Function) =>
            selector({
                reducer: {
                    auth: { role: 'admin', id: '123' },
                    governmentServices: { servicesList: existingServices },
                },
            })
        );

        render(
            <BrowserRouter>
                <GovernmentServicesHome />
            </BrowserRouter>
        );

        expect(getGovtServicesListApi).not.toHaveBeenCalled();
    });
});
