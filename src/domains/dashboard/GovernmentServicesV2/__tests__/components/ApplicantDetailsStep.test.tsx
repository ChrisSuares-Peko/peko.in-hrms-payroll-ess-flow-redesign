import { fireEvent, render, screen } from '@testing-library/react';
import { Formik } from 'formik';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { VendorBusiness } from '../../apis';
import ApplicantDetailsStep from '../../components/steps/ApplicantDetailsStep';
import { ApplicantDetailsValues } from '../../types';
import { EMPTY_VALUES } from '../../utils/trademarkForm';

// antd Select interactions are slow when the suite runs under parallel load.
vi.setConfig({ testTimeout: 30000 });

const businesses: VendorBusiness[] = [
    { application_id: 101, business_name: 'Alpha Pvt Ltd', constitution: 'Private Limited Company', pan: 'AAAAA1111A', state: 'Kerala' },
    { application_id: 202, business_name: 'Beta LLP', constitution: 'Limited Liability Partnership', pan: 'BBBBB2222B', state: 'Goa' },
];

const businessOptions = [
    ...businesses.map((b) => ({ label: b.business_name, value: String(b.application_id) })),
    { label: 'Ghost Co', value: '999' },
];

const onSelectBusiness = vi.fn();
const onPincodeChange = vi.fn();

const renderStep = (
    values: Partial<ApplicantDetailsValues> = {},
    props: Partial<Parameters<typeof ApplicantDetailsStep>[0]> = {}
) =>
    render(
        <Formik initialValues={{ ...EMPTY_VALUES, ...values }} onSubmit={vi.fn()}>
            <ApplicantDetailsStep
                businessOptions={businessOptions}
                businesses={businesses}
                onSelectBusiness={onSelectBusiness}
                isLookingUpPincode={false}
                onPincodeChange={onPincodeChange}
                {...props}
            />
        </Formik>
    );

const selectRoot = (id: string) => document.getElementById(id)!.closest('.ant-select') as HTMLElement;

const openSelect = (id: string) => {
    fireEvent.mouseDown(selectRoot(id).querySelector('.ant-select-selector')!);
};

const pickOption = (label: string) => {
    const option = document.querySelector(`.ant-select-item-option[title="${label}"]`);
    fireEvent.click(option!);
};

describe('ApplicantDetailsStep', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders every applicant field', () => {
        renderStep();

        ['Trademark Owner', 'Entity Type', 'Salutation', 'Authorized Person', 'Address', 'PIN code', 'State', 'District', 'Country'].forEach(
            (label) => expect(screen.getByText(label)).toBeInTheDocument()
        );
    });

    it('prefills text inputs and selects from Formik values', () => {
        renderStep({
            trademarkOwner: '101',
            entityType: 'Proprietorship',
            salutation: 'M/s.',
            authorizedPerson: 'Jane Doe',
            address: '12 MG Road',
            pincode: '560001',
            state: 'Karnataka',
            district: 'Bengaluru Urban',
            country: 'India',
        });

        expect(screen.getByPlaceholderText('Enter the authorized person')).toHaveValue('Jane Doe');
        expect(screen.getByPlaceholderText('Enter the address')).toHaveValue('12 MG Road');
        expect(screen.getByPlaceholderText('Enter the PIN code')).toHaveValue('560001');
        expect(screen.getByPlaceholderText('Enter the state')).toHaveValue('Karnataka');
        expect(screen.getByPlaceholderText('Enter the district')).toHaveValue('Bengaluru Urban');
        expect(screen.getByPlaceholderText('Enter the country')).toHaveValue('India');
        expect(selectRoot('trademarkOwner')).toHaveTextContent('Alpha Pvt Ltd');
        expect(selectRoot('entityType')).toHaveTextContent('Proprietorship');
        expect(selectRoot('salutation')).toHaveTextContent('M/s.');
    });

    it('does not show a value for an owner that is not in the options', () => {
        renderStep({ trademarkOwner: '12345' });

        expect(selectRoot('trademarkOwner')).toHaveTextContent('Select the business');
    });

    it('resolves the selected owner to its business and re-resolves on re-selection', () => {
        renderStep();

        openSelect('trademarkOwner');
        pickOption('Alpha Pvt Ltd');
        expect(onSelectBusiness).toHaveBeenLastCalledWith(businesses[0]);
        expect(selectRoot('trademarkOwner')).toHaveTextContent('Alpha Pvt Ltd');

        openSelect('trademarkOwner');
        pickOption('Beta LLP');
        expect(onSelectBusiness).toHaveBeenLastCalledWith(businesses[1]);
        expect(onSelectBusiness).toHaveBeenCalledTimes(2);
        expect(selectRoot('trademarkOwner')).toHaveTextContent('Beta LLP');
    });

    it('passes undefined when the selected option has no matching business', () => {
        renderStep();

        openSelect('trademarkOwner');
        pickOption('Ghost Co');
        expect(onSelectBusiness).toHaveBeenCalledWith(undefined);
    });

    it('offers the fixed entity type and salutation lists', () => {
        renderStep();

        openSelect('salutation');
        ['Mr.', 'Mrs.', 'Ms.', 'M/s.'].forEach((label) =>
            expect(document.querySelector(`.ant-select-item-option[title="${label}"]`)).toBeInTheDocument()
        );
        pickOption('Mrs.');
        expect(selectRoot('salutation')).toHaveTextContent('Mrs.');

        openSelect('entityType');
        pickOption('Private Limited Company');
        expect(selectRoot('entityType')).toHaveTextContent('Private Limited Company');
    });

    it('reports PIN code changes and keeps the typed value', () => {
        renderStep();

        const pincode = screen.getByPlaceholderText('Enter the PIN code');
        fireEvent.change(pincode, { target: { value: '682001' } });

        expect(onPincodeChange).toHaveBeenCalledWith('682001');
        expect(pincode).toHaveValue('682001');
    });

    it('shows a spinner on the PIN code field only while looking up', () => {
        const { unmount } = renderStep();
        const wrapper = () => screen.getByPlaceholderText('Enter the PIN code').closest('.ant-input-affix-wrapper');
        expect(wrapper()?.querySelector('.ant-spin') ?? null).toBeNull();
        unmount();

        renderStep({}, { isLookingUpPincode: true });
        expect(wrapper()?.querySelector('.ant-spin')).toBeInTheDocument();
    });
});
