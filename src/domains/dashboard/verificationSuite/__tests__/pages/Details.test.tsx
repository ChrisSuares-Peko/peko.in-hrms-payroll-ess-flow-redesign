import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import Details from '../../pages/Details';

vi.mock('react-lottie', () => ({
    __esModule: true,
    default: () => <div data-testid="lottie-mock" />,
}));

let mockRecord: any = {};

vi.mock('@src/hooks/store', () => ({
    useAppSelector: (selector: any) =>
        selector({
            reducer: {
                verificationSuite: { verificationResponse: mockRecord },
            },
        }),
}));

describe('Details', () => {
    it('renders a valid PAN history record via normalizeResponsePayload (pan_verify)', () => {
        mockRecord = {
            accessKey: 'pan_verify',
            verificationType: 'PAN Verification',
            createdAt: '2024-01-15T10:00:00.000Z',
            referenceNumber: 'REF-PAN-1',
            inputPayload: { pan: 'ABCDE1234F', name: 'John Doe' },
            responsePayload: {
                StatusDesc: {
                    status: 'VALID',
                    remarks: 'Valid',
                    name_as_per_pan_match: 'Yes',
                    date_of_birth_match: 'No',
                },
            },
        };

        render(<Details />);

        // panStatus === 'VALID' drives the success layout/heading.
        expect(screen.getByText('PAN Verification is Valid')).toBeInTheDocument();
        expect(screen.getByText('REF-PAN-1')).toBeInTheDocument();
        // nameMatch / dateOfBirthMatch fields sourced from the normalized payload.
        expect(screen.getByText('Yes')).toBeInTheDocument();
        expect(screen.getByText('No')).toBeInTheDocument();
    });

    it('renders GSTIN-from-PAN nested under StatusDesc[0].data as Valid', () => {
        mockRecord = {
            accessKey: 'gstin_pan',
            verificationType: 'GSTIN with PAN',
            createdAt: '2024-02-10T10:00:00.000Z',
            inputPayload: { pan_no: 'ABCDE1234F', state_code: '27' },
            responsePayload: {
                StatusDesc: [
                    {
                        data: {
                            status: 'VALID',
                            gstin: '27AAAAA0000A1Z5',
                            gstin_list: [
                                { gstin: '27BBBBB1111B2Z6', state: 'Maharashtra', status: 'Active' },
                            ],
                        },
                    },
                ],
            },
        };

        render(<Details />);

        expect(screen.getAllByText('GSTINs Fetched Successfully').length).toBeGreaterThan(0);
        expect(screen.getByText('Linked GSTINs')).toBeInTheDocument();
        expect(screen.getByText('27AAAAA0000A1Z5')).toBeInTheDocument();
        expect(screen.getByText('27BBBBB1111B2Z6')).toBeInTheDocument();
    });

    it('renders bank_account_verify name-mismatch as a warning but still shows account holder/match details', () => {
        mockRecord = {
            accessKey: 'bank_account_verify',
            verificationType: 'Bank Account',
            createdAt: '2024-03-05T10:00:00.000Z',
            inputPayload: { bank_account: '11400210001004', ifsc: 'HDFC0000123', name: 'Jane Roe' },
            responsePayload: {
                BankResponse: 'JANE R',
                IsMatched: false,
                Percentage: 62,
            },
        };

        render(<Details />);

        // A name mismatch is a partial-success case: overall status stays Valid
        // (the account itself was resolved), and the mismatch is only surfaced
        // via an amber warning icon/heading, not a downgraded status badge.
        expect(
            screen.getAllByText('Account verified but name mismatched.').length
        ).toBeGreaterThan(0);
        expect(screen.getByText('Valid')).toBeInTheDocument();
        // ...and the mismatch details are still shown.
        expect(screen.getByText('Jane R')).toBeInTheDocument();
        expect(screen.getByText('No')).toBeInTheDocument();
        expect(screen.getByText('62%')).toBeInTheDocument();
    });
});
