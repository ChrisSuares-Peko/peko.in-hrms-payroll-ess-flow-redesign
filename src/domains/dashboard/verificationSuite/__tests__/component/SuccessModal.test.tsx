import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import SuccessModal from '../../components/SuccessModal';

vi.mock('react-lottie', () => ({
    default: () => <div data-testid="lottie" />,
}));

describe('SuccessModal (live verify)', () => {
    it('renders a valid PAN result with its remarks/name-match/dob-match fields', () => {
        render(
            <SuccessModal
                isOpen
                handleCancel={vi.fn()}
                data={{
                    accessKey: 'pan_verify',
                    serviceName: 'PAN',
                    panStatus: 'valid',
                    remarks: 'PAN is valid',
                    nameMatch: 'Name matches',
                    dateOfBirthMatch: 'Date of birth matches',
                }}
            />
        );

        // capitalizeFirstLetter title-cases every non-numeric value, so the raw
        // "PAN is valid"/"Name matches" inputs render with adjusted casing.
        expect(screen.getAllByText(/PAN is Valid/i).length).toBeGreaterThan(0);
        expect(screen.getByText('Remarks')).toBeInTheDocument();
        expect(screen.getByText('Pan is Valid')).toBeInTheDocument();
        expect(screen.getByText('Name Matches')).toBeInTheDocument();
        expect(screen.getByText('Valid')).toBeInTheDocument();
    });

    it('shows an amber warning icon/message but a Valid status for a PAN name/DOB mismatch', () => {
        render(
            <SuccessModal
                isOpen
                handleCancel={vi.fn()}
                data={{
                    accessKey: 'pan_verify',
                    serviceName: 'PAN',
                    panStatus: 'valid',
                    remarks: 'PAN is valid',
                    nameMatch: 'Name does not match',
                    dateOfBirthMatch: 'Date of birth does not match',
                }}
            />
        );

        // The heading is a human-friendly sentence built from which fields
        // mismatched, matching the bank account case's style.
        expect(
            screen.getAllByText('PAN is valid but the name and date of birth do not match.')
                .length
        ).toBeGreaterThan(0);
        // The individual detail fields below still go through
        // capitalizeFirstLetter like every other field.
        // Overall status stays Valid (green) — the mismatch is only surfaced via
        // the amber icon/heading, same treatment as the bank account case.
        expect(screen.getByText('Valid')).toBeInTheDocument();
        expect(screen.getByText('Name Does Not Match')).toBeInTheDocument();
        expect(screen.getByText('Date of Birth Does Not Match')).toBeInTheDocument();
    });

    it('shows an amber warning icon/message but a Valid status for a bank account name mismatch, and still renders the resolved account details', () => {
        render(
            <SuccessModal
                isOpen
                handleCancel={vi.fn()}
                data={{
                    accessKey: 'bank_account_verify',
                    serviceName: 'Bank Account',
                    accountHolderName: 'JAIN FLOUR MILL',
                    isNameMatched: false,
                    matchPercentage: 19,
                }}
            />
        );

        expect(
            screen.getAllByText('Account verified but name mismatched.').length
        ).toBeGreaterThan(0);
        // Overall status stays Valid (green) — the mismatch is only surfaced via
        // the amber icon/heading, not by downgrading the Status badge.
        expect(screen.getByText('Valid')).toBeInTheDocument();
        expect(screen.getByText('Account Holder Name')).toBeInTheDocument();
        // capitalizeFirstLetter title-cases the raw "JAIN FLOUR MILL" value.
        expect(screen.getByText('Jain Flour Mill')).toBeInTheDocument();
        expect(screen.getByText('Name Match')).toBeInTheDocument();
        expect(screen.getByText('No')).toBeInTheDocument();
        expect(screen.getByText('Match Percentage')).toBeInTheDocument();
        expect(screen.getByText('19%')).toBeInTheDocument();
    });

    it('splits the GST-by-PAN Principal Place of Business address across multiple lines', () => {
        render(
            <SuccessModal
                isOpen
                handleCancel={vi.fn()}
                data={{
                    accessKey: 'gstin_pan',
                    serviceName: 'GSTIN',
                    gstin: '24AAACJ2440E2ZV',
                    lgnm: 'JOHN DOE PRIVATE LIMITED',
                    tradeNam: 'John Doe Private Limited',
                    sts: 'Active',
                    dty: 'Regular',
                    ctb: 'Private Limited Company',
                    rgdt: '01/07/2017',
                    lstupdt: '14/04/2018',
                    nba: ['Service Provision'],
                    stj: 'Ghatak 9 (Ahmedabad)',
                    ctj: 'RANGE I',
                    pradr: {
                        addr: {
                            bno: '123',
                            bnm: 'ABC Lakeview Tower',
                            st: 'Opp. Vastrapur Lake',
                            loc: 'Vastrapur',
                            stcd: 'Gujarat',
                            pncd: '380015',
                        },
                    },
                }}
            />
        );

        expect(screen.getByText('GSTINs Fetched Successfully')).toBeInTheDocument();
        expect(screen.getByText('123, ABC Lakeview Tower')).toBeInTheDocument();
        expect(screen.getByText('Opp. Vastrapur Lake')).toBeInTheDocument();
        expect(screen.getByText('Vastrapur, Gujarat, 380015')).toBeInTheDocument();
    });

    it('shows the GSTINs not found title when no gstin is present', () => {
        render(
            <SuccessModal
                isOpen
                handleCancel={vi.fn()}
                data={{ accessKey: 'gstin_pan', serviceName: 'GSTIN' }}
            />
        );

        expect(screen.getByText('GSTINs not found')).toBeInTheDocument();
    });
});
