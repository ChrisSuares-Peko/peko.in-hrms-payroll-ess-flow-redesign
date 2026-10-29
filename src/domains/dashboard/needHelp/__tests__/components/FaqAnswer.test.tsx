import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import FaqAnswer from '../../components/FaqAnswer';

const answer = [
    'If your recharge transaction failed, please try again after a few minutes.',
    'If the issue continues, contact our support team at reach@peko.one with:',
    '- Mobile number\n- Network provider',
    'Our team will check the transaction status.',
].join('\n\n');

describe('FaqAnswer', () => {
    it('renders each paragraph separately and the bullet lines as a list', () => {
        render(<FaqAnswer answer={answer} />);

        expect(
            screen.getByText(
                'If your recharge transaction failed, please try again after a few minutes.'
            )
        ).toBeInTheDocument();
        expect(screen.getByText('Our team will check the transaction status.')).toBeInTheDocument();
        const items = within(screen.getByRole('list')).getAllByRole('listitem');
        expect(items.map(item => item.textContent)).toEqual(['Mobile number', 'Network provider']);
    });

    it('turns support email addresses into mail links', () => {
        render(<FaqAnswer answer={answer} />);

        expect(screen.getByRole('link', { name: 'reach@peko.one' })).toHaveAttribute(
            'href',
            'mailto:reach@peko.one'
        );
    });

    it('does not swallow the full stop after an email address', () => {
        render(<FaqAnswer answer="Write to reach@peko.one. We will reply soon." />);

        expect(screen.getByRole('link', { name: 'reach@peko.one' })).toBeInTheDocument();
        expect(screen.getByText(/We will reply soon\./)).toBeInTheDocument();
    });

    it('shows an existing single-paragraph answer as plain text with no list', () => {
        render(
            <FaqAnswer answer="Log in to your Peko account - then open the payments section." />
        );

        expect(
            screen.getByText('Log in to your Peko account - then open the payments section.')
        ).toBeInTheDocument();
        expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });
});
