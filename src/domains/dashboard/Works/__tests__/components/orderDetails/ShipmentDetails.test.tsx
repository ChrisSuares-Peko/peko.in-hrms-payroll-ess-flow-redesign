import { render, screen } from '@testing-library/react';
import { describe, test, vi, beforeEach, expect, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import ShipmentDetails from '../../../components/orderDetails/ShipmentDetails';

vi.mock('antd', async importActual => {
    const actual = await importActual<typeof import('antd')>();
    return {
        ...actual,
        Image: ({ src }: { src: string }) => <img data-testid="step-icon" src={src} alt="icon" />,
    };
});

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

vi.mock('../../../assets/icons/order-status', () => ({
    NoteBookSVG: 'notebook.svg',
    TickSVG: 'tick.svg',
    HandshakeSVG: 'handshake.svg',
    NoteBookSuccessSVG: 'notebook-success.svg',
    TickSuccessSVG: 'tick-success.svg',
    HandshakeSuccessSVG: 'handshake-success.svg',
}));

describe('ShipmentDetails Component', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    test('renders without crashing', () => {
        (useAppSelector as Mock).mockReturnValue({
            reducer: {
                works: {
                    status: 'PENDING',
                },
            },
        });

        render(<ShipmentDetails />);
        expect(screen.getByText('Work Status')).toBeInTheDocument();
    });

    test('renders all steps correctly', () => {
        (useAppSelector as Mock).mockReturnValue({
            reducer: {
                works: {
                    status: 'PENDING',
                },
            },
        });

        render(<ShipmentDetails />);
        expect(screen.getByText('Work Assigned')).toBeInTheDocument();
        expect(screen.getByText('Work on progress')).toBeInTheDocument();
        expect(screen.getByText('Delivered')).toBeInTheDocument();
    });

    test('renders correct step for PENDING status', () => {
        (useAppSelector as Mock).mockReturnValue({
            reducer: {
                works: {
                    status: 'PENDING',
                },
            },
        });

        render(<ShipmentDetails />);
        const icons = screen.getAllByTestId('step-icon');
        expect(icons[0]).toHaveAttribute('src', 'notebook-success.svg');
        expect(icons[1]).toHaveAttribute('src', 'tick.svg');
        expect(icons[2]).toHaveAttribute('src', 'handshake.svg');
    });

    test('renders correct step for ONPROGRESS status', () => {
        (useAppSelector as Mock).mockReturnValue({
            reducer: {
                works: {
                    status: 'ONPROGRESS',
                },
            },
        });

        render(<ShipmentDetails />);
        const icons = screen.getAllByTestId('step-icon');
        expect(icons[0]).toHaveAttribute('src', 'notebook-success.svg'); // First step completed
        expect(icons[1]).toHaveAttribute('src', 'tick.svg'); // Second step in progress
        expect(icons[2]).toHaveAttribute('src', 'handshake.svg');
    });

    test('renders correct step for COMPLETED status', () => {
        (useAppSelector as Mock).mockReturnValue({
            reducer: {
                works: {
                    status: 'COMPLETED',
                },
            },
        });

        render(<ShipmentDetails />);
        const icons = screen.getAllByTestId('step-icon');
        expect(icons[0]).toHaveAttribute('src', 'notebook-success.svg');
        expect(icons[1]).toHaveAttribute('src', 'tick.svg');
        expect(icons[2]).toHaveAttribute('src', 'handshake.svg');
    });
});
