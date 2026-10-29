import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { TxnStatusTag } from '../../../../components/landingPage/transactions/TransactionStatusTag';

describe('TxnStatusTag', () => {
    it('renders the status with no tooltip by default, so existing callers are unchanged', () => {
        render(<TxnStatusTag status="Posted" />);

        expect(screen.getByText('Posted')).toBeInTheDocument();
        expect(document.querySelector('.cursor-help')).toBeNull();
    });

    it('shows the decline reason on hover when one is given', async () => {
        render(<TxnStatusTag status="Declined" tooltip="Merchant category blocked by policy" />);

        fireEvent.mouseEnter(screen.getByText('Declined'));

        await waitFor(() =>
            expect(screen.getByText('Merchant category blocked by policy')).toBeInTheDocument()
        );
    });

    // A declined charge with no reason recorded must not render an empty tooltip box.
    it.each([[null], [undefined], ['']])('renders no tooltip for a %p reason', tooltip => {
        render(<TxnStatusTag status="Declined" tooltip={tooltip as string | null} />);

        expect(screen.getByText('Declined')).toBeInTheDocument();
        expect(document.querySelector('.cursor-help')).toBeNull();
    });

    it('marks the pill as hoverable only when it carries a reason', () => {
        const { unmount } = render(
            <TxnStatusTag status="Declined" tooltip="Insufficient balance" />
        );
        expect(document.querySelector('.cursor-help')).not.toBeNull();
        unmount();

        render(<TxnStatusTag status="Declined" />);
        expect(document.querySelector('.cursor-help')).toBeNull();
    });
});
