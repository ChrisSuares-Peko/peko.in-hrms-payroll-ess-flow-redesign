import { render, screen } from '@testing-library/react';
import { Formik } from 'formik';
import { describe, it, expect } from 'vitest';

import BasicDetails from '../../../components/steps/BasicDetails';

const values = {
    entityType: 'private_limited',
    applicantDetails: { fullName: '', email: '', mobile: '', state: '' },
    proposedNames: { firstChoice: '', secondChoice: '' },
    registeredOffice: { availability: 'have', officeType: 'owned', address: '', hasIdProof: false },
};

describe('BasicDetails step', () => {
    it('renders the applicant and proposed-names sections', () => {
        render(
            <Formik initialValues={values} onSubmit={() => {}}>
                <BasicDetails />
            </Formik>
        );
        expect(screen.getByText('Applicant Details')).toBeInTheDocument();
        expect(screen.getByText('Proposed Company Names')).toBeInTheDocument();
        expect(screen.getByText(/Registered Office Availability/)).toBeInTheDocument();
    });
});
