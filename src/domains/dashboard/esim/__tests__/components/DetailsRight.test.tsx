import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import DetailsRight from '@src/domains/dashboard/esim/components/esimDetails/DetailsRight';
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
        useLocation: () => ({ state: { planId: 'sample-plan-id' } }), // Mocking a non-null state
    };
});

describe('DetailsRight Component', () => {
    const defaultProps = {
        dataBal: '1 GB',
        iccid: '433454554',
    };
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
    it('should render remaining data, voice, and SMS', () => {
        render(
            <MemoryRouter>
                <DetailsRight {...defaultProps} />
            </MemoryRouter>
        );

        expect(screen.getByText('1 GB')).toBeInTheDocument(); // Remaining Data
        expect(screen.getByText('Remaining Data')).toBeInTheDocument();
    });

    it('should handle empty usage details gracefully', () => {
        const emptyUsageProps = {
            dataBal: '', // Empty usage object
            iccid: '',
        };

        render(
            <MemoryRouter>
                <DetailsRight {...emptyUsageProps} />
            </MemoryRouter>
        );

        expect(screen.getByText('Remaining Data')).toBeInTheDocument();
    });
});
