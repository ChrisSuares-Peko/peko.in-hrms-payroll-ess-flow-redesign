import { render, screen } from '@testing-library/react';
import { Formik } from 'formik';
import { describe, it, expect } from 'vitest';

import MoaAoa from '../../../components/steps/MoaAoa';

const values = {
    entityType: 'private_limited',
    applicantDetails: { state: '' },
    proposedNames: { firstChoice: '' },
    businessActivity: { section: '', division: '', group: '', description: '' },
    capital: { authorizedCapital: 100000, faceValuePerShare: 10 },
    directors: [],
    moaAoa: { moaType: 'standard', aoaType: 'standard', confirmed: false, ancillaryObjects: [0, 1], mainObjectTemplate: '' },
};

describe('MoaAoa step', () => {
    it('renders the MOA and AOA sections', () => {
        render(
            <Formik initialValues={values} onSubmit={() => {}}>
                <MoaAoa />
            </Formik>
        );
        expect(screen.getByText('Memorandum of Association (MOA)')).toBeInTheDocument();
        expect(screen.getByText('Articles of Association (AOA)')).toBeInTheDocument();
    });
});
