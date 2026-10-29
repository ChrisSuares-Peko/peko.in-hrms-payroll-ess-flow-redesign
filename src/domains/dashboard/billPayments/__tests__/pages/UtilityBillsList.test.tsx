import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import UtilityBillsList from '../../pages/UtilityBillsList';

const navigateMock = vi.hoisted(() => vi.fn());

vi.mock('react-svg', () => ({
    ReactSVG: ({ src }: any) => <span data-testid="svg" data-src={src} />,
}));

vi.mock('@utils/checkAccess', () => ({
    checkSubServiceAccessCorporate: (_category: string, title: string) => title !== 'Hidden Bill',
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('../../utils/data', () => ({
    billPayments: [
        { icon: 'electricity.svg', title: 'Electricity Bill', url: 'electricity' },
        { icon: 'lpg.svg', title: 'LPG Cylinder', url: 'lpg' },
        { icon: 'hidden.svg', title: 'Hidden Bill', url: 'hidden' },
    ],
}));

describe('UtilityBillsList', () => {
    beforeEach(() => {
        navigateMock.mockClear();
    });

    it('renders only the tiles the corporate has access to', () => {
        render(<UtilityBillsList />);
        expect(screen.getByText('Electricity Bill')).toBeInTheDocument();
        expect(screen.getByText('LPG Cylinder')).toBeInTheDocument();
        expect(screen.queryByText('Hidden Bill')).not.toBeInTheDocument();
    });

    it('drops the extra column margin that pushed the first tile off the page edge', () => {
        const { container } = render(<UtilityBillsList />);
        container.querySelectorAll('.ant-col').forEach(col => {
            expect(col.className).not.toContain('mx-2');
        });
    });

    it('keeps the responsive grid so the tiles-per-row behaviour is unchanged', () => {
        const { container } = render(<UtilityBillsList />);
        const row = container.querySelector('.ant-row') as HTMLElement;
        expect(row).toBeInTheDocument();
        const cols = container.querySelectorAll('.ant-col');
        expect(cols).toHaveLength(2);
        cols.forEach(col => {
            expect(col.className).toContain('ant-col-sm-6');
            expect(col.className).toContain('ant-col-md-4');
        });
    });

    it('places each 90px tile flush at the start of its column', () => {
        render(<UtilityBillsList />);
        const tiles = screen.getAllByRole('button');
        expect(tiles).toHaveLength(2);
        tiles.forEach(tile => {
            expect(tile.className).toContain('w-[90px]');
            expect(tile.parentElement?.className).toContain('ant-col');
        });
    });

    it('navigates to the tile route with the item in state', () => {
        render(<UtilityBillsList />);
        fireEvent.click(screen.getAllByRole('button')[1]);
        expect(navigateMock).toHaveBeenCalledWith('lpg', {
            state: { item: expect.objectContaining({ title: 'LPG Cylinder', url: 'lpg' }) },
        });
    });
});
