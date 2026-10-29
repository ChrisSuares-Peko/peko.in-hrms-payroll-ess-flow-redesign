import { createRef } from 'react';

import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import SellerStep from '../../../components/generateIrn/SellerStep';
import { defaultSellerValues } from '../../../constants/generateIrn';
import { StepHandle } from '../../../types/generateIrn';

vi.mock('../../../forms/generateIrn/SellerForm', () => ({
    default: () => <div data-testid="seller-form" />,
}));

const validSeller = {
    ...defaultSellerValues,
    sellerGstin: '29ABCDE1234F1Z5',
    legalName: 'Acme Pvt Ltd',
    tradeName: 'Acme',
    address1: 'Main Street',
    location: 'Bengaluru',
    pinCode: '560001',
    state: 'Karnataka',
};

const defaultProps = {
    stateOptions: [],
    isLoadingStates: false,
    isSellerDefaultsLoading: false,
};

describe('SellerStep', () => {
    it('renders the seller form', () => {
        render(<SellerStep {...defaultProps} initialValues={validSeller} onNext={vi.fn()} />);
        expect(screen.getByTestId('seller-form')).toBeInTheDocument();
    });

    it('invokes onNext on imperative submit when values pass validation', async () => {
        const onNext = vi.fn();
        const ref = createRef<StepHandle>();
        render(<SellerStep {...defaultProps} ref={ref} initialValues={validSeller} onNext={onNext} />);
        await act(async () => {
            await ref.current?.submit();
        });
        expect(onNext).toHaveBeenCalled();
        expect(onNext.mock.calls[0][0]).toEqual(expect.objectContaining(validSeller));
    });
});
