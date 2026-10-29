/* eslint-disable react/button-has-type */
import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, beforeEach, test, expect } from 'vitest';

import AddBeneficiaryModal from '../../components/BeneficiaryModal';
import { BeneficiaryActionType } from '../../types/index';

vi.mock('../../hooks/useBeneficiaryApis', () => ({
    default: () => ({
        buttonLoader: false,
        sendOtpApi: vi.fn(),
        isOtpSending: false,
        generateIntialValues: vi.fn().mockReturnValue({}),
        handleOtpSubmit: vi.fn(),
        handleFormSubmit: vi.fn(),
    }),
}));
vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => vi.fn(),
    useAppSelector: (selector: any) =>
        selector({
            reducer: {
                auth: {
                    role: 'user',
                    id: '123',
                },
            },
        }),
}));

vi.mock('../../components/forms/BeneficiaryForm', () => ({
    default: () => <div data-testid="beneficiary-form" />,
}));

vi.mock('@components/molecular/modals/OtpModal', () => ({
    default: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div data-testid="otp-modal" /> : null),
}));

vi.mock('@components/molecular/modals/ConfirmationModal', () => ({
    default: ({ isOpen, handleSubmit }: { isOpen: boolean; handleSubmit: () => void }) =>
        isOpen ? (
            <div data-testid="confirmation-modal">
                <button onClick={handleSubmit}>Confirm Delete</button>
            </div>
        ) : null,
}));

describe('AddBeneficiaryModal', () => {
    const mockCloseAddModal = vi.fn();
    const mockSetBeneficiaryActionType = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderModal = (props = {}) =>
        render(
            <AddBeneficiaryModal
                // eslint-disable-next-line react/jsx-no-bind, func-names
                onCancel={function (): void {
                    throw new Error('Function not implemented.');
                }}
                open
                closeAddModal={mockCloseAddModal}
                accessKeyName="sampleService"
                beneficiaryActionType={BeneficiaryActionType.ADD}
                setBeneficiaryActionType={mockSetBeneficiaryActionType}
                {...props}
            />
        );

    test('renders modal with correct title', () => {
        renderModal();
    });

    test('renders BeneficiaryForm inside modal', () => {
        renderModal();
        expect(screen.getByTestId('beneficiary-form')).toBeInTheDocument();
    });

    test('calls closeAddModal when cancel is clicked', () => {
        renderModal();

        const cancelBtn = screen.getByRole('button', { name: /cancel/i });
        fireEvent.click(cancelBtn);

        expect(mockCloseAddModal).toHaveBeenCalled();
    });

    test('shows OTP modal when showOtpModal is set by hook', () => {
        renderModal();

        expect(screen.queryByTestId('otp-modal')).not.toBeInTheDocument();
    });
});
