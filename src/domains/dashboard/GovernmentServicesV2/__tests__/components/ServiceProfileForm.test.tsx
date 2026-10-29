import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ServiceProfileForm from '../../components/ServiceProfileForm';
import { ProfileValues } from '../../utils/serviceDetailForm';

const onFieldChange = vi.fn();
const onPanChange = vi.fn();
const onVerifyPan = vi.fn();

const profileValues: ProfileValues = {
    legalBusinessName: 'Peko Technologies',
    stateOfRegistration: '',
    name: 'Joseph',
    email: 'joseph@example.com',
    phoneNumber: '9876543210',
    pan: 'ABCDE1234F',
    entityType: '',
    proposedName: '',
    alternateName: '',
};

const renderForm = (props: Partial<Parameters<typeof ServiceProfileForm>[0]> = {}) =>
    render(
        <ServiceProfileForm
            profileValues={profileValues}
            onFieldChange={onFieldChange}
            onPanChange={onPanChange}
            fieldErrors={{}}
            isProfileLoading={false}
            entityTypeOptions={[{ label: 'Private Limited', value: 'pvt' }]}
            statesList={[{ label: 'Kerala', value: 'KL' }]}
            showPanVerify={false}
            isPanVerified={false}
            isVerifyingPan={false}
            onVerifyPan={onVerifyPan}
            documents={['PAN Card', 'Address Proof']}
            vendorBusinesses={[]}
            selectedVendorBusinessId={null}
            onSelectVendorBusiness={vi.fn()}
            {...props}
        />
    );

describe('ServiceProfileForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders all profile fields prefilled from profileValues', () => {
        renderForm();

        [
            'Legal Business Name',
            'PAN',
            'Entity Type',
            'State of Registration',
            'Name',
            'Email',
            'Phone number',
        ].forEach(label => expect(screen.getByText(label)).toBeInTheDocument());
        expect(screen.getByDisplayValue('Peko Technologies')).toBeInTheDocument();
        expect(screen.getByDisplayValue('ABCDE1234F')).toBeInTheDocument();
        expect(screen.getByDisplayValue('joseph@example.com')).toBeInTheDocument();
        expect(screen.getByDisplayValue('9876543210')).toBeInTheDocument();
        expect(screen.getByText('Select Entity Type')).toBeInTheDocument();
        expect(screen.getByText('Select State of Registration')).toBeInTheDocument();
    });

    it('renders the required documents list', () => {
        renderForm();

        expect(screen.getByText('Required documents')).toBeInTheDocument();
        expect(screen.getByText('PAN Card')).toBeInTheDocument();
        expect(screen.getByText('Address Proof')).toBeInTheDocument();
    });

    it('shows a skeleton instead of fields while the profile is loading', () => {
        const { container } = renderForm({ isProfileLoading: true });

        expect(container.querySelector('.ant-skeleton')).not.toBeNull();
        expect(screen.queryByText('Legal Business Name')).not.toBeInTheDocument();
        // Documents are still listed while loading
        expect(screen.getByText('PAN Card')).toBeInTheDocument();
    });

    it('forwards field edits to onFieldChange with the field key', () => {
        renderForm();

        fireEvent.change(screen.getByDisplayValue('Peko Technologies'), {
            target: { value: 'New Co' },
        });
        fireEvent.change(screen.getByDisplayValue('joseph@example.com'), {
            target: { value: 'a@b.com' },
        });

        expect(onFieldChange).toHaveBeenCalledWith('legalBusinessName', 'New Co');
        expect(onFieldChange).toHaveBeenCalledWith('email', 'a@b.com');
    });

    it('upper-cases PAN input before calling onPanChange', () => {
        renderForm();

        fireEvent.change(screen.getByDisplayValue('ABCDE1234F'), {
            target: { value: 'abcde9999z' },
        });

        expect(onPanChange).toHaveBeenCalledWith('ABCDE9999Z');
        expect(onFieldChange).not.toHaveBeenCalled();
    });

    it('renders field errors inline', () => {
        renderForm({ fieldErrors: { pan: 'Invalid PAN', email: 'Invalid email' } });

        expect(screen.getByText('Invalid PAN')).toBeInTheDocument();
        expect(screen.getByText('Invalid email')).toBeInTheDocument();
    });

    it('hides the PAN Verify button when showPanVerify is false', () => {
        renderForm();

        expect(screen.queryByRole('button', { name: /Verify/ })).not.toBeInTheDocument();
    });

    it('shows a Verify button that calls onVerifyPan when PAN is not yet verified', () => {
        renderForm({ showPanVerify: true });

        fireEvent.click(screen.getByRole('button', { name: /Verify/ }));

        expect(onVerifyPan).toHaveBeenCalledTimes(1);
    });

    it('shows the Verify button in a loading state while verifying', () => {
        renderForm({ showPanVerify: true, isVerifyingPan: true });

        expect(screen.getByRole('button', { name: /Verify/ })).toHaveClass('ant-btn-loading');
    });

    it('shows a check icon instead of Verify once PAN is verified', () => {
        const { container } = renderForm({ showPanVerify: true, isPanVerified: true });

        expect(screen.queryByRole('button', { name: /Verify/ })).not.toBeInTheDocument();
        expect(container.querySelector('.anticon-check-circle')).not.toBeNull();
    });
});
