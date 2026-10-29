import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import TravellerDetails from '../../pages/TravellerDetails';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: (selector: any) =>
        selector({
            reducer: {
                auth: { role: 'user', id: 1 },
                basicInfo: { data: { city: 'Mumbai', state: 'Maharashtra', country: 'India' } },
            },
        }),
    useAppDispatch: () => vi.fn(),
}));

vi.mock('@domains/dashboard/profile/api/basicInfo', () => ({
    getBasicInfo: vi.fn().mockResolvedValue(false),
}));

vi.mock('@domains/dashboard/profile/slices/basicInfo', () => ({
    setData: vi.fn(payload => ({ type: 'basicInfo/setData', payload })),
}));

vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
    useLocation: () => ({
        state: {
            visa: { name: 'Dubai Tourist Visa 30 Days', price: 970 },
            travellers: { adults: 1, children: 0, infants: 0 },
        },
    }),
}));

vi.mock('@src/routes/paths', () => ({
    paths: { visa: { index: 'visa', visaPayment: 'payment' } },
}));

vi.mock('../../hooks/useVisaApi', () => ({
    useStageVisaDocuments: () => ({ stageDocuments: vi.fn().mockResolvedValue([]), isLoading: false }),
    useVisaProductDocumentsForUpload: () => ({ documents: [], isLoading: false }),
    useVisaSearch: () => ({
        visaOptions: [],
        isLoading: false,
        selectProduct: vi.fn(),
        supportsChild: false,
        supportsInfant: false,
        adultAgeLabel: '12+ years',
        childAgeLabel: '2–11 years',
        infantAgeLabel: '0–2 years',
    }),
}));

vi.mock('@domains/dashboard/airline/hooks/useGetCountries', () => ({
    default: () => ({ countries: [], isLoading: false }),
}));

vi.mock('@components/atomic/inputs/TextInput', () => ({
    default: ({ label }: any) => <div data-testid="text-input">{label}</div>,
}));

vi.mock('@components/atomic/inputs/DatePickerInput', () => ({
    default: ({ label }: any) => <div data-testid="date-picker-input">{label}</div>,
}));

vi.mock('@components/atomic/inputs/SelectInput', () => ({
    default: ({ label }: any) => <div data-testid="select-input">{label}</div>,
}));

vi.mock('@components/atomic/inputs/SelectInputWithSearch', () => ({
    default: ({ label }: any) => <div data-testid="select-input-search">{label}</div>,
}));

vi.mock('@components/atomic/inputs/RadioGroupInput', () => ({
    default: ({ label }: any) => <div data-testid="radio-input">{label}</div>,
}));

vi.mock('@components/atomic/inputs/FileUploadInput', () => ({
    default: ({ label }: any) => <div data-testid="file-upload">{label}</div>,
}));

describe('TravellerDetails Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render without crashing', () => {
        render(<TravellerDetails />);
        expect(screen.getByText('Traveller Details')).toBeInTheDocument();
    });

    it('should render the step indicators', () => {
        render(<TravellerDetails />);
        expect(screen.getByText('Select Visa')).toBeInTheDocument();
        expect(screen.getByText('Review & Pay')).toBeInTheDocument();
    });

    it('should render form fields for traveller info', () => {
        render(<TravellerDetails />);
        expect(screen.getAllByTestId('text-input').length).toBeGreaterThan(0);
    });
});
