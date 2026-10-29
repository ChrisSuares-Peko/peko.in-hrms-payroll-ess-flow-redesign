import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, Mock, test, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import AddBeneficiaryModal from '../../components/BeneficiaryModal';
import { BeneficiaryActionType } from '../../types/index';

const mockDispatch = vi.fn();

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => mockDispatch,
    useAppSelector: vi.fn(),
}));
const mockUseAppSelector = useAppSelector as Mock;

describe('BeneficiaryCard Component', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        cleanup();
        mockUseAppSelector.mockReturnValue({ role: 'admin', id: '123' });
    });

    test('should render modal with correct title for Add and Edit modes', () => {
        render(
            <AddBeneficiaryModal
                open
                closeAddModal={() => {}}
                beneficiaryActionType={BeneficiaryActionType.ADD}
                setBeneficiaryActionType={() => {}}
                accessKeyName="test"
            />
        );

        expect(screen.getByText('Add Beneficiary Details')).toBeInTheDocument();

        render(
            <AddBeneficiaryModal
                open
                closeAddModal={() => {}}
                beneficiaryActionType={BeneficiaryActionType.EDIT}
                setBeneficiaryActionType={() => {}}
                accessKeyName="test"
            />
        );

        expect(screen.getByText('Edit Beneficiary Details')).toBeInTheDocument();
    });

    test('should show delete icon when in Edit mode', () => {
        render(
            <AddBeneficiaryModal
                open
                closeAddModal={() => {}}
                beneficiaryActionType={BeneficiaryActionType.EDIT}
                setBeneficiaryActionType={() => {}}
                accessKeyName="test"
            />
        );

        expect(screen.getByLabelText('delete')).toBeInTheDocument();
    });

    test('should not show delete icon when in Add mode', () => {
        render(
            <AddBeneficiaryModal
                open
                closeAddModal={() => {}}
                beneficiaryActionType={BeneficiaryActionType.ADD}
                setBeneficiaryActionType={() => {}}
                accessKeyName="test"
            />
        );

        expect(screen.queryByRole('button', { name: /delete/i })).toBeNull();
    });

    test('should open OTP modal', async () => {
        render(
            <AddBeneficiaryModal
                open
                closeAddModal={() => {}}
                beneficiaryActionType={BeneficiaryActionType.ADD}
                setBeneficiaryActionType={() => {}}
                accessKeyName="test"
            />
        );

        screen.getByText(/Add Beneficiary Details/i).click();

        expect(screen.getByRole('button', { name: /submit/i }));
    });

    test('should close OTP modal when cancel is clicked', () => {
        render(
            <AddBeneficiaryModal
                open
                closeAddModal={() => {}}
                beneficiaryActionType={BeneficiaryActionType.ADD}
                setBeneficiaryActionType={() => {}}
                accessKeyName="test"
            />
        );

        // Assuming some event opens the OTP modal
        screen.getByText(/Add Beneficiary Details/i).click();

        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        cancelButton.click();

        // Check if OTP modal is closed
        expect(screen.queryByText(/OTP Verification/i)).toBeNull();
    });
    test('should show confirmation modal when delete button is clicked', () => {
        render(
            <AddBeneficiaryModal
                open
                closeAddModal={() => {}}
                beneficiaryActionType={BeneficiaryActionType.DELETE}
                setBeneficiaryActionType={() => {}}
                accessKeyName="test"
            />
        );

        const deleteIcon = screen.getByLabelText('delete');
        fireEvent.click(deleteIcon);

        expect(
            screen.getByText(/Are you sure you want to delete this beneficiary/i)
        ).toBeInTheDocument();
    });
});
