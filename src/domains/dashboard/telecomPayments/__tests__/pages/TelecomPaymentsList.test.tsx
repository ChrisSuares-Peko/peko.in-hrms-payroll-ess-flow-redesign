import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import TelecomPaymentsList from '../../pages/TelecomPaymentsList';

const navigateMock = vi.hoisted(() => vi.fn());
const screenSize = vi.hoisted(() => ({ current: { xs: false } as Record<string, boolean> }));

vi.mock('react-svg', () => ({
    ReactSVG: ({ src }: any) => <span data-testid="svg" data-src={src} />,
}));

vi.mock('@src/hooks/useScreenSize', () => ({
    default: () => screenSize.current,
}));

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => vi.fn(),
}));

vi.mock('@utils/checkAccess', () => ({
    checkSubServiceAccessCorporate: (_category: string, title: string) => title !== 'Test',
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return {
        ...actual,
        useNavigate: () => navigateMock,
        useLocation: () => ({ pathname: '/mobile-recharge-&-bills' }),
    };
});

vi.mock('../../components/BeneficiariesList', () => ({
    default: () => <div data-testid="beneficiaries" />,
}));

vi.mock('../../utils/data', () => ({
    telecomPayments: [
        {
            icon: 'prepaid.svg',
            title: 'Prepaid',
            url: 'prepaid',
            accessKey: 'bbps_telecom_prepaid',
        },
        {
            icon: 'mobile.svg',
            title: 'Postpaid',
            url: 'postpaid',
            accessKey: 'bbps_telecom_postpaid',
        },
        { icon: 'mobile.svg', title: 'Test', url: 'test', accessKey: 'bbps_telecom_otme' },
    ],
}));

const tilesContainerOf = (title: HTMLElement) => title.nextElementSibling as HTMLElement;

describe('TelecomPaymentsList', () => {
    beforeEach(() => {
        navigateMock.mockClear();
        screenSize.current = { xs: false };
    });

    describe('desktop', () => {
        it('renders only the tiles the corporate has access to', () => {
            render(<TelecomPaymentsList />);
            expect(screen.getByText('Prepaid')).toBeInTheDocument();
            expect(screen.getByText('Postpaid')).toBeInTheDocument();
            expect(screen.queryByText('Test')).not.toBeInTheDocument();
        });

        it('places the title and the tile row as siblings so they share one left edge', () => {
            render(<TelecomPaymentsList />);
            const title = screen.getByText('Mobile Recharge & Bills');
            const tiles = tilesContainerOf(title);
            expect(tiles.parentElement).toBe(title.parentElement);
            expect(tiles.className).toContain('ant-flex');
            expect(tiles.className).not.toContain('ant-row');
        });

        it('lays the tiles out with a fixed 40px gap and wraps instead of using grid columns', () => {
            render(<TelecomPaymentsList />);
            const tiles = tilesContainerOf(screen.getByText('Mobile Recharge & Bills'));
            expect(tiles.style.gap).toBe('40px');
            expect(tiles.className).toContain('ant-flex-wrap-wrap');
            screen.getAllByRole('button').forEach(tile => {
                expect(tile.parentElement?.parentElement).toBe(tiles);
                expect(tile.parentElement?.className).not.toContain('ant-col');
            });
        });

        it('renders every tile at exactly 90 by 90 pixels', () => {
            render(<TelecomPaymentsList />);
            const tiles = screen.getAllByRole('button');
            expect(tiles).toHaveLength(2);
            tiles.forEach(tile => {
                expect(tile.style.width).toBe('90px');
                expect(tile.style.height).toBe('90px');
                expect(tile.style.minWidth).toBe('90px');
            });
        });

        it('navigates to the tile route with the item in state', () => {
            render(<TelecomPaymentsList />);
            fireEvent.click(screen.getAllByRole('button')[1]);
            expect(navigateMock).toHaveBeenCalledWith('postpaid', {
                state: { item: expect.objectContaining({ title: 'Postpaid', url: 'postpaid' }) },
            });
        });
    });

    describe('mobile', () => {
        beforeEach(() => {
            screenSize.current = { xs: true };
        });

        it('keeps the compact mobile cards inside the gutter row', () => {
            render(<TelecomPaymentsList />);
            const tiles = tilesContainerOf(screen.getByText('Mobile Recharge & Bills'));
            expect(tiles.className).toContain('ant-row');
            expect(screen.getAllByAltText('icon')).toHaveLength(2);
            screen.getAllByRole('button').forEach(tile => {
                expect(tile.style.width).toBe('');
            });
        });
    });
});
