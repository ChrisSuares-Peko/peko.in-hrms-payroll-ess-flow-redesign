import { render, screen } from '@testing-library/react';
import { describe, test, vi, beforeEach, expect, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import TopSection from '../../../components/orderDetails/TopSection';

vi.mock('react-svg', () => ({
    ReactSVG: () => <svg data-testid="avatar-icon" />,
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('../../../components/PlanSummaryCard', () => ({
    default: () => <div data-testid="plan-summary-card">PlanSummaryCard</div>,
}));

describe('TopSection Component', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    test('renders without crashing', () => {
        render(<TopSection />);
        expect(screen.getByTestId('plan-summary-card')).toBeInTheDocument();
    });

    test('displays CRM contact details correctly', () => {
        (useAppSelector as any).mockImplementation((selector: any) =>
            selector({
                reducer: {
                    works: {
                        name: 'John Doe',
                        email: 'johndoe@example.com',
                        mobile: '1234567890',
                    },
                },
            })
        );

        render(<TopSection />);

        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('johndoe@example.com')).toBeInTheDocument();
        expect(screen.getByText('1234567890')).toBeInTheDocument();
    });

    test('handles missing data gracefully', () => {
        (useAppSelector as Mock).mockReturnValue({
            reducer: {
                works: {},
            },
        });

        render(<TopSection />);

        expect(screen.getByTestId('plan-summary-card')).toBeInTheDocument();
        expect(screen.queryByText('₹ NaN')).not.toBeInTheDocument(); // Ensures no broken price formatting
    });

    test('renders Avatar icon', () => {
        render(<TopSection />);
        expect(screen.getByTestId('avatar-icon')).toBeInTheDocument();
    });
});
