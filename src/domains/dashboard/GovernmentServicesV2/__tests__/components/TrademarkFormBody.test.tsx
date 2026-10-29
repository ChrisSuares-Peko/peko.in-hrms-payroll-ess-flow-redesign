import { fireEvent, render, screen } from '@testing-library/react';
import { RcFile } from 'antd/es/upload';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { VendorBusiness } from '../../apis';
import TrademarkFormBody from '../../components/TrademarkFormBody';
import useTrademarkFormActions from '../../hooks/useTrademarkFormActions';
import { ApplicantDetailsValues, Service } from '../../types';
import { EMPTY_VALUES } from '../../utils/trademarkForm';

// First renders are slow when the suite runs under parallel load.
vi.setConfig({ testTimeout: 30000 });

vi.mock('../../hooks/useTrademarkFormActions', () => ({
    default: vi.fn(),
}));

vi.mock('../../components/RelationshipManagerCard', () => ({
    default: ({ engagementId }: { engagementId: string | null }) => <div data-testid="rm-card">{engagementId}</div>,
}));

vi.mock('../../components/SimilarTrademarksModal', () => ({
    default: ({
        open,
        onClose,
        searchTerm,
        classFilter,
        onClassFilterChange,
    }: {
        open: boolean;
        onClose: () => void;
        searchTerm: string;
        classFilter: string;
        onClassFilterChange: (value: string) => void;
    }) =>
        open ? (
            <div data-testid="similar-modal">
                <span>{`search:${searchTerm}`}</span>
                <span>{`filter:${classFilter}`}</span>
                <button type="button" onClick={onClose}>
                    Close modal
                </button>
                <button type="button" onClick={() => onClassFilterChange('9')}>
                    Filter class 9
                </button>
            </div>
        ) : null,
}));

vi.mock('../../components/steps/ApplicantDetailsStep', () => ({
    default: ({
        businesses,
        onSelectBusiness,
        isLookingUpPincode,
        onPincodeChange,
    }: {
        businesses: VendorBusiness[];
        onSelectBusiness: (b: VendorBusiness | undefined) => void;
        isLookingUpPincode: boolean;
        onPincodeChange: (value: string) => void;
    }) => (
        <div data-testid="applicant-step">
            <span>{`pincode-loading:${String(isLookingUpPincode)}`}</span>
            <button type="button" onClick={() => onSelectBusiness(businesses[0])}>
                Select owner
            </button>
            <button type="button" onClick={() => onPincodeChange('560001')}>
                Change pincode
            </button>
        </div>
    ),
}));

vi.mock('../../components/steps/TrademarkDetailsStep', () => ({
    default: ({
        onBrandSearch,
        onGoodsOrServiceChange,
        classDescriptions,
        languageOptions,
    }: {
        onBrandSearch: () => void;
        onGoodsOrServiceChange: (value: string) => void;
        classDescriptions: unknown[];
        languageOptions: unknown[];
    }) => (
        <div data-testid="trademark-step">
            <span>{`descriptions:${classDescriptions.length}`}</span>
            <span>{`languages:${languageOptions.length}`}</span>
            <button type="button" onClick={onBrandSearch}>
                Search brand
            </button>
            <button type="button" onClick={() => onGoodsOrServiceChange('clothing')}>
                Change goods
            </button>
        </div>
    ),
}));

vi.mock('../../components/steps/LogoUploadStep', () => ({
    default: ({
        logoFileName,
        onFileSelect,
        onRemove,
    }: {
        logoFileName: string;
        onFileSelect: (file: RcFile) => boolean;
        onRemove: () => void;
    }) => (
        <div data-testid="logo-step">
            <span>{`logo:${logoFileName}`}</span>
            <button type="button" onClick={() => onFileSelect({ name: 'logo.png' } as RcFile)}>
                Pick logo
            </button>
            <button type="button" onClick={onRemove}>
                Remove logo
            </button>
        </div>
    ),
}));

vi.mock('../../components/TrademarkReviewStep', () => ({
    default: ({
        ownerName,
        isPreviewConfirmed,
        onConfirmChange,
        onEdit,
        onBack,
        onSubmit,
    }: {
        ownerName: string;
        isPreviewConfirmed: boolean;
        onConfirmChange: (value: boolean) => void;
        onEdit: (step: number) => void;
        onBack: () => void;
        onSubmit: () => void;
    }) => (
        <div data-testid="review-step">
            <span>{`owner:${ownerName}`}</span>
            <span>{`confirmed:${String(isPreviewConfirmed)}`}</span>
            <button type="button" onClick={() => onConfirmChange(true)}>
                Confirm
            </button>
            <button type="button" onClick={() => onEdit(1)}>
                Edit trademark
            </button>
            <button type="button" onClick={onBack}>
                Review back
            </button>
            <button type="button" onClick={onSubmit}>
                Submit
            </button>
        </div>
    ),
}));

const business: VendorBusiness = {
    application_id: 101,
    business_name: 'Alpha Pvt Ltd',
    constitution: 'Private Limited Company',
    pan: 'AAAAA1111A',
    state: 'Kerala',
};

const service: Service = {
    id: 10,
    serviceId: 100,
    name: 'Trademark Registration',
    slug: 'trademark-registration',
    accessKey: 'govt_trademark_registration',
    description: 'Register your trademark',
    category: 'Registration',
    tab: 'Mandatory',
    duration: '7 days',
    price: 1000,
    govtFee: 'Free',
};

const actions = {
    applyBusinessToValues: vi.fn(),
    handlePincodeChange: vi.fn(),
    isLookingUpPincode: false,
    classDescriptions: [{ class: 9, description: 'Software' }],
    isSearchingGoodsOrService: false,
    handleGoodsOrServiceChange: vi.fn(),
    isSearchingSimilar: false,
    similarTrademarks: [],
    isSimilarModalOpen: false,
    setIsSimilarModalOpen: vi.fn(),
    similarClassFilter: 'all',
    setSimilarClassFilter: vi.fn(),
    handleBrandSearch: vi.fn(),
    isUploadingLogo: false,
    handleLogoFile: vi.fn(() => false),
    removeLogoFile: vi.fn(),
    handleNext: vi.fn(),
    ownerName: 'Alpha Pvt Ltd',
    isSubmittingFiling: false,
    handleSubmitFiling: vi.fn(),
};

const setCurrentStep = vi.fn();
const goBack = vi.fn();
// Held in a variable so jsx-a11y does not treat the component prop as an ARIA role.
const userRole = 'corporate';

const values: ApplicantDetailsValues = { ...EMPTY_VALUES, brand: 'Peko' };

const renderBody = (props: Partial<Parameters<typeof TrademarkFormBody>[0]> = {}) =>
    render(
        <TrademarkFormBody
            values={values}
            setFieldValue={vi.fn()}
            validateForm={vi.fn()}
            setTouched={vi.fn()}
            setErrors={vi.fn()}
            userId={1}
            role={userRole}
            selectedService={service}
            applicationRowId={5}
            applicationNumber="APP-5"
            engagementId="ENG-1"
            businesses={[business]}
            businessOptions={[{ label: business.business_name, value: '101' }]}
            currentStep={0}
            setCurrentStep={setCurrentStep}
            logoFileName=""
            setLogoFileName={vi.fn()}
            lastLookedUpPincode={{ current: '' }}
            languageOptions={[{ label: 'English', value: 'English' }]}
            navigate={vi.fn()}
            goBack={goBack}
            {...props}
        />
    );

describe('TrademarkFormBody', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useTrademarkFormActions as Mock).mockReturnValue({ ...actions });
    });

    it('passes the form props through to useTrademarkFormActions', () => {
        renderBody({ currentStep: 2, logoFileName: 'logo.png' });

        expect(useTrademarkFormActions).toHaveBeenCalledWith(
            expect.objectContaining({
                values,
                userId: 1,
                role: 'corporate',
                selectedService: service,
                applicationRowId: 5,
                applicationNumber: 'APP-5',
                engagementId: 'ENG-1',
                businesses: [business],
                currentStep: 2,
                setCurrentStep,
                logoFileName: 'logo.png',
            })
        );
    });

    it.each([
        [0, 'applicant-step'],
        [1, 'trademark-step'],
        [2, 'logo-step'],
    ])('renders only the matching step for step %i with the RM card and nav buttons', (step, testId) => {
        renderBody({ currentStep: step });

        ['applicant-step', 'trademark-step', 'logo-step'].forEach((id) =>
            id === testId
                ? expect(screen.getByTestId(id)).toBeInTheDocument()
                : expect(screen.queryByTestId(id)).not.toBeInTheDocument()
        );
        expect(screen.queryByTestId('review-step')).not.toBeInTheDocument();
        expect(screen.getByTestId('rm-card')).toHaveTextContent('ENG-1');
        expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
    });

    it('renders the review step without the RM card or nav buttons on step 3', () => {
        renderBody({ currentStep: 3 });

        expect(screen.getByTestId('review-step')).toBeInTheDocument();
        expect(screen.getByText('owner:Alpha Pvt Ltd')).toBeInTheDocument();
        expect(screen.queryByTestId('rm-card')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument();
    });

    it('calls goBack from Back on the first step', () => {
        renderBody({ currentStep: 0 });

        fireEvent.click(screen.getByRole('button', { name: 'Back' }));
        expect(goBack).toHaveBeenCalledTimes(1);
        expect(setCurrentStep).not.toHaveBeenCalled();
    });

    it('steps back one step from Back on later steps', () => {
        renderBody({ currentStep: 2 });

        fireEvent.click(screen.getByRole('button', { name: 'Back' }));
        expect(setCurrentStep).toHaveBeenCalledWith(1);
        expect(goBack).not.toHaveBeenCalled();
    });

    it('delegates Next to handleNext', () => {
        renderBody({ currentStep: 1 });

        fireEvent.click(screen.getByRole('button', { name: 'Next' }));
        expect(actions.handleNext).toHaveBeenCalledTimes(1);
    });

    it('wires the applicant step callbacks to the hook', () => {
        (useTrademarkFormActions as Mock).mockReturnValue({ ...actions, isLookingUpPincode: true });
        renderBody({ currentStep: 0 });

        expect(screen.getByText('pincode-loading:true')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Select owner' }));
        expect(actions.applyBusinessToValues).toHaveBeenCalledWith(business);
        fireEvent.click(screen.getByRole('button', { name: 'Change pincode' }));
        expect(actions.handlePincodeChange).toHaveBeenCalledWith('560001');
    });

    it('wires the trademark step callbacks and data to the hook', () => {
        renderBody({ currentStep: 1 });

        expect(screen.getByText('descriptions:1')).toBeInTheDocument();
        expect(screen.getByText('languages:1')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Search brand' }));
        expect(actions.handleBrandSearch).toHaveBeenCalledTimes(1);
        fireEvent.click(screen.getByRole('button', { name: 'Change goods' }));
        expect(actions.handleGoodsOrServiceChange).toHaveBeenCalledWith('clothing');
    });

    it('wires the logo step callbacks to the hook', () => {
        renderBody({ currentStep: 2, logoFileName: 'logo.png' });

        expect(screen.getByText('logo:logo.png')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Pick logo' }));
        expect(actions.handleLogoFile).toHaveBeenCalledWith({ name: 'logo.png' });
        fireEvent.click(screen.getByRole('button', { name: 'Remove logo' }));
        expect(actions.removeLogoFile).toHaveBeenCalledTimes(1);
    });

    it('tracks preview confirmation and resets it when editing a section', () => {
        renderBody({ currentStep: 3 });

        expect(screen.getByText('confirmed:false')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
        expect(screen.getByText('confirmed:true')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Edit trademark' }));
        expect(setCurrentStep).toHaveBeenCalledWith(1);
        expect(screen.getByText('confirmed:false')).toBeInTheDocument();
    });

    it('goes back a step and submits from the review step', () => {
        renderBody({ currentStep: 3 });

        fireEvent.click(screen.getByRole('button', { name: 'Review back' }));
        expect(setCurrentStep).toHaveBeenCalledWith(2);
        fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
        expect(actions.handleSubmitFiling).toHaveBeenCalledTimes(1);
    });

    it('keeps the similar trademarks modal closed until the hook opens it', () => {
        renderBody();

        expect(screen.queryByTestId('similar-modal')).not.toBeInTheDocument();
    });

    it('opens the similar trademarks modal with the brand and wires its callbacks', () => {
        (useTrademarkFormActions as Mock).mockReturnValue({ ...actions, isSimilarModalOpen: true });
        renderBody({ currentStep: 1 });

        expect(screen.getByText('search:Peko')).toBeInTheDocument();
        expect(screen.getByText('filter:all')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Close modal' }));
        expect(actions.setIsSimilarModalOpen).toHaveBeenCalledWith(false);
        fireEvent.click(screen.getByRole('button', { name: 'Filter class 9' }));
        expect(actions.setSimilarClassFilter).toHaveBeenCalledWith('9');
    });
});
