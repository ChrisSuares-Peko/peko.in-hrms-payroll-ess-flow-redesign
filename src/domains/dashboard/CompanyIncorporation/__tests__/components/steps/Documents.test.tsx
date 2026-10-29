import { render, screen } from '@testing-library/react';
import { Formik } from 'formik';
import { describe, it, expect, vi } from 'vitest';

import Documents from '../../../components/steps/Documents';

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => vi.fn(),
}));

const values = {
    entityType: 'private_limited',
    registeredOffice: { availability: 'have', officeType: 'owned' },
    directors: [],
    documents: { documents: [] },
};

describe('Documents step', () => {
    it('renders the upload progress and KYC section', () => {
        render(
            <Formik initialValues={values} onSubmit={() => {}}>
                <Documents />
            </Formik>
        );
        expect(screen.getByText(/Upload Progress/)).toBeInTheDocument();
        expect(screen.getByText('Director KYC Documents')).toBeInTheDocument();
    });
});
