import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import BankAccountsSkeleton from '../../../components/manageBankAccounts/BankAccountsSkeleton';

describe('BankAccountsSkeleton', () => {
    it('renders the default number of skeleton cards', () => {
        const { container } = render(<BankAccountsSkeleton />);
        const cards = container.querySelectorAll('.bg-\\[\\#F9FAFB\\]');
        expect(cards.length).toBe(2);
    });

    it('renders the requested number of cards', () => {
        const { container } = render(<BankAccountsSkeleton count={1} />);
        const cards = container.querySelectorAll('.bg-\\[\\#F9FAFB\\]');
        expect(cards.length).toBe(1);
    });
});
