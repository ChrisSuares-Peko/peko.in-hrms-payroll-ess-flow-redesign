import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { paths } from '@src/routes/paths';

import useTrademarkApplicationData from '../../hooks/useTrademarkApplicationData';
import TrademarkRegistrationForm from '../../pages/TrademarkRegistrationForm';
import { ApplicantDetailsValues, Service } from '../../types';
import { EMPTY_VALUES, STEP_TITLES } from '../../utils/trademarkForm';

const mockFormBody = vi.fn();

vi.mock('../../hooks/useTrademarkApplicationData', () => ({ default: vi.fn() }));

// TrademarkFormBody owns useTrademarkFormActions — stubbed so this test only covers the page shell.
vi.mock('../../components/TrademarkFormBody', () => ({
    default: (props: { values: ApplicantDetailsValues; currentStep: number }) => {
        mockFormBody(props);
        return <div data-testid="form-body">brand:{props.values.brand}</div>;
    },
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

const mockNavigate = vi.fn();
const goBack = vi.fn();
const setCurrentStep = vi.fn();

const dataValue = (overrides: Record<string, unknown> = {}) => ({
    userId: 42,
    role: 'user',
    selectedService: mockService,
    isFetchingService: false,
    businesses: [
        { application_id: 555, business_name: 'Peko Pvt Ltd' },
        { application_id: 'APP-2', business_name: 'Other Co' },
    ],
    isLoadingBusinesses: false,
    currentStep: 0,
    setCurrentStep,
    logoFileName: null,
    setLogoFileName: vi.fn(),
    languageOptions: [],
    lastLookedUpPincode: { current: null },
    applicationNumber: 'TM-1',
    engagementId: 'ENG-1',
    applicationRowId: 7,
    initialValues: { ...EMPTY_VALUES, brand: 'Peko' },
    goBack,
    navigate: mockNavigate,
    ...overrides,
});

// antd's first render is slow on a cold, parallel run — the 5s default flakes.
vi.setConfig({ testTimeout: 30000 });

describe('TrademarkRegistrationForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useTrademarkApplicationData as Mock).mockReturnValue(dataValue());
    });

    it('shows a skeleton while the service is fetching', () => {
        (useTrademarkApplicationData as Mock).mockReturnValue(dataValue({ isFetchingService: true }));

        const { container } = render(<TrademarkRegistrationForm />);

        expect(container.querySelector('.ant-skeleton')).toBeInTheDocument();
        expect(screen.queryByTestId('form-body')).not.toBeInTheDocument();
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('redirects to explore when there is no selected service', () => {
        (useTrademarkApplicationData as Mock).mockReturnValue(dataValue({ selectedService: null }));

        const { container } = render(<TrademarkRegistrationForm />);

        expect(container).toBeEmptyDOMElement();
        expect(mockNavigate).toHaveBeenCalledWith(`${paths.dashboard.governmentServices}/explore`);
    });

    it('shows a skeleton while businesses are loading', () => {
        (useTrademarkApplicationData as Mock).mockReturnValue(dataValue({ isLoadingBusinesses: true }));

        const { container } = render(<TrademarkRegistrationForm />);

        expect(container.querySelector('.ant-skeleton')).toBeInTheDocument();
        expect(screen.queryByTestId('form-body')).not.toBeInTheDocument();
    });

    it('renders the title, step label and step progress for the first step', () => {
        render(<TrademarkRegistrationForm />);

        expect(screen.getByRole('heading', { name: 'Trademark Registration - Application' })).toBeInTheDocument();
        expect(screen.getByText(`Step 1 of ${STEP_TITLES.length}: Applicant Details`)).toBeInTheDocument();
        STEP_TITLES.forEach((title) => {
            expect(screen.getAllByText(title, { exact: false }).length).toBeGreaterThan(0);
        });
    });

    it('reflects the current step in the step label', () => {
        (useTrademarkApplicationData as Mock).mockReturnValue(dataValue({ currentStep: 3 }));

        render(<TrademarkRegistrationForm />);

        expect(screen.getByText(`Step 4 of ${STEP_TITLES.length}: Preview`)).toBeInTheDocument();
    });

    it('seeds Formik with the initial values and passes page data to the form body', () => {
        render(<TrademarkRegistrationForm />);

        expect(screen.getByTestId('form-body')).toHaveTextContent('brand:Peko');
        expect(mockFormBody).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: 42,
                role: 'user',
                selectedService: mockService,
                applicationRowId: 7,
                applicationNumber: 'TM-1',
                engagementId: 'ENG-1',
                currentStep: 0,
                setCurrentStep,
                navigate: mockNavigate,
                goBack,
                businessOptions: [
                    { label: 'Peko Pvt Ltd', value: '555' },
                    { label: 'Other Co', value: 'APP-2' },
                ],
            })
        );
    });
});
