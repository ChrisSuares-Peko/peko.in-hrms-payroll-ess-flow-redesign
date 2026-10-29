import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import EmptyAccounts from '../../../components/manageBankAccounts/EmptyAccounts';

describe('EmptyAccounts', () => {
    it('renders the empty state message', () => {
        render(<EmptyAccounts />);
        expect(screen.getByText('No accounts found')).toBeInTheDocument();
    });
});
