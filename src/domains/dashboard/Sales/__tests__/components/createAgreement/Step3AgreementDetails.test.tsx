import React from 'react';

import { render } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

import Step3AgreementDetails from '../../../components/createAgreement/Step3AgreementDetails';
import type { Step3Ref } from '../../../types/createAgreement';

vi.mock('../../../forms/createAgreement/AgreementDetailsForm', () => ({
    default: () => <div data-testid="agreement-form" />,
}));

describe('Step3AgreementDetails', () => {
    it('renders the AgreementDetailsForm inside Formik', () => {
        const { getByTestId } = render(<Step3AgreementDetails onSubmit={async () => {}} />);

        expect(getByTestId('agreement-form')).toBeInTheDocument();
    });

    it('exposes submitForm and getFormValues via ref', () => {
        const ref = React.createRef<Step3Ref>();

        render(
            <Step3AgreementDetails
                ref={ref}
                onSubmit={async () => {}}
                initialValues={{ title: 'Hello' }}
            />
        );

        expect(typeof ref.current?.submitForm).toBe('function');
        const values = ref.current?.getFormValues();
        expect(values?.title).toBe('Hello');
    });
});
