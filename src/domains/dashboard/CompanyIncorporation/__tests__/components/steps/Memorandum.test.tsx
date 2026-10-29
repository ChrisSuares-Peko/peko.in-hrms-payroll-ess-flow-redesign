import { render, screen } from '@testing-library/react';
import { Formik } from 'formik';
import { describe, it, expect, vi } from 'vitest';

import Memorandum from '../../../components/steps/Memorandum';

// CustomFileUploadInput dispatches to the store on upload.
vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => vi.fn(),
    useAppSelector: vi.fn(),
}));

const values = { memorandum: { memorandumPath: '', articlePath: '', llpAgreementPath: '' } };

const renderMemorandum = (entityType: string) =>
    render(
        <Formik initialValues={values} onSubmit={() => {}}>
            <Memorandum entityType={entityType} />
        </Formik>
    );

describe('Memorandum step', () => {
    it('shows MOA and AOA upload fields for non-LLP entities', () => {
        renderMemorandum('private_limited');
        expect(screen.getByText('Document Requirements')).toBeInTheDocument();
        expect(screen.getByText('Memorandum of Association (MOA)')).toBeInTheDocument();
        expect(screen.getByText('Articles of Association (AOA)')).toBeInTheDocument();
    });

    it('shows the LLP Agreement upload field for LLP', () => {
        renderMemorandum('llp');
        expect(screen.getByText('LLP Agreement')).toBeInTheDocument();
        expect(screen.queryByText('Memorandum of Association (MOA)')).toBeNull();
    });
});
