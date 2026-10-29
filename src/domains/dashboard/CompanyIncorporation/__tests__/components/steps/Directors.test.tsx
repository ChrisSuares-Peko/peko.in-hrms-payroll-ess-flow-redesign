import { render, screen } from '@testing-library/react';
import { Formik } from 'formik';
import { describe, it, expect, vi } from 'vitest';

import Directors from '../../../components/steps/Directors';
import { EntityType } from '../../../types';

// antd's Select triggers a jsdom selector-parsing crash on mount; stub the
// SelectInput atom so the form renders without it (the assertions don't need it).
vi.mock('@components/atomic/inputs/SelectInput', () => ({
    default: () => null,
}));

const values = {
    entityType: 'private_limited',
    directors: [],
    additionalShareholders: [],
    nominee: { name: '', email: '', mobile: '', nationality: 'Indian', panNumber: '' },
};

const renderDirectors = (entityType: string) =>
    render(
        <Formik initialValues={{ ...values, entityType }} onSubmit={() => {}}>
            <Directors entityType={entityType} />
        </Formik>
    );

describe('Directors step', () => {
    it('offers an "Add Director" action for a company entity', () => {
        renderDirectors('private_limited');
        expect(screen.getByText('Add Director')).toBeInTheDocument();
    });

    it('offers an "Add Partner" action for an LLP', () => {
        renderDirectors('llp');
        expect(screen.getByText('Add Partner')).toBeInTheDocument();
    });

    it('hides the add-shareholder action once one shareholder exists for OPC', () => {
        render(
            <Formik
                initialValues={{
                    ...values,
                    entityType: EntityType.OPC,
                    directors: [values.nominee],
                    additionalShareholders: [{
                        name: 'Test Shareholder',
                        email: 'shareholder@example.com',
                        mobile: '9876543210',
                        nationality: 'Indian',
                        panNumber: 'ABCDE1234F',
                    }],
                }}
                onSubmit={() => {}}
            >
                <Directors entityType={EntityType.OPC} />
            </Formik>
        );

        expect(screen.queryByRole('button', { name: 'Add Shareholder' })).not.toBeInTheDocument();
    });
});
