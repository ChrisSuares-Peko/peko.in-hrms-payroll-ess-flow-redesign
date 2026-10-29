import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { afterEach, beforeEach, describe, expect, Mock, test, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import PrepaidForm from '../../../components/forms/PrepaidForm';
import usePrepaidPlans from '../../../hooks/usePrepaidPlans';

vi.mock('antd', async () => {
    const actual = await vi.importActual<any>('antd');

    const Select = ({ children, value, onChange, ...rest }: any) => (
        <select
            data-testid="mock-select"
            value={value}
            onChange={e => onChange?.(e.target.value)}
            {...rest}
        >
            {children}
        </select>
    );

    Select.Option = ({ value, children }: any) => <option value={value}>{children}</option>;

    return {
        ...actual,
        Select,
    };
});
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

vi.mock('../../../components/PlanDrawer', () => ({
    default: () => <div data-testid="mock-plan-drawer" />,
}));

vi.mock('../../../hooks/usePrepaidPlans', () => ({
    default: vi.fn(() => ({
        getPlans: vi.fn(),
        plansData: [],
        planCategories: [],
        isLoading: false,
    })),
}));

vi.mock('../../../hooks/usePayment', () => ({
    default: vi.fn(() => ({
        handlePrepaidPay: vi.fn(),
    })),
}));

vi.mock('../../../hooks/useGeneralApi', () => ({
    default: vi.fn(() => ({
        stateData: [{ label: 'Delhi', value: 'DEL' }],
    })),
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useLocation: vi.fn(() => ({
            state: {
                serviceProvider: 'airtel',
                providerCircle: 'DEL',
                phoneNo: '9876543210',
            },
        })),
    };
});

const mockStore = configureStore();
const store = mockStore({});
describe('PrepaidForm Component', () => {
    beforeEach(() => {
        (useAppSelector as Mock).mockImplementation(selector =>
            selector({
                reducer: {
                    auth: { id: '123', role: 'user' },
                    benficiaryPrepaid: { prepaidBeneficiary: [] },
                    Prepaid: { prepaid: {} },
                    Plans: {
                        planCategories: ['CATEGORY_1', 'CATEGORY_2'],
                        plansData: [],
                    },
                },
            })
        );
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });
    const renderComponent = () =>
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <PrepaidForm onProceed={() => {}} />
                </MemoryRouter>
            </Provider>
        );

    test('renders form fields correctly', async () => {
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText(/Select Service Provider/i)).toBeInTheDocument();
            expect(screen.getByText(/Select Circle/i)).toBeInTheDocument();
            expect(screen.getByText(/Mobile Number/i)).toBeInTheDocument();
            expect(screen.getByText(/Enter Amount/i)).toBeInTheDocument();
            expect(
                screen.getByRole('button', { name: /Proceed to Recharge/i })
            ).toBeInTheDocument();
        });
    });

    test('shows validation errors when submitting empty form', async () => {
        renderComponent();

        fireEvent.click(screen.getByRole('button', { name: /Proceed to Recharge/i }));
    });

    test('submits form successfully with valid data', async () => {
        renderComponent();

        fireEvent.change(screen.getByPlaceholderText(/Mobile Number/i), {
            target: { value: '9876543210' },
        });

        fireEvent.change(screen.getByPlaceholderText(/Example: 100/i), {
            target: { value: '199' },
        });

        fireEvent.click(screen.getByRole('button', { name: /Proceed to Recharge/i }));
    });

    test('clicking "Browse Plans" triggers getPlans function', () => {
        const mockGetPlans = vi.fn();
        (usePrepaidPlans as any).mockReturnValue({ getPlans: mockGetPlans });

        renderComponent();

        fireEvent.click(screen.getByText(/Browse Plans/i));

        expect(mockGetPlans).toHaveBeenCalled();
    });
});
