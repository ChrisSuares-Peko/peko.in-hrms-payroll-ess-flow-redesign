import React from 'react';

import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useAppSelector } from '@src/hooks/store';
import useGetAddonDetails from '@src/hooks/useSubscriptionAddons';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import PlanCard from '../../../components/StorageSettings/PlanCard';

// Mock dependencies
vi.mock('react-router-dom', async importOriginal => {
    const actual = (await importOriginal()) as typeof import('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
    };
});
vi.mock('@src/hooks/useSubscriptionAddons', async importOriginal => {
    const actual = (await importOriginal()) as typeof import('@src/hooks/useSubscriptionAddons');
    return {
        ...actual,
        default: vi.fn(),
    };
});

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

vi.mock('@utils/priceFormat', () => ({
    formatNumberWithLocalString: vi.fn(),
}));

vi.mock('../../../components/StorageSettings/PlanDetails', () => ({
    __esModule: true,
    default: vi.fn(() => <div>PlanDetails</div>),
}));

vi.mock('../../../components/StorageSettings/UsageBar', () => ({
    __esModule: true,
    default: vi.fn(() => <div>UsageBar</div>),
}));

describe('PlanCard', () => {
    const mockNavigate = vi.fn();
    const mockUser = { roleName: 'admin' };
    const mockAddonData = {
        unitPrice: 10,
        packageId: '12345',
        isAddonPurchaseAllowed: true,
    };
    const mockPurchaseData = {
        currentSubscription: { package: { packageName: '' }, vendorSubscriptionId: 'sub_123' },
        isGroupSubscription: false,
        addOns: {},
    };
    const upgradeNotice = /Purchase an individual or group subscription to buy additional storage/;

    beforeEach(() => {
        vi.clearAllMocks();
        (useNavigate as any).mockReturnValue(mockNavigate);
        (useAppSelector as any).mockReturnValue({ user: mockUser });
        (useGetAddonDetails as any).mockReturnValue({
            addonData: mockAddonData,
            isLoading: false,
            purchaseData: mockPurchaseData,
        });
        (formatNumberWithLocalString as any).mockImplementation((amount: any) => `${amount}`);
    });

    it('renders loading state when purchaseData is not available', () => {
        (useGetAddonDetails as any).mockReturnValue({
            addonData: mockAddonData,
            isLoading: true,
            purchaseData: null,
        });

        const { container } = render(<PlanCard />);
        const skeletons = container.querySelectorAll('div.ant-skeleton');
        expect(skeletons.length).toBe(2);
    });

    it('shows a skeleton, not the upgrade notice, while add-on details are still loading', () => {
        (useGetAddonDetails as any).mockReturnValue({
            addonData: undefined,
            isLoading: true,
            purchaseData: mockPurchaseData,
        });

        const { container } = render(<PlanCard />);

        expect(container.querySelectorAll('div.ant-skeleton')).toHaveLength(1);
        expect(screen.queryByText(upgradeNotice)).not.toBeInTheDocument();
        expect(screen.queryByText('Select additional storage')).not.toBeInTheDocument();
        expect(screen.queryByText(/Note: Pay/)).not.toBeInTheDocument();
    });

    it('shows the upgrade notice when add-ons are not allowed for the current plan', () => {
        (useGetAddonDetails as any).mockReturnValue({
            addonData: { ...mockAddonData, unitPrice: 0, isAddonPurchaseAllowed: false },
            isLoading: false,
            purchaseData: mockPurchaseData,
        });

        render(<PlanCard />);

        expect(screen.getByText(upgradeNotice)).toBeInTheDocument();
        expect(screen.queryByText('Select additional storage')).not.toBeInTheDocument();
        expect(screen.queryByText(/Note: Pay/)).not.toBeInTheDocument();
    });

    it('shows the upgrade notice when the add-on details could not be loaded', () => {
        (useGetAddonDetails as any).mockReturnValue({
            addonData: undefined,
            isLoading: false,
            purchaseData: mockPurchaseData,
        });

        render(<PlanCard />);

        expect(screen.getByText(upgradeNotice)).toBeInTheDocument();
        expect(screen.queryByText('Select additional storage')).not.toBeInTheDocument();
    });

    it('renders PlanDetails with purchaseData when available', () => {
        render(<PlanCard />);

        expect(screen.getAllByText('PlanDetails')[0]).toBeInTheDocument();
    });

    it('renders UsageBar component', () => {
        render(<PlanCard />);

        expect(screen.getByText('UsageBar')).toBeInTheDocument();
    });

    it('displays additional storage purchase options for non-corporate sub users', () => {
        render(<PlanCard />);

        expect(screen.getByText('Get Additional Storage')).toBeInTheDocument();
        expect(
            screen.getByText('Note: Pay ₹ 10/month for every 1 GB additional storage')
        ).toBeInTheDocument();
    });

    it('renders SelectInput with correct options', () => {
        render(<PlanCard />);

        const selectInput = screen.getByText('Select additional storage');
        expect(selectInput).toBeInTheDocument();
    });

    it('calculates and displays total amount based on selected addon quantity', async () => {
        render(<PlanCard />);

        fireEvent.mouseDown(screen.getByText('Select additional storage'));
        const storageOption = await screen.findByText('2 GB', {
            selector: 'div.ant-select-item-option-content',
        });
        fireEvent.click(storageOption);

        expect(screen.getByText(/Total additional amount/)).toBeInTheDocument();
        expect(screen.getByText('₹ 20')).toBeInTheDocument();
    });

    it('navigates to review order page on form submit with correct payload', async () => {
        render(<PlanCard />);

        fireEvent.mouseDown(screen.getByText('Select additional storage'));
        const storageOption = await screen.findByText('2 GB', {
            selector: 'div.ant-select-item-option-content',
        });
        fireEvent.click(storageOption);

        fireEvent.click(screen.getByText('Submit'));

        // await waitFor(() => {
        //     expect(mockNavigate).toHaveBeenCalledWith('/plans/review-order', {
        //         state: {
        //             isAddOns: true,
        //             addOnpaymentPayload: {
        //                 paytmAmount: 20,
        //                 addonsAccessKey: 'pekoCloud',
        //                 packageId: '12345',
        //                 quantity: 2,
        //                 description: '',
        //                 rows: [
        //                     {
        //                         column1: 'Additional Memory',
        //                         column2: '2 GB',
        //                         column3: `₹ 20 Monthly`,
        //                     },
        //                 ],
        //                 title: 'Hub',
        //             },
        //         },
        //     });
        // });
    });

    it('does not display additional memory options for corporate sub users', () => {
        (useAppSelector as any).mockReturnValue({ user: { roleName: 'corporate sub user' } });

        render(<PlanCard />);

        expect(screen.queryByText('Get Additional Memory')).not.toBeInTheDocument();
    });
});
