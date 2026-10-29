import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import ConfirmFreezeModal from '../../../../components/landingPage/myCards/ConfirmFreezeModal';
import { MyCard } from '../../../../utils/types';

vi.mock('../../../../components/common/modalProps', () => ({
    ROUNDED_MODAL_CLASSNAMES: {},
    MODAL_CLOSE_ICON: null,
    PineLabsFooter: () => <div data-testid="pine-labs-footer" />,
}));

const card = { key: 'c1', last4: '1861', status: 'Active' } as unknown as MyCard;

const open = () => render(<ConfirmFreezeModal card={card} onClose={vi.fn()} onConfirm={vi.fn()} />);

const freezeButton = () => screen.getByRole('button', { name: /Freeze card/ });

beforeEach(() => {
    vi.clearAllMocks();
});

const typeConfirm = () =>
    fireEvent.change(screen.getByPlaceholderText('Type'), { target: { value: 'FREEZE' } });

const pickReason = async (label: string) => {
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(await screen.findByText(label));
};

describe('ConfirmFreezeModal — real antd Select, no blur', () => {
    it('enables the Freeze card button once the confirm word and a reason are in place', async () => {
        open();

        typeConfirm();
        await pickReason('Lost');

        await waitFor(() => expect(freezeButton()).toBeEnabled());
    });

    it('enables it when the confirm word is typed after the reason', async () => {
        open();

        await pickReason('Lost');
        typeConfirm();

        await waitFor(() => expect(freezeButton()).toBeEnabled());
    });

    it('keeps it disabled under Others until the note is written', async () => {
        open();

        typeConfirm();
        await pickReason('Others');

        await waitFor(() => expect(freezeButton()).toBeDisabled());

        fireEvent.change(screen.getByPlaceholderText('Enter'), {
            target: { value: 'Card left at the office' },
        });

        await waitFor(() => expect(freezeButton()).toBeEnabled());
    });

    it('re-enables when the reason moves away from Others, dropping the note', async () => {
        open();

        typeConfirm();
        await pickReason('Others');
        fireEvent.change(screen.getByPlaceholderText('Enter'), {
            target: { value: 'Card left at the office' },
        });
        await waitFor(() => expect(freezeButton()).toBeEnabled());

        await pickReason('Stolen');

        expect(screen.queryByPlaceholderText('Enter')).toBeNull();
        await waitFor(() => expect(freezeButton()).toBeEnabled());
    });
});
