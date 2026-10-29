import { render, screen } from '@testing-library/react';
import dayjs from 'dayjs';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import DetailsLeft from '@src/domains/dashboard/esim/components/esimDetails/DetailsLeft';
import { EsimUsage } from '@src/domains/dashboard/esim/types/orderDetails';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('react-router-dom', async importOriginal => {
    const actual = (await importOriginal()) as typeof import('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
        useLocation: () => ({ state: { iccid: 'sample-plan-id' } }), // Mocking a non-null state
    };
});

describe('DetailsLeft Component', () => {
    beforeEach(() => {
        const mockDispatch = vi.fn();
        (useAppDispatch as any).mockReturnValue(mockDispatch);
        (useAppSelector as any).mockImplementation((selector: any) =>
            selector({
                reducer: {
                    auth: {
                        role: 'user',
                        id: 12,
                    },
                    subscription: {
                        amount: 100,
                    },
                },
            })
        );
    });
    const defaultProps = {
        newTopupData: '1 GB',
        validity: '30 Days',
        countryName: 'UAE',
        corporateTxnId: "323232323",
    };

    it('should display correct package details', () => {
        render(<DetailsLeft {...defaultProps} />);

        // Checking the displayed details for Data
        expect(screen.getByText('Data:')).toBeInTheDocument();
        expect(screen.getByText('1 GB')).toBeInTheDocument(); // 2048 MB to GB conversion

        expect(screen.getByText('Validity:')).toBeInTheDocument();
    });

    it('should display warning message', () => {
        render(<DetailsLeft {...defaultProps} />);

        expect(
            screen.getByText(
                /Warning! Most eSIMs can only be installed once. If you remove the eSIM from your device, you cannot install it again./i
            )
        ).toBeInTheDocument();
    });

    it('should handle empty usage details gracefully', () => {
        const emptyProps = {
            ...defaultProps,
            usage: {} as EsimUsage, // Passing an empty usage object
        };

        render(<DetailsLeft {...emptyProps} />);

        // Data should be displayed with 0 GB if missing
        expect(screen.getByText('Data:')).toBeInTheDocument();
        expect(screen.queryByText('GB')).not.toBeInTheDocument();

        // Validity should be displayed, but formattedDate should not appear as expired_at is not provided
        expect(screen.getByText('Validity:')).toBeInTheDocument();
        expect(screen.queryByText(dayjs().format('DD-MM-YYYY'))).not.toBeInTheDocument();
    });
});
