import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

import BeneficiaryVehicles from '../../components/BeneficiaryVehicles';
import { ChallanBeneficiary } from '../../types/index';

describe('BeneficiaryVehicles', () => {
    const base = { onFetch: vi.fn(), onAdd: vi.fn(), onEdit: vi.fn() };
    const beneficiaries: ChallanBeneficiary[] = [
        { id: '1', nickname: 'Truck A', vehicleNumber: 'KA01AB1234' },
    ];

    it('shows the empty state when there are no beneficiaries', () => {
        render(<BeneficiaryVehicles {...base} beneficiaries={[]} />);
        expect(screen.getByText('No Beneficiaries Found.')).toBeInTheDocument();
    });

    it('renders a beneficiary with its nickname and vehicle number', () => {
        render(<BeneficiaryVehicles {...base} beneficiaries={beneficiaries} />);
        expect(screen.getByText('Truck A')).toBeInTheDocument();
        expect(screen.getByText('KA01AB1234')).toBeInTheDocument();
    });

    it('fires onAdd when Add Beneficiary is clicked', () => {
        const onAdd = vi.fn();
        render(<BeneficiaryVehicles {...base} onAdd={onAdd} beneficiaries={[]} />);
        fireEvent.click(screen.getByText('Add Beneficiary'));
        expect(onAdd).toHaveBeenCalledTimes(1);
    });

    it('fires onEdit and onFetch from a beneficiary row', () => {
        const onEdit = vi.fn();
        const onFetch = vi.fn();
        render(
            <BeneficiaryVehicles
                {...base}
                onEdit={onEdit}
                onFetch={onFetch}
                beneficiaries={beneficiaries}
            />
        );

        fireEvent.click(screen.getByText('Edit'));
        expect(onEdit).toHaveBeenCalledWith(beneficiaries[0]);

        fireEvent.click(screen.getByText('Fetch Challans'));
        expect(onFetch).toHaveBeenCalledWith('KA01AB1234');
    });
});
