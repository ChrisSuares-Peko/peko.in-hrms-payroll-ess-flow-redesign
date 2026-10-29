import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import RequestNewCardModal from '../../../../components/landingPage/myCards/RequestNewCardModal';
import { useIssueCardApi } from '../../../../hooks/user/useIssueCardApi';
import { REQUEST_NEW_CARD_COPY as C } from '../../../../utils/myCardsData';

vi.mock('../../../../hooks/user/useIssueCardApi', () => ({
    useIssueCardApi: vi.fn(),
}));

vi.mock('../../../../components/common/modalProps', () => ({
    MODAL_CLOSE_ICON: null,
    ROUNDED_MODAL_CLASSNAMES: {},
    PineLabsFooter: () => <div data-testid="pine-labs-footer" />,
}));

const submitIssueCard = vi.fn();

const setup = () => render(<RequestNewCardModal open onClose={vi.fn()} />);

const field = (label: string) => screen.getByLabelText(label);
const type = (label: string, value: string) =>
    fireEvent.change(field(label), { target: { value } });
const submit = () => fireEvent.click(screen.getByRole('button', { name: C.submit }));

const fillValidForm = (perTxnLimit?: string) => {
    setup();
    type(C.cardLimit, '5000');
    if (perTxnLimit !== undefined) type(C.perTxnLimit, perTxnLimit);
};

describe('RequestNewCardModal — per-transaction limit', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        submitIssueCard.mockResolvedValue({ status: true });
        (useIssueCardApi as Mock).mockReturnValue({ submitIssueCard, isLoading: false });
    });

    it('renders the field with its helper text', () => {
        setup();

        expect(field(C.perTxnLimit)).toBeInTheDocument();
        expect(screen.getByText(C.perTxnLimitHint)).toBeInTheDocument();
    });

    it('explains what the card limit covers', () => {
        setup();

        expect(screen.getByText(C.cardLimitHint)).toBeInTheDocument();
    });

    it('accepts digits only', () => {
        setup();

        type(C.perTxnLimit, '1a2b3');

        expect(field(C.perTxnLimit)).toHaveValue('123');
    });

    it('sends the cap when one is entered', async () => {
        fillValidForm('1000');

        submit();

        await waitFor(() =>
            expect(submitIssueCard).toHaveBeenCalledWith(
                expect.objectContaining({ cardLimit: 5000, perTxnLimit: 1000 })
            )
        );
    });

    it('omits the cap entirely when left blank', async () => {
        fillValidForm();

        submit();

        await waitFor(() => expect(submitIssueCard).toHaveBeenCalled());
        expect(submitIssueCard.mock.calls[0][0]).not.toHaveProperty('perTxnLimit');
    });

    it('blocks a cap above the card limit', async () => {
        fillValidForm('6000');

        submit();

        await waitFor(() =>
            expect(
                screen.getByText('Per-transaction limit cannot exceed the card limit')
            ).toBeInTheDocument()
        );
        expect(submitIssueCard).not.toHaveBeenCalled();
    });

    it('blocks a zero cap', async () => {
        fillValidForm('0');

        submit();

        await waitFor(() =>
            expect(
                screen.getByText('Per-transaction limit must be greater than 0')
            ).toBeInTheDocument()
        );
        expect(submitIssueCard).not.toHaveBeenCalled();
    });

    it('re-checks the cap when the card limit is lowered below it', async () => {
        fillValidForm('4000');

        type(C.cardLimit, '3000');

        await waitFor(() =>
            expect(
                screen.getByText('Per-transaction limit cannot exceed the card limit')
            ).toBeInTheDocument()
        );
    });

    it('still requires the card limit itself', async () => {
        setup();
        type(C.perTxnLimit, '1000');

        submit();

        await waitFor(() =>
            expect(screen.getByText('Please enter the card limit')).toBeInTheDocument()
        );
        expect(submitIssueCard).not.toHaveBeenCalled();
    });
});
