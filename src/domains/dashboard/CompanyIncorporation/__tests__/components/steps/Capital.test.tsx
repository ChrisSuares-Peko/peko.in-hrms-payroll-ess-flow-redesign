import { render, screen } from '@testing-library/react';
import { Formik } from 'formik';
import { describe, it, expect, vi } from 'vitest';

import Capital from '../../../components/steps/Capital';

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => vi.fn(),
}));

const values = {
    entityType: 'private_limited',
    directors: [],
    capital: { authorizedCapital: 100000, paidUpCapital: 0, faceValuePerShare: 10, shareholders: [] },
};

const renderCapital = (entityType: string) =>
    render(
        <Formik initialValues={{ ...values, entityType }} onSubmit={() => {}}>
            <Capital entityType={entityType} />
        </Formik>
    );

describe('Capital step', () => {
    it('renders the shareholding pattern for a company entity', () => {
        renderCapital('private_limited');
        expect(screen.getByText('Shareholding Pattern')).toBeInTheDocument();
    });

    it('switches to a profit-sharing pattern for LLP', () => {
        renderCapital('llp');
        expect(screen.getByText('Profit Sharing Pattern')).toBeInTheDocument();
    });
});
