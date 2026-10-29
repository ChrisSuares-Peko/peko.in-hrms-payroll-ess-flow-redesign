import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import HistoryResultCard from '../../components/orderDetail/HistoryResultCard';
import { HistoryResult } from '../../types/index';

// Resolves a bundled asset by body type; irrelevant to what this card asserts.
vi.mock('../../../turbo/utils/getVehicleImage', () => ({ default: () => 'car.svg' }));

// Exactly what the backend's normaliseHistoryResult produces from the captured Droom
// payload (DROOM_MYBIZ_API_REFERENCE.md §4). The card must not reinterpret any of it.
const result: HistoryResult = {
    modelName: 'HYUNDAI MOTOR INDIA LTD CRETA VTVT 1.6 SX PLUS AUTO',
    registrationNumber: 'HR26DD9739',
    ownership: 'KHUSHBU KUMARI (Owner 1)',
    registration: '21 Apr 2017 · SDM GURUGRAM, HARYANA',
    insurance: 'HDFC ERGO GENERAL INSURANCE COMPANY LTD · valid to 27 Mar 2027',
    puc: 'Valid to 06 Jun 2026',
    blacklist: 'Not blacklisted',
    hypothecation: 'Yes — loan on record',
    bodyType: 'S.U.V.',
    fuelType: 'PETROL',
};

describe('HistoryResultCard', () => {
    it('renders every field the RC lookup returned', () => {
        render(<HistoryResultCard result={result} />);

        expect(screen.getByText(result.modelName)).toBeInTheDocument();
        expect(screen.getByText('HR26DD9739')).toBeInTheDocument();
        expect(screen.getByText('KHUSHBU KUMARI (Owner 1)')).toBeInTheDocument();
        expect(screen.getByText('21 Apr 2017 · SDM GURUGRAM, HARYANA')).toBeInTheDocument();
        expect(screen.getByText('Valid to 06 Jun 2026')).toBeInTheDocument();
        expect(screen.getByText('Not blacklisted')).toBeInTheDocument();
        expect(screen.getByText('Yes — loan on record')).toBeInTheDocument();
    });

    // The RC endpoint does not return challans. An empty "Challans" cell would read as
    // "none found", which is a claim this report cannot make.
    it('omits the challans row entirely when there is no challan data', () => {
        render(<HistoryResultCard result={result} />);

        expect(screen.queryByText('Challans')).not.toBeInTheDocument();
    });

    it('shows the challans row once something populates it', () => {
        render(<HistoryResultCard result={{ ...result, challans: '2 pending — ₹ 1,500' }} />);

        expect(screen.getByText('Challans')).toBeInTheDocument();
        expect(screen.getByText('2 pending — ₹ 1,500')).toBeInTheDocument();
    });

    // A sparse RC response still has to render — the backend substitutes "Not available"
    // rather than leaving a blank cell.
    it('renders the not-available placeholders without breaking', () => {
        render(
            <HistoryResultCard
                result={{
                    modelName: 'HR26DD9739',
                    registrationNumber: 'HR26DD9739',
                    ownership: 'Not available',
                    registration: 'Not available',
                    insurance: 'Not available',
                    puc: 'Not available',
                    blacklist: 'Not blacklisted',
                    hypothecation: 'Not available',
                }}
            />
        );

        expect(screen.getAllByText('Not available').length).toBe(5);
    });
});
