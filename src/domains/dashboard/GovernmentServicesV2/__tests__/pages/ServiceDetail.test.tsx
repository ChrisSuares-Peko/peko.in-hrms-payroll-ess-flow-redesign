import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import useGovtServicePayment from '../../hooks/useGovtServicePayment';
import useServiceDetailActions from '../../hooks/useServiceDetailActions';
import useServiceDetailData from '../../hooks/useServiceDetailData';
import ServiceDetail from '../../pages/ServiceDetail';
import { Service } from '../../types';

vi.mock('../../hooks/useServiceDetailData', () => ({ default: vi.fn() }));
vi.mock('../../hooks/useServiceDetailActions', () => ({ default: vi.fn() }));
vi.mock('../../hooks/useGovtServicePayment', () => ({ default: vi.fn() }));

vi.mock('../../components/ServiceProfileForm', () => ({
    default: (props: {
        onFieldChange: (field: string, value: string) => void;
        onVerifyPan: () => void;
        showPanVerify: boolean;
        isPanVerified: boolean;
    }) => (
        <div data-testid="profile-form">
            <span>{props.showPanVerify ? 'pan-verify-shown' : 'pan-verify-hidden'}</span>
            <span>{props.isPanVerified ? 'pan-verified' : 'pan-unverified'}</span>
            <button type="button" onClick={() => props.onFieldChange('legalBusinessName', 'New Name')}>
                change-field
            </button>
            <button type="button" onClick={props.onVerifyPan}>
                verify-pan
            </button>
        </div>
    ),
}));

vi.mock('../../components/ServicePricingPanel', () => ({
    default: (props: { totalAmount: number; onContinue: () => void; isApplying: boolean }) => (
        <div data-testid="pricing-panel">
            <span>total:{props.totalAmount}</span>
            <span>{props.isApplying ? 'applying' : 'idle'}</span>
            <button type="button" onClick={props.onContinue}>
                continue
            </button>
        </div>
    ),
}));

const mockService: Service = {
    id: 10,
    serviceId: 100,
    name: 'Trademark Registration',
    slug: 'trademark-registration',
    accessKey: 'govt_trademark_registration',
    description: 'Register your trademark',
    category: 'Registration',
    tab: 'Mandatory',
    duration: '7 days',
    price: 5000,
    govtFee: 4500,
};

const setProfileValues = vi.fn();
const handleContinue = vi.fn();
const handleVerifyPan = vi.fn();
const proceedToPayment = vi.fn();

const dataValue = (overrides: Record<string, unknown> = {}) => ({
    userId: 42,
    role: 'user',
    dispatch: vi.fn(),
    selectedService: mockService,
    isFetching: false,
    resumeExisting: false,
    hasCheckedDraft: true,
    isVendorCatalogService: true,
    documents: [],
    statesList: [],
    isProfileLoading: false,
    profileValues: { legalBusinessName: 'Old Name' },
    setProfileValues,
    fieldErrors: {},
    setFieldErrors: vi.fn(),
    verifiedPan: null,
    setVerifiedPan: vi.fn(),
    isPanPrefilled: false,
    setIsPanPrefilled: vi.fn(),
    vendorBusinesses: [],
    selectedVendorBusinessId: undefined,
    handleSelectVendorBusiness: vi.fn(),
    ...overrides,
});

// antd's first render is slow on a cold, parallel run — the 5s default flakes.
vi.setConfig({ testTimeout: 30000 });

describe('ServiceDetail', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useServiceDetailData as Mock).mockReturnValue(dataValue());
        (useGovtServicePayment as Mock).mockReturnValue({
            variants: [],
            selectedVariantId: null,
            setSelectedVariantId: vi.fn(),
            selectedVariant: null,
            govFee: 4500,
            pekoFee: 500,
            totalAmount: 5000,
            isPricingLoading: false,
            proceedToPayment,
            isProceeding: false,
        });
        (useServiceDetailActions as Mock).mockReturnValue({
            isVerifyingPan: false,
            isPanVerified: true,
            showPanVerify: true,
            handleVerifyPan,
            onPanChange: vi.fn(),
            isApplying: false,
            handleContinue,
        });
    });

    it('shows a skeleton while the service is fetching', () => {
        (useServiceDetailData as Mock).mockReturnValue(dataValue({ isFetching: true }));

        const { container } = render(<ServiceDetail />);

        expect(container.querySelector('.ant-skeleton')).toBeInTheDocument();
        expect(screen.queryByTestId('profile-form')).not.toBeInTheDocument();
    });

    it('holds the skeleton until the resume-existing draft check finishes', () => {
        (useServiceDetailData as Mock).mockReturnValue(dataValue({ resumeExisting: true, hasCheckedDraft: false }));

        const { container } = render(<ServiceDetail />);

        expect(container.querySelector('.ant-skeleton')).toBeInTheDocument();
    });

    it('renders the page once the resume-existing draft check has finished', () => {
        (useServiceDetailData as Mock).mockReturnValue(dataValue({ resumeExisting: true, hasCheckedDraft: true }));

        render(<ServiceDetail />);

        expect(screen.getByTestId('profile-form')).toBeInTheDocument();
    });

    it('renders nothing when no service is selected', () => {
        (useServiceDetailData as Mock).mockReturnValue(dataValue({ selectedService: null }));

        const { container } = render(<ServiceDetail />);

        expect(container).toBeEmptyDOMElement();
    });

    it('renders the service header, profile form and pricing panel', () => {
        render(<ServiceDetail />);

        expect(screen.getByRole('heading', { name: 'Trademark Registration' })).toBeInTheDocument();
        expect(screen.getByText('Register your trademark')).toBeInTheDocument();
        expect(screen.getByTestId('profile-form')).toBeInTheDocument();
        expect(screen.getByText('pan-verify-shown')).toBeInTheDocument();
        expect(screen.getByText('pan-verified')).toBeInTheDocument();
        expect(screen.getByText('total:5000')).toBeInTheDocument();
    });

    it('passes data and payment state into useServiceDetailActions', () => {
        render(<ServiceDetail />);

        expect(useGovtServicePayment).toHaveBeenCalledWith({ selectedService: mockService });
        expect(useServiceDetailActions).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: 42,
                role: 'user',
                selectedService: mockService,
                isVendorCatalogService: true,
                totalAmount: 5000,
                proceedToPayment,
                setProfileValues,
            })
        );
    });

    it('updates a single profile field via the functional setter', () => {
        render(<ServiceDetail />);

        fireEvent.click(screen.getByRole('button', { name: 'change-field' }));

        expect(setProfileValues).toHaveBeenCalledTimes(1);
        const updater = setProfileValues.mock.calls[0][0] as (prev: object) => object;
        expect(updater({ legalBusinessName: 'Old Name', pan: 'ABCDE1234F' })).toEqual({
            legalBusinessName: 'New Name',
            pan: 'ABCDE1234F',
        });
    });

    it('wires Continue and Verify PAN to the action handlers', () => {
        render(<ServiceDetail />);

        fireEvent.click(screen.getByRole('button', { name: 'continue' }));
        fireEvent.click(screen.getByRole('button', { name: 'verify-pan' }));

        expect(handleContinue).toHaveBeenCalledTimes(1);
        expect(handleVerifyPan).toHaveBeenCalledTimes(1);
    });
});
