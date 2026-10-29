import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppDispatch } from '@src/hooks/store';

import RequestTopupModal from '../../../../components/landingPage/myCards/RequestTopupModal';
import { useCardsApi } from '../../../../hooks/user/useCardsApi';
import { useLimitIncreaseApi } from '../../../../hooks/user/useLimitIncreaseApi';
import { MyCard } from '../../../../utils/types';

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: vi.fn(),
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn((payload: any) => ({ type: 'toast/show', payload })),
}));

vi.mock('../../../../hooks/user/useCardsApi', () => ({
    useCardsApi: vi.fn(),
}));

vi.mock('../../../../hooks/user/useLimitIncreaseApi', () => ({
    useLimitIncreaseApi: vi.fn(),
}));

vi.mock('../../../../components/common/modalProps', () => ({
    MODAL_CLOSE_ICON: null,
    ROUNDED_MODAL_CLASSNAMES: {},
    PineLabsFooter: () => <div data-testid="pine-labs-footer" />,
}));

const baseCard: MyCard = {
    key: '1',
    holder: 'Jane Doe',
    kind: 'Virtual Card',
    status: 'Active',
    last4: '1234',
    used: 0,
    limit: 1000,
};

describe('RequestTopupModal — card selection excludes termination-requested cards (ADO 29295)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppDispatch as unknown as Mock).mockReturnValue(vi.fn());
        (useLimitIncreaseApi as Mock).mockReturnValue({
            submitLimitIncrease: vi.fn(),
            isLoading: false,
        });
    });

    const openCardDropdown = () => {
        render(<RequestTopupModal open onClose={vi.fn()} />);
        fireEvent.mouseDown(screen.getByText('Select'));
    };

    it('lists an Active card with no termination request', () => {
        (useCardsApi as Mock).mockReturnValue({ cards: [baseCard], isLoading: false });
        openCardDropdown();
        expect(screen.getByText('Virtual Card · **** 1234')).toBeInTheDocument();
    });

    it('lists a plain Frozen card (unrelated to termination)', () => {
        (useCardsApi as Mock).mockReturnValue({
            cards: [{ ...baseCard, key: '2', status: 'Frozen', last4: '5678' }],
            isLoading: false,
        });
        openCardDropdown();
        expect(screen.getByText('Virtual Card · **** 5678')).toBeInTheDocument();
    });

    it('excludes a card with an active termination request', () => {
        (useCardsApi as Mock).mockReturnValue({
            cards: [
                {
                    ...baseCard,
                    key: '3',
                    status: 'Frozen',
                    last4: '9999',
                    terminationRequested: true,
                },
            ],
            isLoading: false,
        });
        openCardDropdown();
        expect(screen.queryByText('Virtual Card · **** 9999')).not.toBeInTheDocument();
    });

    it('mixes eligible and ineligible cards correctly', () => {
        (useCardsApi as Mock).mockReturnValue({
            cards: [
                baseCard,
                {
                    ...baseCard,
                    key: '3',
                    status: 'Frozen',
                    last4: '9999',
                    terminationRequested: true,
                },
            ],
            isLoading: false,
        });
        openCardDropdown();
        expect(screen.getByText('Virtual Card · **** 1234')).toBeInTheDocument();
        expect(screen.queryByText('Virtual Card · **** 9999')).not.toBeInTheDocument();
    });
});
