import { render, screen, fireEvent } from '@testing-library/react';
import { Formik } from 'formik';
import { describe, it, expect, vi } from 'vitest';

import Review from '../../../components/steps/Review';

const values = {
    entityType: 'private_limited',
    applicantDetails: { fullName: 'Arjun Mehta', email: 'a@b.com', mobile: '9876543210', state: 'maharashtra' },
    proposedNames: { firstChoice: 'NovaTech', secondChoice: '' },
    registeredOffice: { availability: 'have', officeType: 'owned', address: '' },
    directors: [],
    additionalShareholders: [],
    capital: { authorizedCapital: 100000, paidUpCapital: 0, faceValuePerShare: 10, shareholders: [] },
    businessActivity: { section: '', division: '', group: '', description: '' },
    moaAoa: { moaType: 'standard', aoaType: 'standard', confirmed: false },
};

describe('Review step', () => {
    it('renders section cards for the application', () => {
        render(
            <Formik initialValues={values} onSubmit={() => {}}>
                <Review onEditStep={vi.fn()} />
            </Formik>
        );
        expect(screen.getByText('Applicant & Company Details')).toBeInTheDocument();
        expect(screen.getByText('Business Activity')).toBeInTheDocument();
    });

    it('invokes onEditStep when an Edit action is clicked', () => {
        const onEditStep = vi.fn();
        render(
            <Formik initialValues={values} onSubmit={() => {}}>
                <Review onEditStep={onEditStep} />
            </Formik>
        );
        fireEvent.click(screen.getAllByText(/Edit/i)[0]);
        expect(onEditStep).toHaveBeenCalled();
    });
});
