import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import InspectionResultCard from '../../components/orderDetail/InspectionResultCard';
import { InspectionBookingResult } from '../../types/index';

// Resolves a bundled asset by body type; irrelevant to what this card asserts.
vi.mock('../../../turbo/utils/getVehicleImage', () => ({ default: () => 'car.svg' }));

const booking: InspectionBookingResult = {
    slot1: '2026-08-05 14:00:00',
    slot2: '2026-08-06 10:00:00',
    address: '221B Residency Road, Bengaluru, Karnataka — 560001',
};

describe('InspectionResultCard', () => {
    it('renders both preferred slots and the address', () => {
        render(
            <InspectionResultCard booking={booking} vehicleModel="Kia Seltos HTX" bodyType="SUV" />
        );

        expect(screen.getByText('Kia Seltos HTX')).toBeInTheDocument();
        expect(screen.getByText('2026-08-05 14:00:00')).toBeInTheDocument();
        expect(screen.getByText('2026-08-06 10:00:00')).toBeInTheDocument();
        expect(screen.getByText(booking.address)).toBeInTheDocument();
    });

    // Slot 2 is an optional second preference on the booking form.
    it('omits the second slot row when only one was picked', () => {
        render(
            <InspectionResultCard
                booking={{ ...booking, slot2: undefined }}
                vehicleModel="Kia Seltos HTX"
            />
        );

        expect(screen.getByText('Preferred slot 1')).toBeInTheDocument();
        expect(screen.queryByText('Preferred slot 2')).not.toBeInTheDocument();
    });
});
