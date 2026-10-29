import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { showToast } from '@src/slices/apiSlice';
import { accessKeys } from '@utils/accessKeys';

import Prepaid from '../../pages/Prepaid';
import { MobilePlan, PrepaidFormData } from '../../types';

const mocks = vi.hoisted(() => ({
    dispatch: vi.fn(),
    addBeneficiaryApi: vi.fn(),
    proceedValues: { current: {} as PrepaidFormData },
}));

const plan: MobilePlan = {
    Amount: 10,
    Description: 'Talktime : Rs 7.47',
    LocationName: 'Mumbai',
    PlanName: 'Others',
    ServiceId: 1,
    ServiceProviderId: 1,
    ServiceProviderName: 'Airtel',
    Talktime: 7.47,
    Validity: 'NA',
};

vi.stubGlobal('Moengage', undefined);

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => mocks.dispatch,
    useAppSelector: (selector: (state: unknown) => unknown) =>
        selector({
            reducer: {
                auth: { role: 'corporate', id: 42 },
                beneficiary: { refresh: false },
                benficiaryPrepaid: { prepaidBeneficiary: {} },
            },
        }),
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return { ...actual, useLocation: () => ({ state: null }) };
});

vi.mock('../../api/index', () => ({
    AddBeneficiaryApi: mocks.addBeneficiaryApi,
    getPrepaidPlans: vi.fn(),
}));

vi.mock('../../components/BeneficiariesList', () => ({
    default: () => <div data-testid="beneficiaries" />,
}));

vi.mock('../../components/forms/PrepaidForm', () => ({
    default: ({ onProceed }: { onProceed: (...args: unknown[]) => unknown }) => (
        <button
            type="button"
            onClick={() => onProceed(mocks.proceedValues.current, [plan], ['Others'])}
        >
            Proceed
        </button>
    ),
}));

vi.mock('../../hooks/useGeneralApi', () => ({ default: () => ({ stateData: [] }) }));
vi.mock('../../hooks/usePayment', () => ({ default: () => ({ handlePrepaidPay: vi.fn() }) }));
vi.mock('../../hooks/useValidateRecharge', () => ({
    default: () => ({ validateRecharge: vi.fn() }),
}));

const formValues = (saveToBeneficiaries: boolean): PrepaidFormData => ({
    mobileNumber: '8820490416',
    serviceProvider: 'AIRTEL',
    circle: 'MUM',
    providerLabel: 'Airtel',
    circleLabel: 'Mumbai',
    saveToBeneficiaries,
    beneficiaryName: saveToBeneficiaries ? 'Milind Kumar' : '',
});

const savedToast = showToast({ description: 'Saved to beneficiaries', variant: 'success' });

const clickProceed = () =>
    act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Proceed' }));
    });

describe('Prepaid — saving the number to beneficiaries on Proceed', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.proceedValues.current = formValues(true);
    });

    it('stays on the form when the beneficiary cannot be saved, so the error shows there', async () => {
        mocks.addBeneficiaryApi.mockResolvedValue(false);
        render(<Prepaid />);

        await clickProceed();

        expect(mocks.addBeneficiaryApi).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('button', { name: 'Proceed' })).toBeInTheDocument();
        expect(screen.queryByText('Available plans')).not.toBeInTheDocument();
        expect(mocks.dispatch).not.toHaveBeenCalledWith(savedToast);
    });

    it('does not show the plans until the save has succeeded', async () => {
        let resolveSave: (value: unknown) => void = () => {};
        mocks.addBeneficiaryApi.mockReturnValue(
            new Promise(resolve => {
                resolveSave = resolve;
            })
        );
        render(<Prepaid />);

        await clickProceed();
        expect(screen.queryByText('Available plans')).not.toBeInTheDocument();

        await act(async () => {
            resolveSave({ status: true, message: 'Beneficiary added successfully' });
        });

        expect(screen.getByText('Available plans')).toBeInTheDocument();
        expect(mocks.dispatch).toHaveBeenCalledWith(savedToast);
    });

    it('saves the number as a prepaid beneficiary under the given name', async () => {
        mocks.addBeneficiaryApi.mockResolvedValue({ status: true });
        render(<Prepaid />);

        await clickProceed();

        expect(mocks.addBeneficiaryApi).toHaveBeenCalledWith(
            expect.objectContaining({
                accessKey: accessKeys.prepaid,
                name: 'Milind Kumar',
                phoneNo: '8820490416',
                serviceProvider: 'AIRTEL',
                providerCircle: 'MUM',
            })
        );
    });

    it('goes straight to the plans without saving when the box is unchecked', async () => {
        mocks.proceedValues.current = formValues(false);
        render(<Prepaid />);

        await clickProceed();

        expect(mocks.addBeneficiaryApi).not.toHaveBeenCalled();
        expect(screen.getByText('Available plans')).toBeInTheDocument();
    });
});
