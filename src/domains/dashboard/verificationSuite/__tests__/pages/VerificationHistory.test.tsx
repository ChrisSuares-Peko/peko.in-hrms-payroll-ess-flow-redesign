import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { paths } from '@src/routes/paths';

import VerificationHistory from '../../pages/VerificationHistory';
import { setverificationResponse } from '../../slices/verificationSlice';

const mockDispatch = vi.fn();
const mockNavigate = vi.fn();

vi.mock('react-redux', () => ({
    useDispatch: () => mockDispatch,
}));

vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

vi.mock('../../components/HistoryHeader', () => ({
    default: () => <div data-testid="history-header" />,
}));

let mockHistory: any[] = [];

vi.mock('../../hooks/useHistoryApi', () => ({
    default: () => ({
        isLoading: false,
        count: mockHistory.length,
        history: mockHistory,
        downloadReport: vi.fn(),
    }),
}));

vi.mock('../../hooks/useFilter', () => ({
    default: () => ({
        handlePageChange: vi.fn(),
        handleDateChange: vi.fn(),
        handleFromChange: vi.fn(),
        handleToChange: vi.fn(),
        handleChangeFilters: vi.fn(),
    }),
}));

vi.mock('@src/hooks/useDebounceSearch', () => ({
    default: () => ({
        searchText: '',
        updateSearchText: vi.fn(),
    }),
}));

// GenericTable pulls in real antd Table + a window-resize based column-fitting
// algorithm that is irrelevant to what we're testing here (the column render
// functions defined inside VerificationHistory). Stub it out so every column
// renders directly, regardless of viewport width.
vi.mock('@components/atomic/GenericTable', () => ({
    default: ({ columns, dataSource }: any) => (
        <table>
            <tbody>
                {dataSource.map((record: any) => (
                    <tr key={record.id}>
                        {columns.map((col: any) => (
                            <td key={col.key}>
                                {col.render
                                    ? col.render(record[col.dataIndex], record)
                                    : record[col.dataIndex]}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    ),
}));

describe('VerificationHistory', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockHistory = [];
    });

    it('formats raw verificationType values into their display labels', () => {
        mockHistory = [
            { id: '1', createdAt: '2024-01-15T10:00:00.000Z', verificationType: 'pan', status: 'VALID', inputPayload: {} },
            { id: '2', createdAt: '2024-02-10T09:00:00.000Z', verificationType: 'aadhaar', status: 'VALID', inputPayload: {} },
            { id: '3', createdAt: '2024-03-05T09:00:00.000Z', verificationType: 'Director Verify CIN', status: 'VALID', inputPayload: {} },
            { id: '4', createdAt: '2024-04-05T09:00:00.000Z', verificationType: 'GSTIN with PAN', status: 'VALID', inputPayload: {} },
            { id: '5', createdAt: '2024-05-05T09:00:00.000Z', verificationType: 'Aadhaar Card', status: 'VALID', inputPayload: {} },
            { id: '6', createdAt: '2024-06-05T09:00:00.000Z', verificationType: 'Advance PAN Verification', status: 'VALID', inputPayload: {} },
        ];

        render(<VerificationHistory />);

        expect(screen.getByText('PAN')).toBeInTheDocument();
        expect(screen.getByText('Aadhaar')).toBeInTheDocument();
        expect(screen.getByText("Director's CIN")).toBeInTheDocument();
        expect(screen.getByText('Fetch GSTIN from PAN')).toBeInTheDocument();
        expect(screen.getByText('Aadhaar OKYC')).toBeInTheDocument();
        expect(screen.getByText('Advance PAN')).toBeInTheDocument();
    });

    it('distinguishes gst_business_verify from gstin_verify even when both report the same raw type text', () => {
        mockHistory = [
            {
                id: '1',
                createdAt: '2024-01-15T10:00:00.000Z',
                verificationType: 'GSTIN',
                accessKey: 'gstin_verify',
                status: 'VALID',
                inputPayload: {},
            },
            {
                id: '2',
                createdAt: '2024-01-16T10:00:00.000Z',
                verificationType: 'GSTIN',
                accessKey: 'gst_business_verify',
                status: 'VALID',
                inputPayload: {},
            },
        ];

        render(<VerificationHistory />);

        expect(screen.getByText('GSTIN')).toBeInTheDocument();
        expect(screen.getByText('GSTIN Business')).toBeInTheDocument();
    });

    it('formats Input Details field labels/keys via formatServiceField', () => {
        mockHistory = [
            {
                id: '1',
                createdAt: '2024-01-15T10:00:00.000Z',
                verificationType: 'pan',
                status: 'VALID',
                inputPayload: {
                    pan: 'ABCDE1234F',
                    dob: '1990-01-01',
                    dl_number: 'DL1234567890123',
                    phone: '9876543210',
                    GSTIN: '22AAAAA0000A1Z5',
                    epic_number: 'ABC1234567',
                },
            },
        ];

        render(<VerificationHistory />);

        expect(screen.getByText('PAN: ABCDE1234F')).toBeInTheDocument();
        expect(screen.getByText('DOB: 1990-01-01')).toBeInTheDocument();
        expect(screen.getByText('DL Number: DL1234567890123')).toBeInTheDocument();
        expect(screen.getByText('Mobile Number: 9876543210')).toBeInTheDocument();
        expect(screen.getByText('GSTIN: 22AAAAA0000A1Z5')).toBeInTheDocument();
        expect(screen.getByText('EPIC Number: ABC1234567')).toBeInTheDocument();
    });

    it('shows the raw record status directly, including for a bank_account_verify name mismatch', () => {
        mockHistory = [
            {
                id: '1',
                createdAt: '2024-01-15T10:00:00.000Z',
                verificationType: 'Bank Account',
                status: 'VALID',
                accessKey: 'bank_account_verify',
                responsePayload: { IsMatched: false },
                inputPayload: {},
            },
            {
                id: '2',
                createdAt: '2024-01-16T10:00:00.000Z',
                verificationType: 'Bank Account',
                status: 'VALID',
                accessKey: 'bank_account_verify',
                responsePayload: { IsMatched: true },
                inputPayload: {},
            },
            {
                id: '3',
                createdAt: '2024-01-17T10:00:00.000Z',
                verificationType: 'PAN Verification',
                status: 'INVALID',
                inputPayload: {},
            },
        ];

        render(<VerificationHistory />);

        // The Result column trusts the record's own status field directly — a
        // bank account name mismatch is still an overall Valid result (the
        // mismatch is only surfaced on the details view, not in this table).
        const validBadges = screen.getAllByText('Valid');
        const invalidBadges = screen.getAllByText('Invalid');
        expect(validBadges).toHaveLength(2);
        expect(invalidBadges).toHaveLength(1);
    });

    it('enables View for both VALID and INVALID records and navigates with the clicked record', () => {
        const validRecord = {
            id: '1',
            createdAt: '2024-01-15T10:00:00.000Z',
            verificationType: 'PAN Verification',
            status: 'VALID',
            inputPayload: {},
        };
        const invalidRecord = {
            id: '2',
            createdAt: '2024-01-16T10:00:00.000Z',
            verificationType: 'PAN Verification',
            status: 'INVALID',
            inputPayload: {},
        };
        mockHistory = [validRecord, invalidRecord];

        render(<VerificationHistory />);

        const viewLinks = screen.getAllByText('View');
        expect(viewLinks).toHaveLength(2);

        fireEvent.click(viewLinks[1]);
        expect(mockDispatch).toHaveBeenCalledWith(setverificationResponse(invalidRecord));
        expect(mockNavigate).toHaveBeenCalledWith(paths.verificationSuite.verificationDetails);

        fireEvent.click(viewLinks[0]);
        expect(mockDispatch).toHaveBeenCalledWith(setverificationResponse(validRecord));
    });
});
