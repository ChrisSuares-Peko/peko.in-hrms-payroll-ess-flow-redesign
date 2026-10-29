import { render, screen } from '@testing-library/react';
import { Formik } from 'formik';
import { describe, it, expect, vi } from 'vitest';

import LlpAgreement from '../../../components/steps/LlpAgreement';

const values = {
    entityType: 'llp',
    applicantDetails: { state: '' },
    proposedNames: { firstChoice: '' },
    businessActivity: { description: '' },
    capital: { authorizedCapital: 100000, paidUpCapital: 0, faceValuePerShare: 10 },
    directors: [],
    llpAgreement: {
        agreementType: 'standard',
        partnerRights: {},
        partnerDuties: {},
        meetingQuorum: '2',
        votingThreshold: '',
        disputeResolution: { method: '', jurisdiction: '' },
        confirmed: false,
    },
};

describe('LlpAgreement step', () => {
    it('renders the standard LLP agreement option', () => {
        render(
            <Formik initialValues={values} onSubmit={() => {}}>
                <LlpAgreement onEditStep={vi.fn()} />
            </Formik>
        );
        expect(screen.getByText('Standard LLP Agreement')).toBeInTheDocument();
    });
});
